/**
 * Helper to wait for signal-polyfill's batched reactive updates to complete.
 * After store.set(), reactive effects are queued in a microtask and run asynchronously.
 */
export const nextTick = () => {
	return new Promise<void>((resolve) => queueMicrotask(resolve));
};
