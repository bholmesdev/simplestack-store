import { act, screen } from "@testing-library/react";
import React, { useEffect } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { store } from "./index";
import { useStoreValue } from "./react";

describe("SSR Behavior", () => {
	it("should handle different states between server and client correctly", async () => {
		const { hydrateRoot } =
			await vi.importActual<typeof import("react-dom/client")>(
				"react-dom/client",
			);

		const countStore = store(0);

		function Counter() {
			const count = useStoreValue(countStore);

			useEffect(() => {
				countStore.set((c) => c + 1);
			}, []);

			return <div>count: {count}</div>;
		}

		const markup = renderToString(
			<React.Suspense fallback={<div>Loading...</div>}>
				<Counter />
			</React.Suspense>,
		);

		const container = document.createElement("div");
		document.body.appendChild(container);
		container.innerHTML = markup;

		expect(container).toHaveTextContent(/count: 0/);

		await act(async () => {
			hydrateRoot(
				container,
				<React.Suspense fallback={<div>Loading...</div>}>
					<Counter />
				</React.Suspense>,
			);
		});

		const countText = await screen.findByText("count: 1");
		expect(countText).toBeInTheDocument();
		document.body.removeChild(container);
	});

	it("should not have hydration errors when state changes during hydration", async () => {
		const { hydrateRoot } =
			await vi.importActual<typeof import("react-dom/client")>(
				"react-dom/client",
			);

		const countStore = store(0);

		const Component = () => {
			const count = useStoreValue(countStore);
			return <div>count: {count}</div>;
		};

		const markup = renderToString(
			<React.Suspense fallback={<div>Loading...</div>}>
				<Component />
			</React.Suspense>,
		);

		const container = document.createElement("div");
		document.body.appendChild(container);
		container.innerHTML = markup;

		expect(container).toHaveTextContent(/count: 0/);

		const consoleMock = vi.spyOn(console, "error");

		const hydratePromise = act(async () => {
			hydrateRoot(
				container,
				<React.Suspense fallback={<div>Loading...</div>}>
					<Component />
				</React.Suspense>,
			);
		});

		// Update store during hydration
		countStore.set(1);

		await hydratePromise;

		expect(consoleMock).toHaveBeenCalledTimes(0);

		const countText = await screen.findByText("count: 1");
		expect(countText).toBeInTheDocument();
		document.body.removeChild(container);
	});

	it("should handle object stores with updates during hydration", async () => {
		const { hydrateRoot } =
			await vi.importActual<typeof import("react-dom/client")>(
				"react-dom/client",
			);

		const userStore = store({ name: "Alice", age: 30 });

		const Component = () => {
			const user = useStoreValue(userStore);
			return (
				<div>
					user: {user?.name}, {user?.age}
				</div>
			);
		};

		const markup = renderToString(
			<React.Suspense fallback={<div>Loading...</div>}>
				<Component />
			</React.Suspense>,
		);

		const container = document.createElement("div");
		document.body.appendChild(container);
		container.innerHTML = markup;

		expect(container).toHaveTextContent(/user: Alice, 30/);

		const consoleMock = vi.spyOn(console, "error");

		const hydratePromise = act(async () => {
			hydrateRoot(
				container,
				<React.Suspense fallback={<div>Loading...</div>}>
					<Component />
				</React.Suspense>,
			);
		});

		// Update store during hydration
		userStore.set({ name: "Bob", age: 25 });

		await hydratePromise;

		expect(consoleMock).toHaveBeenCalledTimes(0);

		const userText = await screen.findByText("user: Bob, 25");
		expect(userText).toBeInTheDocument();
		document.body.removeChild(container);
	});

	it("should handle selected stores with updates during hydration", async () => {
		const { hydrateRoot } =
			await vi.importActual<typeof import("react-dom/client")>(
				"react-dom/client",
			);

		const userStore = store({ name: "Alice", age: 30 });
		const nameStore = userStore.select("name");

		const Component = () => {
			const name = useStoreValue(nameStore);
			return <div>name: {name}</div>;
		};

		const markup = renderToString(
			<React.Suspense fallback={<div>Loading...</div>}>
				<Component />
			</React.Suspense>,
		);

		const container = document.createElement("div");
		document.body.appendChild(container);
		container.innerHTML = markup;

		expect(container).toHaveTextContent(/name: Alice/);

		const consoleMock = vi.spyOn(console, "error");

		const hydratePromise = act(async () => {
			hydrateRoot(
				container,
				<React.Suspense fallback={<div>Loading...</div>}>
					<Component />
				</React.Suspense>,
			);
		});

		// Update parent store during hydration
		userStore.set({ name: "Charlie", age: 35 });

		await hydratePromise;

		expect(consoleMock).toHaveBeenCalledTimes(0);

		const nameText = await screen.findByText("name: Charlie");
		expect(nameText).toBeInTheDocument();
		document.body.removeChild(container);
	});

	it("should handle multiple components with shared store", async () => {
		const { hydrateRoot } =
			await vi.importActual<typeof import("react-dom/client")>(
				"react-dom/client",
			);

		const counterStore = store(0);

		const ComponentA = () => {
			const count = useStoreValue(counterStore);
			return <div>ComponentA: {count}</div>;
		};

		const ComponentB = () => {
			const count = useStoreValue(counterStore);
			return <div>ComponentB: {count}</div>;
		};

		const App = () => (
			<>
				<ComponentA />
				<ComponentB />
			</>
		);

		const markup = renderToString(
			<React.Suspense fallback={<div>Loading...</div>}>
				<App />
			</React.Suspense>,
		);

		const container = document.createElement("div");
		document.body.appendChild(container);
		container.innerHTML = markup;

		expect(container).toHaveTextContent(/ComponentA: 0/);
		expect(container).toHaveTextContent(/ComponentB: 0/);

		const consoleMock = vi.spyOn(console, "error");

		const hydratePromise = act(async () => {
			hydrateRoot(
				container,
				<React.Suspense fallback={<div>Loading...</div>}>
					<App />
				</React.Suspense>,
			);
		});

		// Update during hydration
		counterStore.set(42);

		await hydratePromise;

		expect(consoleMock).toHaveBeenCalledTimes(0);

		const textA = await screen.findByText("ComponentA: 42");
		const textB = await screen.findByText("ComponentB: 42");
		expect(textA).toBeInTheDocument();
		expect(textB).toBeInTheDocument();
		document.body.removeChild(container);
	});

	it("should handle array stores with updates during hydration", async () => {
		const { hydrateRoot } =
			await vi.importActual<typeof import("react-dom/client")>(
				"react-dom/client",
			);

		const itemsStore = store(["a", "b", "c"]);

		const Component = () => {
			const items = useStoreValue(itemsStore);
			return <div>items: {items?.join(", ")}</div>;
		};

		const markup = renderToString(
			<React.Suspense fallback={<div>Loading...</div>}>
				<Component />
			</React.Suspense>,
		);

		const container = document.createElement("div");
		document.body.appendChild(container);
		container.innerHTML = markup;

		expect(container).toHaveTextContent(/items: a, b, c/);

		const consoleMock = vi.spyOn(console, "error");

		const hydratePromise = act(async () => {
			hydrateRoot(
				container,
				<React.Suspense fallback={<div>Loading...</div>}>
					<Component />
				</React.Suspense>,
			);
		});

		// Update during hydration
		itemsStore.set(["x", "y", "z"]);

		await hydratePromise;

		expect(consoleMock).toHaveBeenCalledTimes(0);

		const itemsText = await screen.findByText("items: x, y, z");
		expect(itemsText).toBeInTheDocument();
		document.body.removeChild(container);
	});

	it("should handle nested selected stores during hydration", async () => {
		const { hydrateRoot } =
			await vi.importActual<typeof import("react-dom/client")>(
				"react-dom/client",
			);

		const docStore = store({
			meta: {
				tags: ["draft", "internal"],
			},
		});
		const metaStore = docStore.select("meta");
		const tagsStore = metaStore.select("tags");

		const Component = () => {
			const tags = useStoreValue(tagsStore);
			return <div>tags: {tags?.join(", ")}</div>;
		};

		const markup = renderToString(
			<React.Suspense fallback={<div>Loading...</div>}>
				<Component />
			</React.Suspense>,
		);

		const container = document.createElement("div");
		document.body.appendChild(container);
		container.innerHTML = markup;

		expect(container).toHaveTextContent(/tags: draft, internal/);

		const consoleMock = vi.spyOn(console, "error");

		const hydratePromise = act(async () => {
			hydrateRoot(
				container,
				<React.Suspense fallback={<div>Loading...</div>}>
					<Component />
				</React.Suspense>,
			);
		});

		// Update during hydration
		docStore.set({
			meta: {
				tags: ["published", "public"],
			},
		});

		await hydratePromise;

		expect(consoleMock).toHaveBeenCalledTimes(0);

		const tagsText = await screen.findByText("tags: published, public");
		expect(tagsText).toBeInTheDocument();
		document.body.removeChild(container);
	});

	it("should handle form reset scenario during hydration", async () => {
		const { hydrateRoot } =
			await vi.importActual<typeof import("react-dom/client")>(
				"react-dom/client",
			);

		const formStore = store({
			username: "initial",
			email: "initial@example.com",
		});

		const Component = () => {
			const form = useStoreValue(formStore);
			const initial = formStore.getInitial();
			const hasChanges =
				form?.username !== initial.username || form?.email !== initial.email;

			return (
				<div>
					<div>username: {form?.username}</div>
					<div>status: {hasChanges ? "modified" : "clean"}</div>
				</div>
			);
		};

		const markup = renderToString(
			<React.Suspense fallback={<div>Loading...</div>}>
				<Component />
			</React.Suspense>,
		);

		const container = document.createElement("div");
		document.body.appendChild(container);
		container.innerHTML = markup;

		expect(container).toHaveTextContent(/username: initial/);
		expect(container).toHaveTextContent(/status: clean/);

		const consoleMock = vi.spyOn(console, "error");

		const hydratePromise = act(async () => {
			hydrateRoot(
				container,
				<React.Suspense fallback={<div>Loading...</div>}>
					<Component />
				</React.Suspense>,
			);
		});

		// User edits form during hydration
		formStore.set({
			username: "changed",
			email: "changed@example.com",
		});

		await hydratePromise;

		expect(consoleMock).toHaveBeenCalledTimes(0);

		const usernameText = await screen.findByText("username: changed");
		const statusText = await screen.findByText("status: modified");
		expect(usernameText).toBeInTheDocument();
		expect(statusText).toBeInTheDocument();

		// Verify reset still works
		act(() => {
			formStore.set(formStore.getInitial());
		});

		const resetStatusText = await screen.findByText("status: clean");
		expect(resetStatusText).toBeInTheDocument();

		document.body.removeChild(container);
	});
});
