import { useSyncExternalStore } from "react";
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
): T;
export function useStoreValue<T extends StateObject | StatePrimitive>(
	store: Store<T> | undefined,
): T | undefined;
export function useStoreValue(store: undefined): undefined;
export function useStoreValue<T extends StateObject | StatePrimitive>(
	store: Store<T> | typeof noopStore | undefined = noopStore,
) {
	return useSyncExternalStore(store.subscribe, store.get, store.getInitial);
}

const noopStore = {
	get: () => undefined,
	getInitial: () => undefined,
	subscribe: () => () => {},
};
