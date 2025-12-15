import { useSyncExternalStore } from "use-sync-external-store/shim";
import type { StateObject, StatePrimitive, Store } from "./index.js";

/**
 * Subscribe to the state of the store.
 * @param store - The store to subscribe to.
 * @returns The current state of the store.
 * @example
 * const countStore = store(0);
 * const count = useStoreValue(countStore);
 * console.log(count); // 0
 */
export function useStoreValue<T extends StateObject | StatePrimitive>(
	store: Store<T>,
) {
	return useSyncExternalStore(store.subscribe, store.get, store.getInitial);
}
