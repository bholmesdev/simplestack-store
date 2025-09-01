import { useState, useEffect } from "react";
import type { Setter, StateObject, StatePrimitive, Store } from "./index.js";

export function useStore<T extends StateObject | StatePrimitive>(store: Store<T>): [T, (setter: Setter<T>) => void] {
    const [state, setState] = useState(store.get());
    useEffect(() => {
        return store.listen(setState);
    }, [store]);
    return [state, store.set];
}