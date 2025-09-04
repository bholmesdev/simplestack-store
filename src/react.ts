import { useEffect, useState } from "react";
import type { StateObject, StatePrimitive, Store } from "./index.js";

export function useStoreValue<T extends StateObject | StatePrimitive>(
	store: Store<T>,
): T;
export function useStoreValue<T extends StateObject | StatePrimitive>(
	store: Store<T> | undefined,
): T | undefined;
export function useStoreValue(store: undefined): undefined;
export function useStoreValue<T extends StateObject | StatePrimitive>(
	store: Store<T> | undefined,
) {
	const [state, setState] = useState<T | undefined>(store?.get());
	useEffect(() => {
		return store?.listen(setState);
	}, [store]);
	return state;
}
