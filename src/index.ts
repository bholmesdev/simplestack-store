import { DEV } from "esm-env";
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
type NonNullableState<T> = T extends null | undefined ? never : T;

type SelectPath<T> = T extends StateObject
	? {
			[K in keyof Required<T>]:
				| [K]
				| (SelectPath<NonNullableState<SelectValue<T, K>>> extends infer P
						? P extends readonly any[]
							? [K, ...P]
							: [K]
						: [K]);
		}[keyof Required<T>]
	: never;

type SelectPathValue<T, P extends readonly PropertyKey[]> = T extends
	| null
	| undefined
	? undefined
	: P extends [infer K, ...infer Rest]
		? K extends keyof T
			? SelectPathValue<
					SelectValue<T, K>,
					Rest extends readonly PropertyKey[] ? Rest : []
				>
			: undefined
		: T;

export type SelectFn<T extends StateObject | StatePrimitive> =
	NonNullableState<T> extends StateObject
		? {
				<P extends SelectPath<NonNullableState<T>>>(
					...path: P
				): Store<SelectPathValue<T, P>>;
				<P extends SelectPath<NonNullableState<T>>>(
					...pathAndOptions: [...P, StoreOptions<SelectPathValue<T, P>>]
				): Store<SelectPathValue<T, P>>;
			}
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
	/**
	 * Optional cleanup for middleware init hooks.
	 */
	destroy: () => void;
};

export type StoreMiddleware<T extends StateObject | StatePrimitive> = (
	store: Store<T>,
) => {
	set?: (next: Store<T>["set"]) => Store<T>["set"];
	init?: () => void | (() => void);
};

