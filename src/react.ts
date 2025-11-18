import { useSyncExternalStore } from "react";
import { store, type StateObject, type StatePrimitive, type Store } from "./index.js";

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

const documentStore = store({
	title: "Untitled",
	authors: ["Ada", "Ben"],
	meta: {
		pages: 3,
		tags: ["draft", "internal"],
	},
});

const tagsStore = documentStore.select((s) => s.meta.tags, (s, v) => ({ ...s, tags: v }));
const firstTagStore = tagsStore.select(0);
firstTagStore.set("published");