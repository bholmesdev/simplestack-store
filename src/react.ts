import { DEV } from "esm-env";
import { useRef, useSyncExternalStore } from "react";
import type { StateObject, StatePrimitive, Store } from "./index.js";
import { shallow } from "./shallow.js";

/**
 * Subscribe to the state of the store, optionally selecting a derived value.
 * @param store - The store to subscribe to.
 * @param selector - Optional function to select/derive a value from the store state.
 * @returns The current state of the store, or the selected value if a selector is provided.
 * @example
 * const countStore = store(0);
 * const count = useStoreValue(countStore);
 *
 * // With selector:
 * const docStore = store({ title: 'Hello', author: 'Ben' });
 * const title = useStoreValue(docStore, (s) => s.title);
 */
export function useStoreValue<T extends StateObject | StatePrimitive>(
	store: Store<T>,
): T;
export function useStoreValue<T extends StateObject | StatePrimitive, U>(
	store: Store<T>,
	selector: (state: T) => U,
): U;
export function useStoreValue<T extends StateObject | StatePrimitive, U>(
	store: Store<T>,
	selector?: (state: T) => U,
): T | U {
	const prevValue = useRef<T | U | undefined>(undefined);
	const unstableCount = useRef(0);

	const getSnapshot = () => {
		const state = store.get();
		const next = selector ? selector(state) : state;

		// In dev, warn for potential infinite loops due to new object references.
		if (DEV && selector && prevValue.current !== undefined) {
			if (prevValue.current !== next && shallow(prevValue.current, next)) {
				unstableCount.current++;
				if (unstableCount.current >= 3) {
					console.warn(
						"[@simplestack/store] Selector is returning a new reference for a value that is shallowly equal. " +
							"This may cause infinite re-renders. Wrap your selector with useShallow():\n" +
							"useStoreValue(store, useShallow((s) => s.items))",
					);
					unstableCount.current = 0;
				}
			} else {
				unstableCount.current = 0;
			}
		}

		prevValue.current = next;
		return next;
	};

	const getServerSnapshot = () => {
		const state = store.getInitial();
		return selector ? selector(state) : state;
	};

	return useSyncExternalStore(store.subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Wraps a selector with shallow equality memoization.
 * Use when your selector returns a new array/object reference that is shallowly equal.
 * @param selector - The selector function to wrap.
 * @returns A memoized selector that returns stable references for shallowly equal values.
 * @example
 * const [title, author] = useStoreValue(noteStore, useShallow((s) => [s.title, s.author]);
 */
export function useShallow<S, U>(selector: (state: S) => U): (state: S) => U {
	// Adapted from Zustand's implementation: https://github.com/pmndrs/zustand/blob/main/src/react/shallow.ts
	const prev = useRef<U | undefined>(undefined);
	return (state: S) => {
		const next = selector(state);
		if (prev.current !== undefined && shallow(prev.current, next)) {
			return prev.current;
		}
		prev.current = next;
		return next;
	};
}
