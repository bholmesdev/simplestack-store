import { Signal } from "signal-polyfill";

export type StateObject = Record<string | number | symbol, any>;
export type StatePrimitive = string | number | boolean | null | undefined;

export type Setter<T extends StateObject | StatePrimitive> = T | ((state: T) => T);

export type Store<T extends StateObject | StatePrimitive> = {
    get: () => T;
    set: (setter: Setter<T>) => void;
    listen: (callback: (state: T) => void) => () => void;
} & (T extends StateObject ? {
    select: <K extends keyof T>(key: K) => Store<T[K]>;
} : {});

// Overloads to widen primitive literals
export function store(initial: number): Store<number>;
export function store(initial: string): Store<string>;
export function store(initial: boolean): Store<boolean>;
export function store<T extends StateObject | StatePrimitive>(initial: T): Store<T>;
export function store<T extends StateObject | StatePrimitive>(initial: T): Store<T> {
    const state = new Signal.State<T>(initial);
    const get = () => state.get();
    const set = (setter: Setter<T>) => state.set(typeof setter === "function" ? setter(state.get()) : setter);
    const listen = (callback: (state: T) => void) => {
        return effect(() => {
            callback(state.get());
        });
    };

    const base = { get, set, listen } as Store<T>;

    if (!isStateObject(get())) {
        return base;
    }

    function select<K extends keyof T>(key: K) {
        const getSelected = () => {
            const selectedState = state.get();
            if (!isStateObject(selectedState)) {
                throw new Error(UNEXPECTED_SELECT_ERROR);
            }
            return selectedState[key];
        };
        const setSelected = (setter: Setter<any>) => {
            set((parent: any) => {
                const prevChild = parent?.[key];
                const nextChild = typeof setter === "function" ? (setter as (s: any) => any)(prevChild) : setter;
                if (Object.is(prevChild, nextChild)) return parent;
                return { ...(parent as any), [key]: nextChild } as T;
            });
        };
        return createSelectedStore(getSelected, setSelected);
    };

    Object.assign(base, { select });
    return base;
}

const createSelectedStore = <S extends StateObject | StatePrimitive>(
    get: () => S,
    set: (setter: Setter<S>) => void,
): Store<S> => {
    const listenSelected = (callback: (state: S) => void) => {
        // Initialize with a symbol INIT to call listen() on initial render
        const INIT = Symbol("init");
        let prev: S | typeof INIT = INIT;
        return effect(() => {
            const next = get();
            if (prev === INIT || !Object.is(prev, next)) {
                prev = next;
                callback(next);
            }
        });
    };

    const base = { get, set, listen: listenSelected } as Store<S>;
    function select<K extends keyof S>(key: K) {
        const getSelected = () => {
            const state = get();
            if (!isStateObject(state)) {
                throw new Error(UNEXPECTED_SELECT_ERROR);
            }
            return state[key];
        };
        const setSelected = (setter: Setter<S>) => {
            set((state) => {
                if (!isStateObject(state)) {
                    throw new Error(UNEXPECTED_SELECT_ERROR);
                }
                const prev = state[key];
                const next = typeof setter === "function" ? setter(prev) : setter;
                if (Object.is(prev, next)) return state;
                return { ...state as StateObject, [key]: next } as S;
            });
        };
        return createSelectedStore(getSelected, setSelected);
    };

    Object.assign(base, { select });
    return base;
};

const UNEXPECTED_SELECT_ERROR = "Select unexpectedly called from a primitive state value.";

function isStateObject(state: any): state is StateObject {
    return typeof state === "object" && state !== null;
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
