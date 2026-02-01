import { type StoreMiddleware, store } from "./index.js";

type DevtoolsMessage = { state?: string };

describe("store middleware", () => {
	it("runs init once and can hydrate", () => {
		const initSpy = vi.fn();
		const hydrate: StoreMiddleware<number> = (api) => ({
			init: () => {
				initSpy();
				api.set(5);
			},
		});

		const countStore = store(0, { middleware: [hydrate] });

		expect(initSpy).toHaveBeenCalledTimes(1);
		expect(countStore.get()).toBe(5);
	});

	it("wraps set to observe prev/next", () => {
		const transitions: Array<[number, number]> = [];
		const logger: StoreMiddleware<number> = (api) => ({
			set: (next) => (setter) => {
				const prev = api.get();
				next(setter);
				transitions.push([prev, api.get()]);
			},
		});

		const countStore = store(0, { middleware: [logger] });
		countStore.set(1);
		countStore.set((n) => n + 2);

		expect(transitions).toEqual([
			[0, 1],
			[1, 3],
		]);
	});

	it("connects to external service and handles inbound updates", () => {
		const initSpy = vi.fn();
		const sendSpy = vi.fn();
		const connectSpy = vi.fn();
		const unsubscribeSpy = vi.fn();

		let subscriber: ((message: DevtoolsMessage) => void) | undefined;

		connectSpy.mockImplementation(() => ({
			init: initSpy,
			send: sendSpy,
			subscribe: (handler: (message: DevtoolsMessage) => void) => {
				subscriber = handler;
				return unsubscribeSpy;
			},
		}));

		const devtools: StoreMiddleware<number> = (api) => {
			const connection = connectSpy();
			return {
				init: () => {
					connection.init(api.get());
					return connection.subscribe((message: DevtoolsMessage) => {
						if (message.state != null) {
							api.set(Number(message.state));
						}
					});
				},
				set: (next) => (setter) => {
					next(setter);
					connection.send({ type: "set" }, api.get());
				},
			};
		};

		const countStore = store(0, { middleware: [devtools] });

		expect(connectSpy).toHaveBeenCalledTimes(1);
		expect(initSpy).toHaveBeenCalledWith(0);

		countStore.set(2);
		expect(sendSpy).toHaveBeenCalledWith({ type: "set" }, 2);

		subscriber?.({ state: "7" });
		expect(countStore.get()).toBe(7);
	});

	it("can override the setter", () => {
		const incrementer: StoreMiddleware<number> = () => ({
			set: (next) => (setter) => {
				if (typeof setter === "function") {
					next((state) => (setter as (value: number) => number)(state) + 1);
					return;
				}
				next(() => (setter as number) + 1);
			},
		});

		const countStore = store(0, { middleware: [incrementer] });

		countStore.set(1);
		expect(countStore.get()).toBe(2);

		countStore.set((value) => value + 1);
		expect(countStore.get()).toBe(4);
	});

	it("exposes destroy when init returns cleanup", () => {
		const cleanupSpy = vi.fn();
		const middleware: StoreMiddleware<number> = () => ({
			init: () => cleanupSpy,
		});

		const countStore = store(0, { middleware: [middleware] });
		countStore.destroy?.();

		expect(cleanupSpy).toHaveBeenCalledTimes(1);
	});
});
