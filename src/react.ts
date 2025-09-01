import { useState, useEffect } from "react";
import type { StateObject, StatePrimitive, Store } from "./index.js";

export function useStoreValue<T extends StateObject | StatePrimitive>(store: Store<T>): T {
    const [state, setState] = useState(store.get());
    useEffect(() => {
        return store.listen(setState);
    }, [store]);
    return state;
}