export type StoreOptions<T extends StateObject | StatePrimitive> = {
	middleware?: StoreMiddleware<T>[];
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
export function store(
	initial: number,
	options?: StoreOptions<number>,
): Store<number>;
export function store(
	initial: string,
	options?: StoreOptions<string>,
): Store<string>;
export function store(
	initial: boolean,
	options?: StoreOptions<boolean>,
): Store<boolean>;
export function store<T extends StateObject | StatePrimitive>(
	initial: T,
	options?: StoreOptions<T>,
): Store<T>;
export function store<T extends StateObject | StatePrimitive>(
	initial: T,
	options?: StoreOptions<T>,
): Store<T> {
	const state = new Signal.State<T>(initial);
	const getInitial = () => initial;
	const get = () => state.get();
	const set = (setter: Setter<T>) =>
		state.set(typeof setter === "function" ? setter(state.get()) : setter);
	return createStoreApi(getInitial, get, set, {
		middleware: options?.middleware,
	});
}

const createStoreApi = <S extends StateObject | StatePrimitive>(
	getInitial: () => S,
	get: () => S,
	baseSet: (setter: Setter<S>) => void,
	options?: { selectable?: boolean; middleware?: StoreMiddleware<S>[] },
): Store<S> => {
	let set = baseSet;

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

	const warnDiscardedSet = (path: readonly PropertyKey[]) => {
		if (!DEV) return;
		const formatted = path
			.map((key) =>
				typeof key === "string" ? JSON.stringify(key) : String(key),
			)
			.join(", ");
		console.warn(
			"[@simplestack/store] set() was discarded because a select() path crossed a potentially undefined value:\n" +
				`select(${formatted})`,
		);
	};

	const getAtPath = (state: S, path: readonly PropertyKey[]) => {
		let current: any = state;
		for (const key of path) {
			if (isStatePrimitive(current)) return undefined;
			current = current[key as keyof typeof current];
		}
		return current as any;
	};

	const storeApi: Store<S> = {
		get,
		getInitial,
		set: (setter: Setter<S>) => set(setter),
		subscribe,
		select: undefined as SelectFn<S>,
		destroy: () => {},
	};

	function select<P extends SelectPath<NonNullableState<S>>>(
		...path: P
	): Store<SelectPathValue<S, P>>;
	function select<P extends SelectPath<NonNullableState<S>>>(
		...pathAndOptions: [...P, StoreOptions<SelectPathValue<S, P>>]
	): Store<SelectPathValue<S, P>>;
	function select<P extends SelectPath<NonNullableState<S>>>(
		...pathAndOptions:
			| P
			| [...P, StoreOptions<SelectPathValue<S, P>>]
	): Store<SelectPathValue<S, P>> {
      // Since select accepts variadic arguments, we need to check
      // if the last argument matches the StoreOptions signature. 
		const maybeOptions = pathAndOptions[pathAndOptions.length - 1];
		const hasOptions = isSelectOptions(maybeOptions);
		const path = (
			hasOptions ? pathAndOptions.slice(0, -1) : pathAndOptions
		) as P;
		const selectOptions = hasOptions
			? (maybeOptions as StoreOptions<SelectPathValue<S, P>>)
			: undefined;
		const getInitialSelected = () => getAtPath(getInitial(), path);
		const getSelected = () => getAtPath(get(), path);
		const setSelected = (setter: Setter<SelectPathValue<S, P>>) => {
			set((state) => {
				let current: any = state;
				const parents: any[] = [];
				const keys: PropertyKey[] = [];

				for (let i = 0; i < path.length - 1; i++) {
					const key = path[i];
					if (isStatePrimitive(current)) {
						warnDiscardedSet(path);
						return state;
					}
					parents.push(current);
					keys.push(key);
					current = current[key as keyof typeof current];
				}

				if (isStatePrimitive(current)) {
					warnDiscardedSet(path);
					return state;
				}

				const lastKey = path[path.length - 1];
				if (!Array.isArray(current) && !Object.hasOwn(current, lastKey)) {
					warnDiscardedSet(path);
					return state;
				}
				const prev = current[lastKey as keyof typeof current];
				const next =
					typeof setter === "function"
						? (setter as (s: SelectPathValue<S, P>) => SelectPathValue<S, P>)(
								prev,
							)
						: setter;

				if (Object.is(prev, next)) return state;

				let updated: any = Array.isArray(current)
					? [...current]
					: { ...(current as StateObject) };
				updated[lastKey as keyof typeof updated] = next;

				for (let i = parents.length - 1; i >= 0; i--) {
					const parent = parents[i];
					const key = keys[i];
					const cloned: any = Array.isArray(parent)
						? [...parent]
						: { ...(parent as StateObject) };
					cloned[key as any] = updated;
					updated = cloned;
				}

				return updated as S;
			});
		};
		return createStoreApi(getInitialSelected, getSelected, setSelected, {
			selectable: true,
			middleware: selectOptions?.middleware,
		});
	}

	const canSelect = options?.selectable ?? !isStatePrimitive(get());
	if (canSelect) {
		storeApi.select = select as SelectFn<S>;
	}

	if (options?.middleware?.length) {
		const entries = options.middleware.map((middleware) =>
			middleware(storeApi),
		);
		const setWrappers = entries
			.map((entry) => entry.set)
			.filter(
				(entry): entry is (next: Store<S>["set"]) => Store<S>["set"] =>
					typeof entry === "function",
			);

		if (setWrappers.length) {
			set = setWrappers.reduceRight((next, wrapper) => wrapper(next), set);
		}

		const cleanups = entries
			.map((entry) => entry.init?.())
			.filter(
				(cleanup): cleanup is () => void => typeof cleanup === "function",
			);

		if (cleanups.length) {
			storeApi.destroy = () => {
				for (const cleanup of cleanups) cleanup();
				cleanups.length = 0;
			};
		}
	}

	return storeApi;
};

const isSelectOptions = (value: unknown): value is StoreOptions<any> => {
	const type = typeof value;
	return type !== "string" && type !== "number" && type !== "symbol";
};

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
