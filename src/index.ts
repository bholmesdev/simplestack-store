import { Signal } from "signal-polyfill";

export type StateObject = Record<string | number | symbol, any>;
export type StatePrimitive = string | number | boolean | null | undefined;

export type Setter<T extends StateObject | StatePrimitive> = T | ((state: T) => T);

export type Store<T extends StateObject | StatePrimitive> = {
    get: () => T;
    set: (setter: Setter<T>) => void;
    listen: (callback: (state: T) => void) => () => void;
}

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
    }

    return {
        get: () => state.get(),
        set,
        listen,
    }
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
