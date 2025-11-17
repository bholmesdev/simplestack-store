import { describe, expect, it, vi } from "vitest";
import { store } from "./index.js";
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
	describe("selectPath", () => {
		describe("string path access", () => {
			it("should select nested keys using dot notation", () => {
				const libraryStore = store({
					book: {
						title: "The Great Gatsby",
						author: {
							name: "F. Scott Fitzgerald",
							bio: {
								birthYear: 1896,
								nationality: "American",
							},
						},
					},
				});

				const nationalityStore = libraryStore.selectPath("book.author.bio.nationality");
				const birthYearStore = libraryStore.selectPath("book.author.bio.birthYear");

				expect(nationalityStore.get()).toBe("American");
				expect(birthYearStore.get()).toBe(1896);
			});

			it("should update nested values using dot notation", () => {
				const libraryStore = store({
					book: {
						title: "The Great Gatsby",
						publisher: {
							name: "Scribner",
							location: {
								city: "New York",
								country: "USA",
							},
						},
					},
				});

				const cityStore = libraryStore.selectPath("book.publisher.location.city");
				cityStore.set("Boston");

				expect(cityStore.get()).toBe("Boston");
				expect(libraryStore.get().book.publisher.location.city).toBe("Boston");
				expect(libraryStore.get().book.publisher.name).toBe("Scribner");
				expect(libraryStore.get().book.title).toBe("The Great Gatsby");
			});

			it("should handle double nested paths", () => {
				const store1 = store({
					level1: {
						level2: {
							value: 42,
						},
					},
				});

				const valueStore = store1.selectPath("level1.level2.value");
				expect(valueStore.get()).toBe(42);

				valueStore.set(100);
				expect(store1.get().level1.level2.value).toBe(100);
			});
		});

		describe("tuple path access", () => {
			it("should select nested keys using tuple notation", () => {
				const store1 = store({
					book: {
						author: {
							name: "F. Scott Fitzgerald",
						},
					},
				});

				const nameStore = store1.selectPath(["book", "author", "name"] as const);
				expect(nameStore.get()).toBe("F. Scott Fitzgerald");
			});

			it("should handle keys with dots using tuple notation", () => {
				const specialStore = store({
					"my-key": "value",
					"another.key": {
						"sub.key": {
							value: "final value",
						},
					},
				});

				const myKeyStore = specialStore.selectPath(
					["another.key", "sub.key", "value"] as const,
				);
				expect(myKeyStore.get()).toBe("final value");
			});

			it("should update nested values using tuple notation", () => {
				const store1 = store({
					"weird.key.1": {
						"weird.key.2": {
							val: 123,
						},
					},
				});

				const valStore = store1.selectPath(["weird.key.1", "weird.key.2", "val"] as const);
				expect(valStore.get()).toBe(123);

				valStore.set(456);
				expect(store1.get()["weird.key.1"]["weird.key.2"].val).toBe(456);
			});
		});

		describe("array index access", () => {
			it("should access array elements using string path with index", () => {
				const store1 = store({
					items: [
						{ id: 1, name: "Item 1" },
						{ id: 2, name: "Item 2" },
						{ id: 3, name: "Item 3" },
					],
				});

				const item1Store = store1.selectPath("items.0.name");
				expect(item1Store.get()).toBe("Item 1");
			});

			it("should access array elements using tuple path with index", () => {
				const store1 = store({
					items: [
						{ id: 1, name: "Item 1" },
						{ id: 2, name: "Item 2" },
					],
				});

				const item1Store = store1.selectPath(["items", 1, "name"] as const);
				expect(item1Store.get()).toBe("Item 2");
			});

			it("should update array elements", () => {
				const store1 = store({
					cart: {
						items: [
							{ product: { name: "Headphones" }, quantity: 2 },
							{ product: { name: "Mouse" }, quantity: 1 },
						],
					},
				});

				const productNameStore = store1.selectPath("cart.items.0.product.name");
				productNameStore.set("Wireless Headphones");

				expect(store1.get().cart.items[0].product.name).toBe("Wireless Headphones");
				expect(store1.get().cart.items[1].product.name).toBe("Mouse");
			});
		});

		describe("immutability", () => {
			it("should preserve immutability when updating nested values", () => {
				const libraryStore = store({
					book: {
						publisher: {
							name: "Scribner",
							location: {
								city: "New York",
							},
						},
					},
				});

				const originalRef = libraryStore.get();
				const cityStore = libraryStore.selectPath("book.publisher.location.city");

				cityStore.set("Boston");

				expect(libraryStore.get()).not.toBe(originalRef);
				expect(libraryStore.get().book).not.toBe(originalRef.book);
				expect(libraryStore.get().book.publisher).not.toBe(originalRef.book.publisher);
				expect(libraryStore.get().book.publisher.location).not.toBe(
					originalRef.book.publisher.location,
				);
			});

			it("should not update parent if nested value is the same (Object.is)", () => {
				const store1 = store({
					level1: {
						level2: {
							value: 5,
						},
					},
				});

				const originalRef = store1.get();
				const valueStore = store1.selectPath("level1.level2.value");

				valueStore.set(5);

				expect(store1.get()).toBe(originalRef);
			});
		});

		describe("function setters", () => {
			it("should update nested values using a function", () => {
				const store1 = store({
					counter: {
						nested: {
							count: 5,
						},
					},
				});

				const countStore = store1.selectPath("counter.nested.count");
				countStore.set((n) => n + 1);

				expect(countStore.get()).toBe(6);
				expect(store1.get().counter.nested.count).toBe(6);
			});

			it("should work with tuple paths", () => {
				const store1 = store({
					data: {
						value: 10,
					},
				});

				const valueStore = store1.selectPath(["data", "value"] as const);
				valueStore.set((n) => n * 2);

				expect(valueStore.get()).toBe(20);
				expect(store1.get().data.value).toBe(20);
			});
		});

		describe("subscriptions", () => {
			it("should subscribe to nested value changes", async () => {
				const libraryStore = store({
					book: {
						publisher: {
							name: "Scribner",
						},
					},
				});

				const publisherNameStore = libraryStore.selectPath("book.publisher.name");
				const callback = vi.fn();

				publisherNameStore.subscribe(callback);

				expect(callback).toHaveBeenCalledWith("Scribner");
				callback.mockClear();

				publisherNameStore.set("Random House");

				await nextTick();
				expect(callback).toHaveBeenCalledWith("Random House");
			});

			it("should trigger subscription when parent updates nested value", async () => {
				const libraryStore = store({
					book: {
						publisher: {
							name: "Scribner",
						},
					},
				});

				const publisherNameStore = libraryStore.selectPath("book.publisher.name");
				const callback = vi.fn();

				publisherNameStore.subscribe(callback);

				expect(callback).toHaveBeenCalledWith("Scribner");
				callback.mockClear();

				libraryStore.set({
					book: {
						publisher: {
							name: "Penguin",
						},
					},
				});

				await nextTick();
				expect(callback).toHaveBeenCalledWith("Penguin");
			});

			it("should not trigger subscription if nested value unchanged", async () => {
				const store1 = store({
					level1: {
						level2: {
							value: 5,
						},
					},
				});

				const valueStore = store1.selectPath("level1.level2.value");
				const callback = vi.fn();

				valueStore.subscribe(callback);

				expect(callback).toHaveBeenCalledWith(5);
				callback.mockClear();

				valueStore.set(5);

				await nextTick();
				expect(callback).not.toHaveBeenCalled();
			});
		});

		describe("equivalence with chained select", () => {
			it("should work the same as chaining selects", () => {
				const libraryStore = store({
					book: {
						publisher: {
							name: "Scribner",
							location: {
								city: "New York",
							},
						},
					},
				});

				const chainedStore = libraryStore
					.select("book")
					.select("publisher")
					.select("location")
					.select("city");
				const deepStore = libraryStore.selectPath("book.publisher.location.city");

				expect(chainedStore.get()).toBe(deepStore.get());
				expect(chainedStore.get()).toBe("New York");

				deepStore.set("Boston");
				expect(chainedStore.get()).toBe("Boston");
			});

			it("should sync updates between chained and deep selects", () => {
				const store1 = store({
					data: {
						nested: {
							value: 42,
						},
					},
				});

				const chainedStore = store1.select("data").select("nested").select("value");
				const deepStore = store1.selectPath("data.nested.value");

				expect(chainedStore.get()).toBe(deepStore.get());

				chainedStore.set(100);
				expect(deepStore.get()).toBe(100);

				deepStore.set(200);
				expect(chainedStore.get()).toBe(200);
			});
		});

		describe("complex scenarios", () => {
			it("should handle e-commerce cart with nested product details", () => {
				const cartStore = store({
					cart: {
						items: [
							{
								product: {
									id: 1,
									name: "Wireless Headphones",
									price: {
										amount: 99.99,
										currency: "USD",
									},
								},
								quantity: 2,
							},
						],
						customer: {
							shipping: {
								address: {
									street: "123 Main St",
									city: "New York",
									zipCode: "10001",
								},
							},
							billing: {
								address: {
									street: "123 Main St",
									city: "New York",
									zipCode: "10001",
								},
							},
						},
					},
				});

				const shippingCityStore = cartStore.selectPath("cart.customer.shipping.address.city");
				const billingCityStore = cartStore.selectPath("cart.customer.billing.address.city");
				const productNameStore = cartStore.selectPath("cart.items.0.product.name");

				expect(shippingCityStore.get()).toBe("New York");
				expect(billingCityStore.get()).toBe("New York");
				expect(productNameStore.get()).toBe("Wireless Headphones");

				shippingCityStore.set("Boston");
				expect(cartStore.get().cart.customer.shipping.address.city).toBe("Boston");
				expect(cartStore.get().cart.customer.billing.address.city).toBe("New York");
				expect(cartStore.get().cart.items[0].product.name).toBe("Wireless Headphones");
			});

			it("should handle user preferences with deeply nested settings", () => {
				const userStore = store({
					user: {
						profile: {
							name: "Alice",
							preferences: {
								theme: {
									mode: "dark",
									accentColor: "#007bff",
									font: {
										family: "Inter",
										size: 16,
									},
								},
								notifications: {
									email: {
										enabled: true,
										frequency: "daily",
									},
									push: {
										enabled: false,
										sound: true,
									},
								},
							},
						},
					},
				});

				const themeModeStore = userStore.selectPath("user.profile.preferences.theme.mode");
				const accentColorStore = userStore.selectPath(
					"user.profile.preferences.theme.accentColor",
				);
				const fontFamilyStore = userStore.selectPath(
					"user.profile.preferences.theme.font.family",
				);
				const emailEnabledStore = userStore.selectPath(
					"user.profile.preferences.notifications.email.enabled",
				);

				expect(themeModeStore.get()).toBe("dark");
				expect(accentColorStore.get()).toBe("#007bff");
				expect(fontFamilyStore.get()).toBe("Inter");
				expect(emailEnabledStore.get()).toBe(true);

				themeModeStore.set("light");
				accentColorStore.set("#ff0000");
				fontFamilyStore.set("Roboto");
				emailEnabledStore.set(false);

				expect(userStore.get().user.profile.preferences.theme.mode).toBe("light");
				expect(userStore.get().user.profile.preferences.theme.accentColor).toBe("#ff0000");
				expect(userStore.get().user.profile.preferences.theme.font.family).toBe("Roboto");
				expect(userStore.get().user.profile.preferences.notifications.email.enabled).toBe(
					false,
				);
				expect(userStore.get().user.profile.name).toBe("Alice");
			});

			it("should handle multiple independent deep selections with subscriptions", async () => {
				const appStore = store({
					app: {
						dashboard: {
							widgets: {
								weather: {
									temperature: 72,
									unit: "F",
								},
								clock: {
									timezone: "America/New_York",
									format: "12h",
								},
							},
						},
						settings: {
							language: "en",
							region: {
								country: "US",
								timezone: "America/New_York",
							},
						},
					},
				});

				const temperatureStore = appStore.selectPath("app.dashboard.widgets.weather.temperature");
				const timezoneStore = appStore.selectPath("app.settings.region.timezone");
				const languageStore = appStore.selectPath("app.settings.language");

				const tempCallback = vi.fn();
				const tzCallback = vi.fn();
				const langCallback = vi.fn();

				temperatureStore.subscribe(tempCallback);
				timezoneStore.subscribe(tzCallback);
				languageStore.subscribe(langCallback);

				expect(tempCallback).toHaveBeenCalledWith(72);
				expect(tzCallback).toHaveBeenCalledWith("America/New_York");
				expect(langCallback).toHaveBeenCalledWith("en");

				tempCallback.mockClear();
				tzCallback.mockClear();
				langCallback.mockClear();

				temperatureStore.set(75);
				await nextTick();

				expect(tempCallback).toHaveBeenCalledWith(75);
				expect(tzCallback).not.toHaveBeenCalled();
				expect(langCallback).not.toHaveBeenCalled();

				tempCallback.mockClear();

				appStore.set({
					app: {
						dashboard: {
							widgets: {
								weather: {
									temperature: 72,
									unit: "F",
								},
								clock: {
									timezone: "America/New_York",
									format: "12h",
								},
							},
						},
						settings: {
							language: "es",
							region: {
								country: "US",
								timezone: "America/Los_Angeles",
							},
						},
					},
				});

				await nextTick();

				expect(tempCallback).toHaveBeenCalledWith(72);
				expect(tzCallback).toHaveBeenCalledWith("America/Los_Angeles");
				expect(langCallback).toHaveBeenCalledWith("es");
			});
		});

		describe("edge cases", () => {
			it("should handle single level path", () => {
				const store1 = store({
					name: "Alice",
					age: 30,
				});

				const nameStore = store1.selectPath("name");
				expect(nameStore.get()).toBe("Alice");

				nameStore.set("Bob");
				expect(store1.get().name).toBe("Bob");
			});

			it("should handle tuple path with single element", () => {
				const store1 = store({
					value: 42,
				});

				const valueStore = store1.selectPath(["value"] as const);
				expect(valueStore.get()).toBe(42);
			});

			it("should handle mixed string and number keys in tuple", () => {
				const store1 = store({
					items: [
						{ name: "First" },
						{ name: "Second" },
					],
				});

				const nameStore = store1.selectPath(["items", 0, "name"] as const);
				expect(nameStore.get()).toBe("First");

				nameStore.set("Updated");
				expect(store1.get().items[0].name).toBe("Updated");
			});
		});
	})
});
