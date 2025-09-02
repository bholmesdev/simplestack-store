import { Signal } from "signal-polyfill";

export type StateObject = Record<string | number | symbol, any>;
export type StatePrimitive = string | number | boolean | null | undefined;

export type Setter<T extends StateObject | StatePrimitive> = T | ((state: T) => T);

// For select key results: arrays and index-signature records should yield possibly undefined,
// while known object keys should remain defined.
export type SelectValue<S, K extends keyof S> =
    // Arrays: any index access may be out of bounds
    S extends readonly (infer U)[] ? U | undefined
    // Index-signature records: broad key access may be missing
    : string extends keyof S ? S[K] | undefined
    : number extends keyof S ? S[K] | undefined
    : S[K];

// Make `select` always present but typed as undefined when the state may not be an object
export type SelectFn<T extends StateObject | StatePrimitive> =
    T extends StateObject
    ? <K extends keyof T>(key: K) => Store<SelectValue<T, K>>
    : undefined;

export type Store<T extends StateObject | StatePrimitive> = {
    get: () => T;
    set: (setter: Setter<T>) => void;
    listen: (callback: (state: T) => void) => () => void;
    select: SelectFn<T>;
};

// Overloads to widen primitive literals
export function store(initial: number): Store<number>;
export function store(initial: string): Store<string>;
export function store(initial: boolean): Store<boolean>;
export function store<T extends StateObject | StatePrimitive>(initial: T): Store<T>;
export function store<T extends StateObject | StatePrimitive>(initial: T): Store<T> {
    const state = new Signal.State<T>(initial);
    const get = () => state.get();
    const set = (setter: Setter<T>) => state.set(typeof setter === "function" ? setter(state.get()) : setter);
    return createStoreApi(get, set);
}

const createStoreApi = <S extends StateObject | StatePrimitive>(
    get: () => S,
    set: (setter: Setter<S>) => void,
): Store<S> => {
    const listen = (callback: (state: S) => void) => {
        return effect(() => {
            callback(get());
        });
    };

    if (isStatePrimitive(get())) {
        return { get, set, listen, select: undefined as SelectFn<S> };
    }

    function select<K extends keyof S>(key: K): Store<SelectValue<S, K>> {
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
                return { ...stateObj, [key]: next } as S;
            });
        };
        return createStoreApi(getSelected, setSelected);
    }

    return { get, set, listen, select: select as SelectFn<S> };
};

const UNEXPECTED_SELECT_ERROR = "Internal: select() was unexpectedly called on a state value that wasn't an object.";

function isStatePrimitive(state: any): state is StatePrimitive {
    return typeof state === "string" || typeof state === "number" || typeof state === "boolean" || state === null || state === undefined;
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

type Note = {
    title: string;
}

const noteStore = store({
    notes: [] as Note[],
})

const firstNoteTitle = noteStore.select("notes").select(0).select?.('title');