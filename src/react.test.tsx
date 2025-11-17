import {
	fireEvent,
	render,
	renderHook,
	screen,
	waitFor,
} from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { store } from "./index.js";
import { useStoreValue } from "./react.js";

describe("useStoreValue", () => {
	describe("basic usage", () => {
		it("should return the current value of the store", () => {
			const countStore = store(5);
			const { result } = renderHook(() => useStoreValue(countStore));

			expect(result.current).toBe(5);
		});

		it("should return undefined when store is undefined", () => {
			const { result } = renderHook(() => useStoreValue(undefined));

			expect(result.current).toBe(undefined);
		});

		it("should work with string store", () => {
			const strStore = store("hello");
			const { result } = renderHook(() => useStoreValue(strStore));

			expect(result.current).toBe("hello");
		});

		it("should work with boolean store", () => {
			const boolStore = store(true);
			const { result } = renderHook(() => useStoreValue(boolStore));

			expect(result.current).toBe(true);
		});

		it("should work with object store", () => {
			const objStore = store({ name: "Alice", age: 30 });
			const { result } = renderHook(() => useStoreValue(objStore));

			expect(result.current).toEqual({ name: "Alice", age: 30 });
		});

		it("should work with array store", () => {
			const arrStore = store([1, 2, 3]);
			const { result } = renderHook(() => useStoreValue(arrStore));

			expect(result.current).toEqual([1, 2, 3]);
		});

		it("should work with null store", () => {
			const nullStore = store(null);
			const { result } = renderHook(() => useStoreValue(nullStore));

			expect(result.current).toBe(null);
		});
	});

	describe("reactivity", () => {
		it("should update when store value changes", async () => {
			const countStore = store(0);
			const { result } = renderHook(() => useStoreValue(countStore));

			expect(result.current).toBe(0);

			act(() => {
				countStore.set(5);
			});

			await waitFor(() => {
				expect(result.current).toBe(5);
			});
		});

		it("should update when store is updated multiple times", async () => {
			const countStore = store(0);
			const { result } = renderHook(() => useStoreValue(countStore));

			expect(result.current).toBe(0);

			act(() => {
				countStore.set(1);
			});

			await waitFor(() => {
				expect(result.current).toBe(1);
			});

			act(() => {
				countStore.set(2);
			});

			await waitFor(() => {
				expect(result.current).toBe(2);
			});

			act(() => {
				countStore.set(3);
			});

			await waitFor(() => {
				expect(result.current).toBe(3);
			});
		});

		it("should update when object store value changes", async () => {
			const objStore = store({ count: 0 });
			const { result } = renderHook(() => useStoreValue(objStore));

			expect(result.current).toEqual({ count: 0 });

			act(() => {
				objStore.set({ count: 1 });
			});

			await waitFor(() => {
				expect(result.current).toEqual({ count: 1 });
			});
		});

		it("should not trigger re-render if value is the same (Object.is)", async () => {
			const countStore = store(5);
			const renderSpy = vi.fn();

			function TestComponent() {
				const count = useStoreValue(countStore);
				renderSpy();
				return <div>{count}</div>;
			}

			render(<TestComponent />);

			const initialRenderCount = renderSpy.mock.calls.length;

			act(() => {
				countStore.set(5);
			});

			expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
		});
	});

	describe("selected stores", () => {
		it("should work with selected store", async () => {
			const objStore = store({ name: "Alice", age: 30 });
			const nameStore = objStore.select("name");

			const { result } = renderHook(() => useStoreValue(nameStore));

			expect(result.current).toBe("Alice");

			act(() => {
				nameStore.set("Bob");
			});

			await waitFor(() => {
				expect(result.current).toBe("Bob");
			});
		});

		it("should update when parent store changes selected value", async () => {
			const objStore = store({ name: "Alice", age: 30 });
			const nameStore = objStore.select("name");

			const { result } = renderHook(() => useStoreValue(nameStore));

			expect(result.current).toBe("Alice");

			act(() => {
				objStore.set({ name: "Bob", age: 30 });
			});

			await waitFor(() => {
				expect(result.current).toBe("Bob");
			});
		});

		it("should not update when parent changes but selected value stays same", async () => {
			const objStore = store({ name: "Alice", age: 30 });
			const nameStore = objStore.select("name");

			const renderSpy = vi.fn();

			function TestComponent() {
				const name = useStoreValue(nameStore);
				renderSpy();
				return <div>{name}</div>;
			}

			render(<TestComponent />);

			const initialRenderCount = renderSpy.mock.calls.length;

			act(() => {
				objStore.set({ name: "Alice", age: 31 });
			});

			expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
		});

		it("should work with deeply nested selections", async () => {
			const docStore = store({
				meta: {
					tags: ["draft", "internal"],
				},
			});

			const tagsStore = docStore.select("meta").select("tags");
			const { result } = renderHook(() => useStoreValue(tagsStore));

			expect(result.current).toEqual(["draft", "internal"]);

			act(() => {
				tagsStore.set(["published"]);
			});

			await waitFor(() => {
				expect(result.current).toEqual(["published"]);
			});
		});
	});

	describe("multiple components", () => {
		it("should allow multiple components to subscribe to same store", async () => {
			const countStore = store(0);

			function Counter1() {
				const count = useStoreValue(countStore);
				return <div data-testid="counter1">{count}</div>;
			}

			function Counter2() {
				const count = useStoreValue(countStore);
				return <div data-testid="counter2">{count}</div>;
			}

			render(
				<>
					<Counter1 />
					<Counter2 />
				</>,
			);

			expect(screen.getByTestId("counter1")).toHaveTextContent("0");
			expect(screen.getByTestId("counter2")).toHaveTextContent("0");

			// Update store
			act(() => {
				countStore.set(5);
			});

			await waitFor(() => {
				expect(screen.getByTestId("counter1")).toHaveTextContent("5");
			});

			// Both components should now have the updated value
			expect(screen.getByTestId("counter1")).toHaveTextContent("5");
			expect(screen.getByTestId("counter2")).toHaveTextContent("5");
		});

		it("should allow different components to subscribe to different selections", async () => {
			const userStore = store({
				name: "Alice",
				age: 30,
			});

			const nameStore = userStore.select("name");
			const ageStore = userStore.select("age");

			function NameDisplay() {
				const name = useStoreValue(nameStore);
				return <div data-testid="name">{name}</div>;
			}

			function AgeDisplay() {
				const age = useStoreValue(ageStore);
				return <div data-testid="age">{age}</div>;
			}

			render(
				<>
					<NameDisplay />
					<AgeDisplay />
				</>,
			);

			expect(screen.getByTestId("name")).toHaveTextContent("Alice");
			expect(screen.getByTestId("age")).toHaveTextContent("30");

			act(() => {
				nameStore.set("Bob");
			});

			await waitFor(() => {
				expect(screen.getByTestId("name")).toHaveTextContent("Bob");
			});

			expect(screen.getByTestId("age")).toHaveTextContent("30");
		});
	});

	describe("cleanup", () => {
		it("should unsubscribe when component unmounts", async () => {
			const countStore = store(0);
			const { result, unmount } = renderHook(() => useStoreValue(countStore));

			expect(result.current).toBe(0);

			unmount();

			// After unmount, changing the store shouldn't cause errors
			act(() => {
				countStore.set(5);
			});

			// Just ensure no errors occurred
			expect(true).toBe(true);
		});

		it("should handle rapid mount/unmount cycles", () => {
			const countStore = store(0);

			for (let i = 0; i < 10; i++) {
				const { unmount } = renderHook(() => useStoreValue(countStore));
				unmount();
			}

			// Should complete without errors
			expect(true).toBe(true);
		});
	});

	describe("README examples", () => {
		it("should handle the counter example from README", async () => {
			const counterStore = store(0);

			function Counter() {
				const counter = useStoreValue(counterStore);
				return (
					<button
						type="button"
						data-testid="counter-btn"
						onClick={() => counterStore.set((n) => n + 1)}
					>
						{counter}
					</button>
				);
			}

			render(<Counter />);

			expect(screen.getByTestId("counter-btn")).toHaveTextContent("0");

			act(() => {
				screen.getByTestId("counter-btn").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("counter-btn")).toHaveTextContent("1");
			});

			act(() => {
				screen.getByTestId("counter-btn").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("counter-btn")).toHaveTextContent("2");
			});
		});

		it("should handle the document example from README", async () => {
			const documentStore = store({
				title: "Untitled",
				authors: ["Ada", "Ben"],
				meta: {
					pages: 3,
					tags: ["draft", "internal"],
				},
			});

			function Document() {
				const doc = useStoreValue(documentStore);
				return (
					<div>
						<span data-testid="title">{doc.title}</span>
						<span data-testid="tags">{doc.meta.tags.join(", ")}</span>
					</div>
				);
			}

			render(<Document />);

			expect(screen.getByTestId("title")).toHaveTextContent("Untitled");
			expect(screen.getByTestId("tags")).toHaveTextContent("draft, internal");
		});

		it("should handle the title input example from README", async () => {
			const documentStore = store({
				title: "Untitled",
				meta: { tags: ["draft"] },
			});

			const titleStore = documentStore.select("title");

			function Title() {
				const title = useStoreValue(titleStore);
				return (
					<input
						data-testid="title-input"
						value={title}
						onChange={(e) => titleStore.set(e.target.value)}
					/>
				);
			}

			render(<Title />);

			const input = screen.getByTestId("title-input") as HTMLInputElement;
			expect(input.value).toBe("Untitled");

			act(() => {
				fireEvent.change(input, { target: { value: "My Document" } });
			});

			await waitFor(() => {
				expect(input.value).toBe("My Document");
			});

			expect(documentStore.get().title).toBe("My Document");
		});
	});

	describe("edge cases", () => {
		it("should handle switching between different stores", async () => {
			const store1 = store(1);
			const store2 = store(2);

			let currentStore = store1;

			const { result, rerender } = renderHook(() =>
				useStoreValue(currentStore),
			);

			expect(result.current).toBe(1);

			currentStore = store2;
			rerender();

			await waitFor(() => {
				expect(result.current).toBe(2);
			});
		});

		it("should handle switching from defined to undefined store", async () => {
			const countStore = store(5);
			let storeRef: typeof countStore | undefined = countStore;

			const { result, rerender } = renderHook(() => useStoreValue(storeRef));

			expect(result.current).toBe(5);

			storeRef = undefined;
			rerender();

			await waitFor(() => {
				expect(result.current).toBe(undefined);
			});
		});

		it("should handle switching from undefined to defined store", async () => {
			const countStore = store(5);
			let storeRef: typeof countStore | undefined;

			const { result, rerender } = renderHook(() => useStoreValue(storeRef));

			expect(result.current).toBe(undefined);

			storeRef = countStore;
			rerender();

			await waitFor(() => {
				expect(result.current).toBe(5);
			});
		});

		it("should handle store with undefined value", () => {
			const undefinedStore = store(undefined);
			const { result } = renderHook(() => useStoreValue(undefinedStore));

			expect(result.current).toBe(undefined);
		});

		it("should handle store with null value", () => {
			const nullStore = store(null);
			const { result } = renderHook(() => useStoreValue(nullStore));

			expect(result.current).toBe(null);
		});

		it("should handle store with empty string", () => {
			const emptyStore = store("");
			const { result } = renderHook(() => useStoreValue(emptyStore));

			expect(result.current).toBe("");
		});

		it("should handle store with zero", () => {
			const zeroStore = store(0);
			const { result } = renderHook(() => useStoreValue(zeroStore));

			expect(result.current).toBe(0);
		});

		it("should handle store with false", () => {
			const falseStore = store(false);
			const { result } = renderHook(() => useStoreValue(falseStore));

			expect(result.current).toBe(false);
		});
	});

	describe("performance", () => {
		it("should only re-render when subscribed value changes", async () => {
			const objStore = store({ a: 1, b: 2 });
			const aStore = objStore.select("a");

			const renderSpy = vi.fn();

			function ComponentA() {
				const a = useStoreValue(aStore);
				renderSpy();
				return <div>{a}</div>;
			}

			render(<ComponentA />);

			const initialRenderCount = renderSpy.mock.calls.length;

			// Change 'b', which component A doesn't care about
			act(() => {
				objStore.set({ a: 1, b: 3 });
			});

			// Should not have re-rendered
			expect(renderSpy.mock.calls.length).toBe(initialRenderCount);

			// Now change 'a'
			act(() => {
				objStore.set({ a: 2, b: 3 });
			});

			await waitFor(() => {
				expect(renderSpy.mock.calls.length).toBe(initialRenderCount + 1);
			});
		});
	});

	describe("selectPath", () => {
		it("should work with string path", async () => {
			const bookStore = store({
				book: {
					author: {
						name: "F. Scott Fitzgerald",
					},
				},
			});

			const authorNameStore = bookStore.selectPath("book.author.name");
			const { result } = renderHook(() => useStoreValue(authorNameStore));

			expect(result.current).toBe("F. Scott Fitzgerald");

			act(() => {
				authorNameStore.set("Ernest Hemingway");
			});

			await waitFor(() => {
				expect(result.current).toBe("Ernest Hemingway");
			});
		});

		it("should work with tuple path", async () => {
			const store1 = store({
				"weird.key": {
					"another.key": {
						value: 123,
					},
				},
			});

			const valueStore = store1.selectPath(["weird.key", "another.key", "value"] as const);
			const { result } = renderHook(() => useStoreValue(valueStore));

			expect(result.current).toBe(123);

			act(() => {
				valueStore.set(456);
			});

			await waitFor(() => {
				expect(result.current).toBe(456);
			});
		});

		it("should update when parent changes nested value", async () => {
			const userStore = store({
				user: {
					profile: {
						name: "Alice",
						email: "alice@example.com",
					},
				},
			});

			const nameStore = userStore.selectPath("user.profile.name");
			const { result } = renderHook(() => useStoreValue(nameStore));

			expect(result.current).toBe("Alice");

			act(() => {
				userStore.set({
					user: {
						profile: {
							name: "Bob",
							email: "alice@example.com",
						},
					},
				});
			});

			await waitFor(() => {
				expect(result.current).toBe("Bob");
			});
		});

		it("should not re-render when unrelated nested value changes", async () => {
			const appStore = store({
				user: {
					name: "Alice",
					settings: {
						theme: "dark",
					},
				},
			});

			const nameStore = appStore.selectPath("user.name");
			const renderSpy = vi.fn();

			function UserName() {
				const name = useStoreValue(nameStore);
				renderSpy();
				return <div>{name}</div>;
			}

			render(<UserName />);

			const initialRenderCount = renderSpy.mock.calls.length;

			// Change settings, which the component doesn't care about
			act(() => {
				appStore.set({
					user: {
						name: "Alice",
						settings: {
							theme: "light",
						},
					},
				});
			});

			// Should not have re-rendered
			expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
		});

		it("should work with array indices in path", async () => {
			const cartStore = store({
				items: [
					{ name: "Item 1", price: 10 },
					{ name: "Item 2", price: 20 },
				],
			});

			const item1NameStore = cartStore.selectPath("items.0.name");
			const { result } = renderHook(() => useStoreValue(item1NameStore));

			expect(result.current).toBe("Item 1");

			act(() => {
				item1NameStore.set("Updated Item 1");
			});

			await waitFor(() => {
				expect(result.current).toBe("Updated Item 1");
			});

			expect(cartStore.get().items[0].name).toBe("Updated Item 1");
			expect(cartStore.get().items[1].name).toBe("Item 2");
		});

		it("should support multiple components subscribed to different paths", async () => {
			const appStore = store({
				dashboard: {
					widgets: {
						weather: { temp: 72 },
						clock: { time: "10:00" },
					},
				},
			});

			const tempStore = appStore.selectPath("dashboard.widgets.weather.temp");
			const timeStore = appStore.selectPath("dashboard.widgets.clock.time");

			function WeatherWidget() {
				const temp = useStoreValue(tempStore);
				return <div data-testid="temp">{temp}</div>;
			}

			function ClockWidget() {
				const time = useStoreValue(timeStore);
				return <div data-testid="time">{time}</div>;
			}

			render(
				<>
					<WeatherWidget />
					<ClockWidget />
				</>,
			);

			expect(screen.getByTestId("temp")).toHaveTextContent("72");
			expect(screen.getByTestId("time")).toHaveTextContent("10:00");

			act(() => {
				tempStore.set(75);
			});

			await waitFor(() => {
				expect(screen.getByTestId("temp")).toHaveTextContent("75");
			});

			expect(screen.getByTestId("time")).toHaveTextContent("10:00");
		});

		it("should work with deeply nested paths (4+ levels)", async () => {
			const configStore = store({
				app: {
					user: {
						preferences: {
							theme: {
								colors: {
									primary: "#007bff",
								},
							},
						},
					},
				},
			});

			const primaryColorStore = configStore.selectPath(
				"app.user.preferences.theme.colors.primary",
			);
			const { result } = renderHook(() => useStoreValue(primaryColorStore));

			expect(result.current).toBe("#007bff");

			act(() => {
				primaryColorStore.set("#ff0000");
			});

			await waitFor(() => {
				expect(result.current).toBe("#ff0000");
			});

			expect(
				configStore.get().app.user.preferences.theme.colors.primary,
			).toBe("#ff0000");
		});

		it("should handle function setters with selectPath", async () => {
			const counterStore = store({
				nested: {
					count: 5,
				},
			});

			const countStore = counterStore.selectPath("nested.count");

			function Counter() {
				const count = useStoreValue(countStore);
				return (
					<button
						type="button"
						data-testid="increment"
						onClick={() => countStore.set((n) => n + 1)}
					>
						{count}
					</button>
				);
			}

			render(<Counter />);

			expect(screen.getByTestId("increment")).toHaveTextContent("5");

			act(() => {
				screen.getByTestId("increment").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("increment")).toHaveTextContent("6");
			});

			act(() => {
				screen.getByTestId("increment").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("increment")).toHaveTextContent("7");
			});
		});
	});
});
