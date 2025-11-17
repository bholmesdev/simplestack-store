import { bench, describe } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "react";
import { store, type Store } from "./index.js";
import { useStoreValue } from "./react.js";

describe("Performance: Chained select vs selectPath", () => {
	describe("Reading deeply nested values", () => {
		const deepStore = store({
			level1: {
				level2: {
					level3: {
						level4: {
							level5: {
								value: 42,
							},
						},
					},
				},
			},
		});

		const chainedStore = deepStore
			.select("level1")
			.select("level2")
			.select("level3")
			.select("level4")
			.select("level5")
			.select("value");

		const pathStore = deepStore.selectPath("level1.level2.level3.level4.level5.value");

		bench("chained select (5 levels) - read", () => {
			chainedStore.get();
		});

		bench("selectPath (5 levels) - read", () => {
			pathStore.get();
		});
	});

	describe("Writing deeply nested values", () => {
		bench("chained select (5 levels) - write", () => {
			const deepStore = store({
				level1: {
					level2: {
						level3: {
							level4: {
								level5: {
									value: 0,
								},
							},
						},
					},
				},
			});

			const chainedStore = deepStore
				.select("level1")
				.select("level2")
				.select("level3")
				.select("level4")
				.select("level5")
				.select("value");

			chainedStore.set(100);
		});

		bench("selectPath (5 levels) - write", () => {
			const deepStore = store({
				level1: {
					level2: {
						level3: {
							level4: {
								level5: {
									value: 0,
								},
							},
						},
					},
				},
			});

			const pathStore = deepStore.selectPath("level1.level2.level3.level4.level5.value");

			pathStore.set(100);
		});
	});

	describe("Store creation overhead", () => {
		const baseStore = store({
			user: {
				profile: {
					settings: {
						theme: {
							colors: {
								primary: "#007bff",
							},
						},
					},
				},
			},
		});

		bench("chained select - store creation", () => {
			baseStore
				.select("user")
				.select("profile")
				.select("settings")
				.select("theme")
				.select("colors")
				.select("primary");
		});

		bench("selectPath - store creation", () => {
			baseStore.selectPath("user.profile.settings.theme.colors.primary");
		});
	});

	describe("Array access performance", () => {
		const arrayStore = store({
			items: Array.from({ length: 100 }, (_, i) => ({
				id: i,
				name: `Item ${i}`,
				metadata: {
					tags: ["tag1", "tag2"],
					value: i * 10,
				},
			})),
		});

		const chainedItem50: Store<number> = (arrayStore.select("items").select(50) as any).select("metadata").select("value");
		const pathItem50 = arrayStore.selectPath("items.50.metadata.value");

		bench("chained select - array access", () => {
			chainedItem50?.get();
		});

		bench("selectPath - array access", () => {
			pathItem50.get();
		});
	});

	describe("Subscription overhead", () => {
		bench("chained select - subscription", () => {
			const testStore = store({
				data: {
					nested: {
						value: 0,
					},
				},
			});

			const chainedStore = testStore.select("data").select("nested").select("value");
			const unsubscribe = chainedStore.subscribe(() => {});
			unsubscribe();
		});

		bench("selectPath - subscription", () => {
			const testStore = store({
				data: {
					nested: {
						value: 0,
					},
				},
			});

			const pathStore = testStore.selectPath("data.nested.value");
			const unsubscribe = pathStore.subscribe(() => {});
			unsubscribe();
		});
	});

	describe("Multiple updates performance", () => {
		bench("chained select - 100 updates", () => {
			const testStore = store({
				counter: {
					value: 0,
				},
			});

			const chainedStore = testStore.select("counter").select("value");

			for (let i = 0; i < 100; i++) {
				chainedStore.set((n) => n + 1);
			}
		});

		bench("selectPath - 100 updates", () => {
			const testStore = store({
				counter: {
					value: 0,
				},
			});

			const pathStore = testStore.selectPath("counter.value");

			for (let i = 0; i < 100; i++) {
				pathStore.set((n) => n + 1);
			}
		});
	});

	describe("Complex object updates", () => {
		const createComplexStore = () =>
			store({
				app: {
					users: Array.from({ length: 10 }, (_, i) => ({
						id: i,
						name: `User ${i}`,
						profile: {
							settings: {
								preferences: {
									theme: "dark",
									language: "en",
								},
							},
						},
					})),
				},
			});

		bench("chained select - complex update", () => {
			const testStore = createComplexStore();
			const chainedStore = (testStore
				.select("app")
				.select("users")
				.select(5) as any)
				.select("profile")
				.select("settings")
				.select("preferences")
				.select("theme");

			chainedStore.set("light");
		});

		bench("selectPath - complex update", () => {
			const testStore = createComplexStore();
			const pathStore = testStore.selectPath("app.users.5.profile.settings.preferences.theme");

			pathStore.set("light");
		});
	});

	describe("Tuple path vs string path", () => {
		const testStore = store({
			"key.with.dots": {
				"another.key": {
					value: 42,
				},
			},
		});

		bench("selectPath - tuple path", () => {
			const pathStore = testStore.selectPath(["key.with.dots", "another.key", "value"] as const);
			pathStore.get();
		});

		bench("selectPath - string path (normal keys)", () => {
			const normalStore = store({
				key: {
					with: {
						dots: {
							another: {
								key: {
									value: 42,
								},
							},
						},
					},
				},
			});
			const pathStore = normalStore.selectPath("key.with.dots.another.key.value");
			pathStore.get();
		});
	});

	describe("Shallow vs deep nesting", () => {
		const shallowStore = store({
			level1: {
				value: 42,
			},
		});

		const deepStore = store({
			level1: {
				level2: {
					level3: {
						level4: {
							level5: {
								level6: {
									level7: {
										level8: {
											value: 42,
										},
									},
								},
							},
						},
					},
				},
			},
		});

		bench("shallow (2 levels) - chained", () => {
			shallowStore.select("level1").select("value").get();
		});

		bench("shallow (2 levels) - path", () => {
			shallowStore.selectPath("level1.value").get();
		});

		bench("deep (8 levels) - chained", () => {
			deepStore
				.select("level1")
				.select("level2")
				.select("level3")
				.select("level4")
				.select("level5")
				.select("level6")
				.select("level7")
				.select("level8")
				.select("value")
				.get();
		});

		bench("deep (8 levels) - path", () => {
			deepStore.selectPath("level1.level2.level3.level4.level5.level6.level7.level8.value").get();
		});
	});

	describe("React: Component rendering with nested state", () => {
		bench("chained select - React hook render", () => {
			const userStore = store({
				user: {
					profile: {
						settings: {
							theme: "dark",
						},
					},
				},
			});

			const themeStore = userStore
				.select("user")
				.select("profile")
				.select("settings")
				.select("theme");

			const { result } = renderHook(() => useStoreValue(themeStore));
			result.current;
		});

		bench("selectPath - React hook render", () => {
			const userStore = store({
				user: {
					profile: {
						settings: {
							theme: "dark",
						},
					},
				},
			});

			const themeStore = userStore.selectPath("user.profile.settings.theme");

			const { result } = renderHook(() => useStoreValue(themeStore));
			result.current;
		});
	});

	describe("React: Multiple updates with re-renders", () => {
		bench("chained select - 50 React updates", () => {
			const counterStore = store({
				nested: {
					count: 0,
				},
			});

			const countStore = counterStore.select("nested").select("count");
			const { result, unmount } = renderHook(() => useStoreValue(countStore));

			for (let i = 0; i < 50; i++) {
				act(() => {
					countStore.set((n) => n + 1);
				});
			}

			unmount();
		});

		bench("selectPath - 50 React updates", () => {
			const counterStore = store({
				nested: {
					count: 0,
				},
			});

			const countStore = counterStore.selectPath("nested.count");
			const { result, unmount } = renderHook(() => useStoreValue(countStore));

			for (let i = 0; i < 50; i++) {
				act(() => {
					countStore.set((n) => n + 1);
				});
			}

			unmount();
		});
	});

	describe("React: Deep nesting with subscriptions", () => {
		bench("chained select - deep React subscription", () => {
			const appStore = store({
				app: {
					dashboard: {
						widgets: {
							weather: {
								data: {
									temperature: 72,
								},
							},
						},
					},
				},
			});

			const tempStore = appStore
				.select("app")
				.select("dashboard")
				.select("widgets")
				.select("weather")
				.select("data")
				.select("temperature");

			const { unmount } = renderHook(() => useStoreValue(tempStore));

			act(() => {
				tempStore.set(75);
			});

			unmount();
		});

		bench("selectPath - deep React subscription", () => {
			const appStore = store({
				app: {
					dashboard: {
						widgets: {
							weather: {
								data: {
									temperature: 72,
								},
							},
						},
					},
				},
			});

			const tempStore = appStore.selectPath("app.dashboard.widgets.weather.data.temperature");

			const { unmount } = renderHook(() => useStoreValue(tempStore));

			act(() => {
				tempStore.set(75);
			});

			unmount();
		});
	});

	describe("React: Multiple independent subscriptions", () => {
		bench("chained select - 5 independent React subscriptions", () => {
			const appStore = store({
				a: { value: 1 },
				b: { value: 2 },
				c: { value: 3 },
				d: { value: 4 },
				e: { value: 5 },
			});

			const aStore = appStore.select("a").select("value");
			const bStore = appStore.select("b").select("value");
			const cStore = appStore.select("c").select("value");
			const dStore = appStore.select("d").select("value");
			const eStore = appStore.select("e").select("value");

			const { unmount: u1 } = renderHook(() => useStoreValue(aStore));
			const { unmount: u2 } = renderHook(() => useStoreValue(bStore));
			const { unmount: u3 } = renderHook(() => useStoreValue(cStore));
			const { unmount: u4 } = renderHook(() => useStoreValue(dStore));
			const { unmount: u5 } = renderHook(() => useStoreValue(eStore));

			act(() => {
				aStore.set(10);
				bStore.set(20);
				cStore.set(30);
			});

			u1();
			u2();
			u3();
			u4();
			u5();
		});

		bench("selectPath - 5 independent React subscriptions", () => {
			const appStore = store({
				a: { value: 1 },
				b: { value: 2 },
				c: { value: 3 },
				d: { value: 4 },
				e: { value: 5 },
			});

			const aStore = appStore.selectPath("a.value");
			const bStore = appStore.selectPath("b.value");
			const cStore = appStore.selectPath("c.value");
			const dStore = appStore.selectPath("d.value");
			const eStore = appStore.selectPath("e.value");

			const { unmount: u1 } = renderHook(() => useStoreValue(aStore));
			const { unmount: u2 } = renderHook(() => useStoreValue(bStore));
			const { unmount: u3 } = renderHook(() => useStoreValue(cStore));
			const { unmount: u4 } = renderHook(() => useStoreValue(dStore));
			const { unmount: u5 } = renderHook(() => useStoreValue(eStore));

			act(() => {
				aStore.set(10);
				bStore.set(20);
				cStore.set(30);
			});

			u1();
			u2();
			u3();
			u4();
			u5();
		});
	});

	describe("React: Array item updates", () => {
		bench("chained select - array item React update", () => {
			const listStore = store({
				items: Array.from({ length: 20 }, (_, i) => ({
					id: i,
					name: `Item ${i}`,
				})),
			});

			const item10Store = (listStore.select("items").select(10) as any).select("name");

			const { unmount } = renderHook(() => useStoreValue(item10Store));

			act(() => {
				item10Store.set("Updated Item");
			});

			unmount();
		});

		bench("selectPath - array item React update", () => {
			const listStore = store({
				items: Array.from({ length: 20 }, (_, i) => ({
					id: i,
					name: `Item ${i}`,
				})),
			});

			const item10Store = listStore.selectPath("items.10.name");

			const { unmount } = renderHook(() => useStoreValue(item10Store));

			act(() => {
				item10Store.set("Updated Item");
			});

			unmount();
		});
	});
});

