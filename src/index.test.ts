import { DEV } from "esm-env";
import { store, type Store } from "./index.js";
import { nextTick } from "./test-utils.js";

describe("store", () => {
	describe("primitive stores", () => {
		it("should create a store with a number", () => {
			const numStore = store(42);
			expect(numStore.get()).toBe(42);
		});

		it("should create a store with a string", () => {
			const strStore = store("hello");
			expect(strStore.get()).toBe("hello");
		});

		it("should create a store with a boolean", () => {
			const boolStore = store(true);
			expect(boolStore.get()).toBe(true);
		});

		it("should create a store with null", () => {
			const nullStore = store(null);
			expect(nullStore.get()).toBe(null);
		});

		it("should create a store with undefined", () => {
			const undefinedStore = store(undefined);
			expect(undefinedStore.get()).toBe(undefined);
		});

		it("should not have select method on primitive stores", () => {
			const numStore = store(42);
			expect(numStore.select).toBe(undefined);
		});
	});

	describe("set operations", () => {
		it("should set a value directly", () => {
			const countStore = store(0);
			countStore.set(5);
			expect(countStore.get()).toBe(5);
		});

		it("should set a value using a function", () => {
			const countStore = store(0);
			countStore.set((n) => n + 1);
			expect(countStore.get()).toBe(1);
		});

		it("should set a value multiple times using a function", () => {
			const countStore = store(0);
			countStore.set((n) => n + 1);
			countStore.set((n) => n + 1);
			countStore.set((n) => n + 1);
			expect(countStore.get()).toBe(3);
		});

		it("should replace entire object", () => {
			const objStore = store({ name: "Alice", age: 30 });
			objStore.set({ name: "Bob", age: 25 });
			expect(objStore.get()).toEqual({ name: "Bob", age: 25 });
		});

		it("should update object using function", () => {
			const objStore = store({ count: 0 });
			objStore.set((state) => ({ ...state, count: state.count + 1 }));
			expect(objStore.get()).toEqual({ count: 1 });
		});
	});

	describe("object stores", () => {
		it("should create a store with an object", () => {
			const objStore = store({ name: "Alice", age: 30 });
			expect(objStore.get()).toEqual({ name: "Alice", age: 30 });
		});

		it("should create a store with nested objects", () => {
			const nestedStore = store({
				user: { name: "Alice" },
				settings: { theme: "dark" },
			});
			expect(nestedStore.get()).toEqual({
				user: { name: "Alice" },
				settings: { theme: "dark" },
			});
		});

		it("should have select method on object stores", () => {
			const objStore = store({ name: "Alice" });
			expect(typeof objStore.select).toBe("function");
		});
	});

	describe("array stores", () => {
		it("should create a store with an array", () => {
			const arrStore = store([1, 2, 3]);
			expect(arrStore.get()).toEqual([1, 2, 3]);
		});

		it("should update array", () => {
			const arrStore = store([1, 2, 3]);
			arrStore.set([4, 5, 6]);
			expect(arrStore.get()).toEqual([4, 5, 6]);
		});

		it("should have select method on array stores", () => {
			const arrStore = store([1, 2, 3]);
			expect(typeof arrStore.select).toBe("function");
		});
	});

	describe("subscriptions", () => {
		it("should subscribe to changes", async () => {
			const countStore = store(0);
			const callback = vi.fn();

			countStore.subscribe(callback);

			expect(callback).toHaveBeenCalledWith(0);

			callback.mockClear();
			countStore.set(1);

			await nextTick();
			expect(callback).toHaveBeenCalledWith(1);
		});

		it("should call multiple subscribers", async () => {
			const countStore = store(0);
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			countStore.subscribe(callback1);
			countStore.subscribe(callback2);

			expect(callback1).toHaveBeenCalledWith(0);
			expect(callback2).toHaveBeenCalledWith(0);

			callback1.mockClear();
			callback2.mockClear();

			countStore.set(5);

			await nextTick();
			expect(callback1).toHaveBeenCalledWith(5);
			expect(callback2).toHaveBeenCalledWith(5);
		});

		it("should unsubscribe", async () => {
			const countStore = store(0);
			const callback = vi.fn();

			const unsubscribe = countStore.subscribe(callback);

			expect(callback).toHaveBeenCalledWith(0);
			callback.mockClear();

			unsubscribe();
			countStore.set(1);

			await nextTick();
			expect(callback).not.toHaveBeenCalled();
		});

		it("should not trigger callback if value is the same (Object.is)", async () => {
			const countStore = store(5);
			const callback = vi.fn();

			countStore.subscribe(callback);

			expect(callback).toHaveBeenCalledWith(5);
			callback.mockClear();

			countStore.set(5);

			await nextTick();
			expect(callback).not.toHaveBeenCalled();
		});

		it("should trigger on object reference change even with same content", async () => {
			const objStore = store({ count: 1 });
			const callback = vi.fn();

			objStore.subscribe(callback);

			expect(callback).toHaveBeenCalledWith({ count: 1 });
			callback.mockClear();

			objStore.set({ count: 1 });

			await nextTick();
			expect(callback).toHaveBeenCalledWith({ count: 1 });
		});

		it("should handle multiple sequential updates", async () => {
			const countStore = store(0);
			const callback = vi.fn();

			countStore.subscribe(callback);

			expect(callback).toHaveBeenCalledWith(0);

			callback.mockClear();

			countStore.set(1);
			await nextTick();
			countStore.set(2);
			await nextTick();
			countStore.set(3);
			await nextTick();

			expect(callback).toHaveBeenCalledTimes(3);
			expect(callback).toHaveBeenNthCalledWith(1, 1);
			expect(callback).toHaveBeenNthCalledWith(2, 2);
			expect(callback).toHaveBeenNthCalledWith(3, 3);
		});
	});

	describe("getInitial", () => {
		describe("primitive stores", () => {
			it("should return initial value for number store", () => {
				const numStore = store(42);
				expect(numStore.getInitial()).toBe(42);
			});

			it("should return initial value for string store", () => {
				const strStore = store("hello");
				expect(strStore.getInitial()).toBe("hello");
			});

			it("should return initial value for boolean store", () => {
				const boolStore = store(true);
				expect(boolStore.getInitial()).toBe(true);
			});

			it("should return initial value for null store", () => {
				const nullStore = store(null);
				expect(nullStore.getInitial()).toBe(null);
			});

			it("should return initial value for undefined store", () => {
				const undefinedStore = store(undefined);
				expect(undefinedStore.getInitial()).toBe(undefined);
			});

			it("should return initial value even after store is updated", () => {
				const countStore = store(0);
				expect(countStore.getInitial()).toBe(0);

				countStore.set(5);
				expect(countStore.getInitial()).toBe(0);
				expect(countStore.get()).toBe(5);

				countStore.set(10);
				expect(countStore.getInitial()).toBe(0);
				expect(countStore.get()).toBe(10);
			});

			it("should handle zero as initial value", () => {
				const zeroStore = store(0);
				expect(zeroStore.getInitial()).toBe(0);
			});

			it("should handle empty string as initial value", () => {
				const emptyStore = store("");
				expect(emptyStore.getInitial()).toBe("");
			});

			it("should handle false as initial value", () => {
				const falseStore = store(false);
				expect(falseStore.getInitial()).toBe(false);
			});

			it("should handle NaN as initial value", () => {
				const nanStore = store(Number.NaN);
				expect(Number.isNaN(nanStore.getInitial())).toBe(true);
			});
		});

		describe("object stores", () => {
			it("should return initial value for object store", () => {
				const objStore = store({ name: "Alice", age: 30 });
				expect(objStore.getInitial()).toEqual({ name: "Alice", age: 30 });
			});

			it("should return initial value after store is updated", () => {
				const objStore = store({ name: "Alice", age: 30 });
				expect(objStore.getInitial()).toEqual({ name: "Alice", age: 30 });

				objStore.set({ name: "Bob", age: 25 });
				expect(objStore.getInitial()).toEqual({ name: "Alice", age: 30 });
				expect(objStore.get()).toEqual({ name: "Bob", age: 25 });
			});

			it("should return initial empty object", () => {
				const emptyStore = store({});
				expect(emptyStore.getInitial()).toEqual({});
			});

			it("should return initial nested object", () => {
				const nestedStore = store({
					user: { name: "Alice" },
					settings: { theme: "dark" },
				});
				expect(nestedStore.getInitial()).toEqual({
					user: { name: "Alice" },
					settings: { theme: "dark" },
				});
			});

			it("should preserve initial object reference", () => {
				const initialObj = { name: "Alice", age: 30 };
				const objStore = store(initialObj);
				objStore.set({ name: "Ben", age: 28 });

				expect(objStore.getInitial()).toBe(initialObj);
			});
		});

		describe("array stores", () => {
			it("should return initial value for array store", () => {
				const arrStore = store([1, 2, 3]);
				expect(arrStore.getInitial()).toEqual([1, 2, 3]);
			});

			it("should return initial value after store is updated", () => {
				const arrStore = store([1, 2, 3]);
				expect(arrStore.getInitial()).toEqual([1, 2, 3]);

				arrStore.set([4, 5, 6]);
				expect(arrStore.getInitial()).toEqual([1, 2, 3]);
				expect(arrStore.get()).toEqual([4, 5, 6]);
			});

			it("should return initial empty array", () => {
				const emptyArr = store([]);
				expect(emptyArr.getInitial()).toEqual([]);
			});

			it("should return initial array with mixed types", () => {
				const mixedArr = store([1, "two", { three: 3 }, null, undefined]);
				expect(mixedArr.getInitial()).toEqual([
					1,
					"two",
					{ three: 3 },
					null,
					undefined,
				]);
			});

			it("should preserve initial array reference", () => {
				const initialArr = [1, 2, 3];
				const arrStore = store(initialArr);
				arrStore.set([4, 5, 6]);
				expect(arrStore.getInitial()).toBe(initialArr);
			});
		});

		describe("selected stores", () => {
			it("should return initial value for selected key", () => {
				const objStore = store({ name: "Alice", age: 30 });
				const nameStore = objStore.select("name");
				expect(nameStore.getInitial()).toBe("Alice");
			});

			it("should return initial value after selected store is updated", () => {
				const objStore = store({ name: "Alice", age: 30 });
				const nameStore = objStore.select("name");
				expect(nameStore.getInitial()).toBe("Alice");

				nameStore.set("Bob");
				expect(nameStore.getInitial()).toBe("Alice");
				expect(nameStore.get()).toBe("Bob");
			});

			it("should return initial value after parent store is updated", () => {
				const objStore = store({ name: "Alice", age: 30 });
				const nameStore = objStore.select("name");

				objStore.set({ name: "Charlie", age: 25 });
				expect(nameStore.getInitial()).toBe("Alice");
				expect(nameStore.get()).toBe("Charlie");
			});

			it("should return initial value for array index selection", () => {
				const arrStore = store(["a", "b", "c"]);
				const firstStore = arrStore.select(0);
				expect(firstStore.getInitial()).toBe("a");
			});

			it("should return initial value for nested selections", () => {
				const docStore = store({
					meta: {
						tags: ["draft", "internal"],
					},
				});
				const metaStore = docStore.select("meta");
				const tagsStore = metaStore.select("tags");
				expect(tagsStore.getInitial()).toEqual(["draft", "internal"]);
			});

			it("should return initial value for deeply nested selections", () => {
				const store1 = store({
					level1: {
						level2: {
							level3: {
								value: 42,
							},
						},
					},
				});

				const level1 = store1.select("level1");
				const level2 = level1.select("level2");
				const level3 = level2.select("level3");
				const valueStore = level3.select("value");

				expect(valueStore.getInitial()).toBe(42);

				valueStore.set(100);
				expect(valueStore.getInitial()).toBe(42);
				expect(valueStore.get()).toBe(100);
			});
		});

		describe("edge cases", () => {
			it("should handle objects with symbol keys", () => {
				const sym = Symbol("test");
				const symbolStore = store({ [sym]: "value", normal: "test" });
				expect(symbolStore.getInitial()[sym]).toBe("value");
			});

			it("should handle store with special characters in keys", () => {
				const specialStore = store({ "my-key": "value", "another.key": 123 });
				const myKeyStore = specialStore.select("my-key");
				expect(myKeyStore.getInitial()).toBe("value");
			});

			it("should handle zero as initial value in object", () => {
				const objWithZero = store({ count: 0 });
				const countStore = objWithZero.select("count");
				expect(countStore.getInitial()).toBe(0);
			});
		});
	});

	describe("select", () => {
		it("should select a key from an object", () => {
			const objStore = store({ name: "Alice", age: 30 });
			const nameStore = objStore.select("name");

			expect(nameStore.get()).toBe("Alice");
		});

		it("should select nested keys", () => {
			const docStore = store({
				title: "Untitled",
				meta: {
					pages: 3,
					tags: ["draft", "internal"],
				},
			});

			const metaStore = docStore.select("meta");
			const tagsStore = metaStore.select("tags");

			expect(tagsStore.get()).toEqual(["draft", "internal"]);
		});

		it("should update parent when selected value changes", () => {
			const objStore = store({ name: "Alice", age: 30 });
			const nameStore = objStore.select("name");

			nameStore.set("Bob");

			expect(nameStore.get()).toBe("Bob");
			expect(objStore.get()).toEqual({ name: "Bob", age: 30 });
		});

		it("should update selected value when parent changes", () => {
			const objStore = store({ name: "Alice", age: 30 });
			const nameStore = objStore.select("name");

			objStore.set({ name: "Charlie", age: 25 });

			expect(nameStore.get()).toBe("Charlie");
		});

		it("should set selected value using a function", () => {
			const objStore = store({ count: 0 });
			const countStore = objStore.select("count");

			countStore.set((n) => n + 1);

			expect(countStore.get()).toBe(1);
			expect(objStore.get()).toEqual({ count: 1 });
		});

		it("should maintain immutability when setting selected value", () => {
			const objStore = store({ name: "Alice", age: 30 });
			const originalRef = objStore.get();
			const nameStore = objStore.select("name");

			nameStore.set("Bob");

			expect(objStore.get()).not.toBe(originalRef);
			expect(objStore.get()).toEqual({ name: "Bob", age: 30 });
		});

		it("should not update parent if selected value is the same (Object.is)", () => {
			const objStore = store({ count: 5 });
			const originalRef = objStore.get();
			const countStore = objStore.select("count");

			countStore.set(5);

			expect(objStore.get()).toBe(originalRef);
		});

		it("should subscribe to selected value changes", async () => {
			const objStore = store({ name: "Alice", age: 30 });
			const nameStore = objStore.select("name");
			const callback = vi.fn();

			nameStore.subscribe(callback);

			expect(callback).toHaveBeenCalledWith("Alice");
			callback.mockClear();

			nameStore.set("Bob");

			await nextTick();
			expect(callback).toHaveBeenCalledWith("Bob");
		});

		it("should trigger selected subscription when parent updates", async () => {
			const objStore = store({ name: "Alice", age: 30 });
			const nameStore = objStore.select("name");
			const callback = vi.fn();

			nameStore.subscribe(callback);

			expect(callback).toHaveBeenCalledWith("Alice");
			callback.mockClear();

			objStore.set({ name: "Bob", age: 30 });

			await nextTick();
			expect(callback).toHaveBeenCalledWith("Bob");
		});

		it("should not trigger selected subscription if selected value unchanged", async () => {
			const objStore = store({ name: "Alice", age: 30 });
			const nameStore = objStore.select("name");
			const callback = vi.fn();

			nameStore.subscribe(callback);

			expect(callback).toHaveBeenCalledWith("Alice");
			callback.mockClear();

			objStore.set({ name: "Alice", age: 31 });

			await nextTick();
			expect(callback).not.toHaveBeenCalled();
		});

		it("should select from array by index", () => {
			const arrStore = store(["a", "b", "c"]);
			const firstStore = arrStore.select(0);

			expect(firstStore.get()).toBe("a");
		});

		it("should update array when selected index changes", () => {
			const arrStore = store(["a", "b", "c"]);
			const firstStore = arrStore.select(0);

			firstStore.set("z");

			expect(firstStore.get()).toBe("z");
			expect(arrStore.get()).toEqual(["z", "b", "c"]);
		});

		it("should handle deeply nested selections", () => {
			const store1 = store({
				level1: {
					level2: {
						level3: {
							value: 42,
						},
					},
				},
			});

			const level1 = store1.select("level1");
			const level2 = level1.select("level2");
			const level3 = level2.select("level3");
			const valueStore = level3.select("value");

			expect(valueStore.get()).toBe(42);

			valueStore.set(100);
			expect(store1.get().level1.level2.level3.value).toBe(100);
		});

		it("should support variadic select paths with undefined propagation", () => {
			const documentStore = store({
				notes: [{ title: "Example" }],
			});

			const titleStore: Store<string | undefined> = documentStore.select(
				"notes",
				0,
				"title",
			);
			void titleStore;

			expect(titleStore.get()).toBe("Example");
		});

		it("should discard sets that cross a potentially undefined value", () => {
			const documentStore = store<{ note?: { title: string } }>({
				note: undefined as { title: string } | undefined,
			});
			const titleStore: Store<string | undefined> = documentStore.select(
				"note",
				"title",
			);
			const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

			titleStore.set("New title");

			expect(documentStore.get().note).toBeUndefined();
			if (DEV) {
				expect(warn).toHaveBeenCalled();
			}
			warn.mockRestore();
		});

		it("should allow setting when optional object exists at runtime", () => {
			const documentStore = store({
				note: { title: "Example" } as { title: string } | undefined,
			});
			const titleStore = documentStore.select("note", "title");

			titleStore.set("Updated");

			expect(documentStore.get().note?.title).toBe("Updated");
		});

		it("should allow setting the value at a potentially undefined leaf", () => {
			const documentStore = store({
				notes: [{ title: "Example" }],
			});

			const firstNote: Store<{ title: string } | undefined> =
				documentStore.select("notes", 0);
			firstNote.set({ title: "Updated" });

			expect(documentStore.get().notes[0].title).toBe("Updated");
		});

		it("should allow setting when array indices in the middle exist at runtime", () => {
			const matrixStore = store({
				groups: [[{ title: "A" }]],
			});
			const titleStore = matrixStore.select("groups", 0, 0, "title");

			titleStore.set("B");

			expect(matrixStore.get().groups[0][0].title).toBe("B");
		});

		it("should discard sets when array index is missing at runtime", () => {
			const documentStore = store({
				notes: [] as { title: string }[],
			});
			const titleStore = documentStore.select("notes", 0, "title");
			const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

			titleStore.set("New title");

			expect(documentStore.get().notes[0]).toBeUndefined();
			if (DEV) {
				expect(warn).toHaveBeenCalled();
			}
			warn.mockRestore();
		});

		it("should handle unions in the middle of a path", () => {
			const unionStore = store<{ node: { a: string } | { b: number } }>({
				node: { a: "x" },
			});
			const aStore: Store<string | undefined> = unionStore.select("node", "a");
			const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

			aStore.set("y");
			expect(unionStore.get().node).toEqual({ a: "y" });
			if (DEV) {
				expect(warn).not.toHaveBeenCalled();
			}
			warn.mockClear();

			unionStore.set({ node: { b: 1 } });
			aStore.set("z");

			expect(unionStore.get().node).toEqual({ b: 1 });
			if (DEV) {
				expect(warn).toHaveBeenCalled();
			}
			warn.mockRestore();
		});

		it("should handle index signatures with missing keys", () => {
			const recordStore = store<Record<string, { title: string }>>({});
			const titleStore: Store<string | undefined> = recordStore.select(
				"missing",
				"title",
			);
			const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

			titleStore.set("New title");

			expect(recordStore.get().missing).toBeUndefined();
			if (DEV) {
				expect(warn).toHaveBeenCalled();
			}
			warn.mockRestore();
		});

		it("should handle deep select chains", () => {
			const deepStore = store({
				level1: {
					level2: {
						level3: {
							level4: {
								level5: {
									level6: {
										level7: {
											value: "ok",
										},
									},
								},
							},
						},
					},
				},
			});

			const valueStore = deepStore.select(
				"level1",
				"level2",
				"level3",
				"level4",
				"level5",
				"level6",
				"level7",
				"value",
			);

			expect(valueStore.get()).toBe("ok");
			valueStore.set("updated");
			expect(
				deepStore.get().level1.level2.level3.level4.level5.level6.level7.value,
			).toBe("updated");
		});

		it("should handle symbol keys in paths", () => {
			const key = Symbol("note");
			const symbolStore = store({ [key]: { title: "x" } });
			const titleStore = symbolStore.select(key, "title");

			titleStore.set("y");

			expect(symbolStore.get()[key].title).toBe("y");
		});
	});

	describe("complex scenarios", () => {
		it("should handle the document store example from README", () => {
			const documentStore = store({
				title: "Untitled",
				authors: ["Ada", "Ben"],
				meta: {
					pages: 3,
					tags: ["draft", "internal"],
				},
			});

			const titleStore = documentStore.select("title");
			const tagsStore = documentStore.select("meta").select("tags");

			expect(titleStore.get()).toBe("Untitled");
			expect(tagsStore.get()).toEqual(["draft", "internal"]);

			titleStore.set("My Document");
			tagsStore.set(["published"]);

			expect(documentStore.get()).toEqual({
				title: "My Document",
				authors: ["Ada", "Ben"],
				meta: {
					pages: 3,
					tags: ["published"],
				},
			});
		});

		it("should handle counter increment pattern", () => {
			const counterStore = store(0);
			const increment = () => counterStore.set((n) => n + 1);
			const decrement = () => counterStore.set((n) => n - 1);

			increment();
			increment();
			increment();
			expect(counterStore.get()).toBe(3);

			decrement();
			expect(counterStore.get()).toBe(2);
		});

		it("should handle multiple independent selections", async () => {
			const userStore = store({
				name: "Alice",
				age: 30,
				email: "alice@example.com",
			});

			const nameStore = userStore.select("name");
			const ageStore = userStore.select("age");

			const nameCallback = vi.fn();
			const ageCallback = vi.fn();

			nameStore.subscribe(nameCallback);
			ageStore.subscribe(ageCallback);

			expect(nameCallback).toHaveBeenCalledWith("Alice");
			expect(ageCallback).toHaveBeenCalledWith(30);
			nameCallback.mockClear();
			ageCallback.mockClear();

			ageStore.set(31);

			await nextTick();
			expect(ageCallback).toHaveBeenCalledWith(31);
			expect(nameCallback).not.toHaveBeenCalled();
		});

		it("should preserve other fields when updating via selection", () => {
			const formStore = store({
				username: "",
				password: "",
				rememberMe: false,
			});

			const usernameStore = formStore.select("username");
			usernameStore.set("alice123");

			expect(formStore.get()).toEqual({
				username: "alice123",
				password: "",
				rememberMe: false,
			});
		});
	});

	describe("edge cases", () => {
		it("should handle empty object", () => {
			const emptyStore = store({});
			expect(emptyStore.get()).toEqual({});
		});

		it("should handle empty array", () => {
			const emptyArr = store([]);
			expect(emptyArr.get()).toEqual([]);
		});

		it("should handle store with special characters in keys", () => {
			const specialStore = store({ "my-key": "value", "another.key": 123 });
			const myKeyStore = specialStore.select("my-key");

			expect(myKeyStore.get()).toBe("value");
		});

		it("should handle zero as a valid value", () => {
			const zeroStore = store(0);
			expect(zeroStore.get()).toBe(0);

			const objWithZero = store({ count: 0 });
			const countStore = objWithZero.select("count");
			expect(countStore.get()).toBe(0);
		});

		it("should handle empty string as a valid value", () => {
			const emptyStrStore = store("");
			expect(emptyStrStore.get()).toBe("");
		});

		it("should handle false as a valid value", () => {
			const falseStore = store(false);
			expect(falseStore.get()).toBe(false);
		});

		it("should handle NaN", () => {
			const nanStore = store(Number.NaN);
			// NaN !== NaN, so Object.is(NaN, NaN) is true
			expect(Number.isNaN(nanStore.get())).toBe(true);
		});

		it("should handle objects with symbol keys", () => {
			const sym = Symbol("test");
			const symbolStore = store({ [sym]: "value", normal: "test" });

			expect(symbolStore.get()[sym]).toBe("value");
		});

		it("should handle array with mixed types", () => {
			const mixedArr = store([1, "two", { three: 3 }, null, undefined]);
			expect(mixedArr.get()).toEqual([1, "two", { three: 3 }, null, undefined]);
		});
	});
});
