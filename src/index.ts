import { Signal } from "signal-polyfill";

export type StateObject = Record<string | number | symbol, any>;
export type StatePrimitive = string | number | boolean | null | undefined;

/**
 * Setter for the store.
 * Can be either a value or a function that receives the current state and returns the new state.
 * @see {@link Store}
 */
export type Setter<T extends StateObject | StatePrimitive> =
	| T
	| ((state: T) => T);

// For select key results: arrays and index-signature records should yield possibly undefined,
// while known object keys should remain defined.
export type SelectValue<S, K extends keyof S> = S extends readonly (infer U)[] // Arrays: any index access may be out of bounds
	? U | undefined
	: // Index-signature records: broad key access may be missing
		string extends keyof S
		? S[K] | undefined
		: number extends keyof S
			? S[K] | undefined
			: S[K];

// Make `select` always present but typed as undefined when the state may not be an object
export type SelectFn<T extends StateObject | StatePrimitive> =
	T extends StateObject
		? <K extends keyof T>(key: K) => Store<SelectValue<T, K>>
		: undefined;

export type Store<T extends StateObject | StatePrimitive> = {
	/**
	 * Get the current state of the store.
	 * @example
	 * const state = store(0).get();
	 * console.log(state); // 0
	 */
	get: () => T;
	/**
	 * Get the initial state of the store.
	 * @example
	 * const initial = store(0).getInitial();
	 * console.log(initial); // 0
	 */
	getInitial: () => T;
	/**
	 * Set the state of the store.
	 * Can pass either a value or a function that receives the current state and returns the new state.
	 *
	 * @example
	 * const countStore = store(0);
	 * const increment = () => countStore.set((count) => count + 1);
	 * const setToZero = () => countStore.set(0);
	 */
	set: (setter: Setter<T>) => void;
	/**
	 * Subscribe to the state of the store.
	 * Returns a function to unsubscribe.
	 *
	 * @param callback - The callback to subscribe to.
	 * @returns A function to unsubscribe.
	 * @example
	 * const countStore = store(0);
	 * const unsubscribe = countStore.subscribe((count) => {
	 *   console.log(count);
	 * });
	 *
	 * // On component unmount or other cleanup:
	 * unsubscribe();
	 *
	 */
	subscribe: (callback: (state: T) => void) => () => void;
	/**
	 * Select a key from the state of the store.
	 * This returns a new store with the selected key as the state.
	 * @example
	 * const documentStore = store({
	 *   title: "Untitled",
	 * });
	 *
	 * const titleStore = documentStore.select("title");
	 * console.log(titleStore.get()); // "Untitled"
	 *
	 * titleStore.set("New Title");
	 * console.log(titleStore.get()); // "New Title"
	 * console.log(documentStore.get()); // { title: "New Title" }
	 */
	select: SelectFn<T>;
};

/**
 * Creates a store with properties for getting, setting, subscribing to, and selecting from the state.
 *
 * @param initial - The initial state of the store.
 * @returns A store with the initial state applied.
 * @example
 * // Infer types from the initial state
 * const documentStore = store({
 *   title: "Untitled",
 *   createdAt: new Date(),
 *   authors: [] as string[],
 * });
 *
 * // Or manually specify the type
 * type DocumentStore = {
 *   title: string;
 *   createdAt: Date;
 *   authors: string[];
 * }
 * const documentStore = store<DocumentStore>({
 *   title: "Untitled",
 *   createdAt: new Date(),
 *   authors: [],
 * });
 */
export function store(initial: number): Store<number>;
export function store(initial: string): Store<string>;
export function store(initial: boolean): Store<boolean>;
export function store<T extends StateObject | StatePrimitive>(
	initial: T,
): Store<T>;
export function store<T extends StateObject | StatePrimitive>(
	initial: T,
): Store<T> {
	const state = new Signal.State<T>(initial);
	const getInitial = () => initial;
	const get = () => state.get();
	const set = (setter: Setter<T>) =>
		state.set(typeof setter === "function" ? setter(state.get()) : setter);
	return createStoreApi(getInitial, get, set);
}

const createStoreApi = <S extends StateObject | StatePrimitive>(
	getInitial: () => S,
	get: () => S,
	set: (setter: Setter<S>) => void,
): Store<S> => {
	const subscribe = (callback: (state: S) => void) => {
		// Track the previous value to avoid unnecessary updates when effects are triggered.
		// Each subscriber tracks its own previous value to avoid duplicate callbacks
		let previousValue: S | undefined;

		return effect(() => {
			const value = get();
			if (!Object.is(previousValue, value)) {
				previousValue = value;
				callback(value);
			}
		});
	};

	if (isStatePrimitive(get())) {
		return {
			get,
			getInitial,
			set,
			subscribe,
			select: undefined as SelectFn<S>,
		};
	}

	function select<K extends keyof S>(key: K): Store<SelectValue<S, K>> {
		const getInitialSelected = (): SelectValue<S, K> => {
			const initialState = getInitial();
			if (isStatePrimitive(initialState)) {
				throw new Error(UNEXPECTED_SELECT_ERROR);
			}
			return initialState[key];
		};
		const getSelected = (): SelectValue<S, K> => {
			const state = get();
			if (isStatePrimitive(state)) {
				throw new Error(UNEXPECTED_SELECT_ERROR);
			}
			return state[key];
		};
		const setSelected = (setter: Setter<SelectValue<S, K>>) => {
			set((state) => {
				if (isStatePrimitive(state)) {
					throw new Error(UNEXPECTED_SELECT_ERROR);
				}
				const stateObj: StateObject = state;
				const prev = stateObj[key];
				const next =
					typeof setter === "function"
						? (setter as (s: SelectValue<S, K>) => SelectValue<S, K>)(prev)
						: setter;
				if (Object.is(prev, next)) return state;
				// Handle arrays separately to preserve array type
				if (Array.isArray(state)) {
					const newArray = [...state];
					newArray[key as number] = next;
					return newArray as unknown as S;
				}
				return { ...stateObj, [key]: next } as S;
			});
		};
		return createStoreApi(getInitialSelected, getSelected, setSelected);
	}

	return {
		get,
		getInitial,
		set,
		subscribe,
		select: select as SelectFn<S>,
	};
};

const UNEXPECTED_SELECT_ERROR =
	"Internal: select() was unexpectedly called on a state value that wasn't an object.";

function isStatePrimitive(state: unknown): state is StatePrimitive {
	return (
		typeof state === "string" ||
		typeof state === "number" ||
		typeof state === "boolean" ||
		state === null ||
		state === undefined
	);
}

let needsEnqueue = true;

const w = new Signal.subtle.Watcher(() => {
	if (needsEnqueue) {
		needsEnqueue = false;
		queueMicrotask(processPending);
	}
});

function processPending() {
	needsEnqueue = true;

	for (const s of w.getPending()) {
		s.get();
	}

	w.watch();
}

export function effect(callback: (() => void) | (() => () => void)) {
	let cleanup: (() => void) | undefined;

	const computed = new Signal.Computed(() => {
		typeof cleanup === "function" && cleanup();
		const callbackCleanup = callback();
		if (typeof callbackCleanup === "function") {
			cleanup = callbackCleanup;
		}
	});

	w.watch(computed);
	computed.get();

	return () => {
		w.unwatch(computed);
		typeof cleanup === "function" && cleanup();
		cleanup = undefined;
	};
}
