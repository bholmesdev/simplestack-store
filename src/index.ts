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
    const set = (setter: Setter<T>) => state.set(typeof setter === "function" ? setter(state.get()) : setter);
    const listen = (callback: (state: T) => void) => {
        return effect(() => {
            callback(state.get());
        });
    };

    // Helper to build a selected store with equality-guarded listeners and scoped setters
    const createSelectedStore = <S extends StateObject | StatePrimitive>(
        getParent: () => S,
        setParent: (setter: Setter<S>) => void,
    ): Store<S> => {
        const get = () => getParent();
        const set = (setter: Setter<S>) => setParent(setter);
        const listenSelected = (callback: (state: S) => void) => {
            const INIT = Symbol("init");
            let prev: S | typeof INIT = INIT as any;
            return effect(() => {
                const next = getParent();
                if (prev === INIT || !Object.is(prev as any, next)) {
                    prev = next;
                    callback(next);
                }
            });
        };

        const api: any = { get, set, listen: listenSelected };
        api.select = (key: any) => {
            const getChild = () => (getParent() as any)?.[key];
            const setChild = (setter: Setter<any>) => {
                setParent((parent: any) => {
                    const prevChild = parent?.[key];
                    const nextChild = typeof setter === "function" ? (setter as (s: any) => any)(prevChild) : setter;
                    if (Object.is(prevChild, nextChild)) return parent;
                    return { ...(parent as any), [key]: nextChild };
                });
            };
            return createSelectedStore(getChild, setChild);
        };

        return api as Store<S>;
    };

    const base: any = {
        get: () => state.get(),
        set,
        listen,
    };

    // Attach select for object states (type system restricts usage)
    base.select = (key: any) => {
        const getChild = () => (state.get() as any)?.[key];
        const setChild = (setter: Setter<any>) => {
            set((parent: any) => {
                const prevChild = parent?.[key];
                const nextChild = typeof setter === "function" ? (setter as (s: any) => any)(prevChild) : setter;
                if (Object.is(prevChild, nextChild)) return parent;
                return { ...(parent as any), [key]: nextChild } as T;
            });
        };
        return createSelectedStore(getChild, setChild);
    };

    return base as Store<T>;
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
