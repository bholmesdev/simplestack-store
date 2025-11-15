import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { store } from "./index.js";
import { useStoreValue } from "./react.js";

describe("Integration Tests", () => {
	describe("Todo App Scenario", () => {
		it("should handle a complete todo app workflow", async () => {
			type Todo = {
				id: number;
				text: string;
				completed: boolean;
			};

			const todosStore = store<Todo[]>([
				{ id: 1, text: "Buy groceries", completed: false },
				{ id: 2, text: "Walk the dog", completed: false },
			]);

			function TodoApp() {
				const todos = useStoreValue(todosStore);

				const addTodo = (text: string) => {
					todosStore.set((current) => [
						...current,
						{ id: Date.now(), text, completed: false },
					]);
				};

				const toggleTodo = (id: number) => {
					todosStore.set((current) =>
						current.map((todo) =>
							todo.id === id ? { ...todo, completed: !todo.completed } : todo,
						),
					);
				};

				return (
					<div>
						<button
							type="button"
							data-testid="add-btn"
							onClick={() => addTodo("New task")}
						>
							Add
						</button>
						<div data-testid="todo-list">
							{todos.map((todo) => (
								<div key={todo.id} data-testid={`todo-${todo.id}`}>
									<span>{todo.text}</span>
									<span>{todo.completed ? "✓" : "○"}</span>
									<button
										type="button"
										data-testid={`toggle-${todo.id}`}
										onClick={() => toggleTodo(todo.id)}
									>
										Toggle
									</button>
								</div>
							))}
						</div>
					</div>
				);
			}

			render(<TodoApp />);

			expect(screen.getByTestId("todo-1")).toBeInTheDocument();
			expect(screen.getByTestId("todo-2")).toBeInTheDocument();

			act(() => {
				screen.getByTestId("toggle-1").click();
			});

			await waitFor(() => {
				expect(todosStore.get()[0].completed).toBe(true);
			});

			act(() => {
				screen.getByTestId("add-btn").click();
			});

			await waitFor(() => {
				expect(todosStore.get()).toHaveLength(3);
			});
		});
	});

	describe("Form State Management Scenario", () => {
		it("should handle complex form with validation", async () => {
			const formStore = store({
				username: "",
				email: "",
				password: "",
				confirmPassword: "",
			});

			const usernameStore = formStore.select("username");
			const emailStore = formStore.select("email");
			const passwordStore = formStore.select("password");

			function FormComponent() {
				const form = useStoreValue(formStore);
				const isValid =
					form.username.length > 0 &&
					form.email.includes("@") &&
					form.password.length >= 8 &&
					form.password === form.confirmPassword;

				return (
					<div>
						<input
							data-testid="username"
							value={form.username}
							onChange={(e) => usernameStore.set(e.target.value)}
						/>
						<input
							data-testid="email"
							value={form.email}
							onChange={(e) => emailStore.set(e.target.value)}
						/>
						<input
							data-testid="password"
							type="password"
							value={form.password}
							onChange={(e) => passwordStore.set(e.target.value)}
						/>
						<button type="button" data-testid="submit" disabled={!isValid}>
							Submit
						</button>
					</div>
				);
			}

			render(<FormComponent />);

			const submitBtn = screen.getByTestId("submit") as HTMLButtonElement;
			expect(submitBtn.disabled).toBe(true);

			const usernameInput = screen.getByTestId("username") as HTMLInputElement;
			act(() => {
				fireEvent.change(usernameInput, { target: { value: "alice" } });
			});

			await waitFor(() => {
				expect(formStore.get().username).toBe("alice");
			});

			const emailInput = screen.getByTestId("email") as HTMLInputElement;
			act(() => {
				fireEvent.change(emailInput, {
					target: { value: "alice@example.com" },
				});
			});

			await waitFor(() => {
				expect(formStore.get().email).toBe("alice@example.com");
			});
		});
	});

	describe("Shopping Cart Scenario", () => {
		it("should handle shopping cart operations", async () => {
			type CartItem = {
				id: number;
				name: string;
				price: number;
				quantity: number;
			};

			const cartStore = store<CartItem[]>([]);

			function ShoppingCart() {
				const cart = useStoreValue(cartStore);
				const total = cart.reduce(
					(sum, item) => sum + item.price * item.quantity,
					0,
				);

				const addItem = (item: CartItem) => {
					cartStore.set((current) => {
						const existing = current.find((i) => i.id === item.id);
						if (existing) {
							return current.map((i) =>
								i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
							);
						}
						return [...current, item];
					});
				};

				const removeItem = (id: number) => {
					cartStore.set((current) => current.filter((i) => i.id !== id));
				};

				return (
					<div>
						<button
							type="button"
							data-testid="add-apple"
							onClick={() =>
								addItem({ id: 1, name: "Apple", price: 1.5, quantity: 1 })
							}
						>
							Add Apple
						</button>
						<button
							type="button"
							data-testid="add-banana"
							onClick={() =>
								addItem({ id: 2, name: "Banana", price: 0.75, quantity: 1 })
							}
						>
							Add Banana
						</button>
						<div data-testid="cart-items">
							{cart.map((item) => (
								<div key={item.id} data-testid={`item-${item.id}`}>
									<span>
										{item.name} x{item.quantity}
									</span>
									<button
										type="button"
										data-testid={`remove-${item.id}`}
										onClick={() => removeItem(item.id)}
									>
										Remove
									</button>
								</div>
							))}
						</div>
						<div data-testid="total">${total.toFixed(2)}</div>
					</div>
				);
			}

			render(<ShoppingCart />);

			expect(screen.getByTestId("total")).toHaveTextContent("$0.00");

			act(() => {
				screen.getByTestId("add-apple").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("total")).toHaveTextContent("$1.50");
			});

			act(() => {
				screen.getByTestId("add-apple").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("total")).toHaveTextContent("$3.00");
			});

			act(() => {
				screen.getByTestId("add-banana").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("total")).toHaveTextContent("$3.75");
			});

			act(() => {
				screen.getByTestId("remove-1").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("total")).toHaveTextContent("$0.75");
			});
		});
	});

	describe("Theme Switcher Scenario", () => {
		it("should handle global theme state across components", async () => {
			const themeStore = store({
				mode: "light" as "light" | "dark",
				fontSize: 16,
				fontFamily: "sans-serif",
			});

			const modeStore = themeStore.select("mode");
			const fontSizeStore = themeStore.select("fontSize");

			function ThemeProvider() {
				const theme = useStoreValue(themeStore);
				return (
					<div data-testid="theme-provider" data-theme={theme.mode}>
						<Header />
						<Content />
					</div>
				);
			}

			function Header() {
				const mode = useStoreValue(modeStore);
				return (
					<div>
						<button
							type="button"
							data-testid="toggle-theme"
							onClick={() => modeStore.set(mode === "light" ? "dark" : "light")}
						>
							Current: {mode}
						</button>
					</div>
				);
			}

			function Content() {
				const fontSize = useStoreValue(fontSizeStore);
				return (
					<div>
						<div data-testid="font-size">Font size: {fontSize}px</div>
						<button
							type="button"
							data-testid="increase-font"
							onClick={() => fontSizeStore.set((s) => s + 2)}
						>
							+
						</button>
						<button
							type="button"
							data-testid="decrease-font"
							onClick={() => fontSizeStore.set((s) => s - 2)}
						>
							-
						</button>
					</div>
				);
			}

			render(<ThemeProvider />);

			expect(screen.getByTestId("theme-provider")).toHaveAttribute(
				"data-theme",
				"light",
			);
			expect(screen.getByTestId("toggle-theme")).toHaveTextContent(
				"Current: light",
			);

			act(() => {
				screen.getByTestId("toggle-theme").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("theme-provider")).toHaveAttribute(
					"data-theme",
					"dark",
				);
			});

			act(() => {
				screen.getByTestId("increase-font").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("font-size")).toHaveTextContent(
					"Font size: 18px",
				);
			});

			act(() => {
				screen.getByTestId("decrease-font").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("font-size")).toHaveTextContent(
					"Font size: 16px",
				);
			});
		});
	});

	describe("Multi-User Chat Scenario", () => {
		it("should handle messages and user state", async () => {
			type Message = {
				id: number;
				userId: number;
				text: string;
				timestamp: number;
			};

			const chatStore = store({
				messages: [] as Message[],
				currentUserId: 1,
				users: [
					{ id: 1, name: "Alice" },
					{ id: 2, name: "Bob" },
				],
			});

			const messagesStore = chatStore.select("messages");

			function ChatApp() {
				const chat = useStoreValue(chatStore);

				const sendMessage = (text: string) => {
					messagesStore.set((messages) => [
						...messages,
						{
							id: Date.now(),
							userId: chat.currentUserId,
							text,
							timestamp: Date.now(),
						},
					]);
				};

				return (
					<div>
						<button
							type="button"
							data-testid="send-hello"
							onClick={() => sendMessage("Hello!")}
						>
							Send
						</button>
						<div data-testid="message-list">
							{chat.messages.map((msg) => {
								const user = chat.users.find((u) => u.id === msg.userId);
								return (
									<div key={msg.id} data-testid={`msg-${msg.id}`}>
										<strong>{user?.name}:</strong> {msg.text}
									</div>
								);
							})}
						</div>
						<div data-testid="message-count">
							{chat.messages.length} messages
						</div>
					</div>
				);
			}

			render(<ChatApp />);

			expect(screen.getByTestId("message-count")).toHaveTextContent(
				"0 messages",
			);

			act(() => {
				screen.getByTestId("send-hello").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("message-count")).toHaveTextContent(
					"1 messages",
				);
			});
		});
	});

	describe("Subscription Performance Scenario", () => {
		it("should handle selective updates efficiently", async () => {
			const appStore = store({
				user: { name: "Alice", email: "alice@example.com" },
				settings: { theme: "light", notifications: true },
				data: { items: [1, 2, 3] },
			});

			const userStore = appStore.select("user");
			const settingsStore = appStore.select("settings");

			const userRenderSpy = vi.fn();
			const settingsRenderSpy = vi.fn();

			function UserComponent() {
				const user = useStoreValue(userStore);
				userRenderSpy();
				return <div data-testid="user">{user.name}</div>;
			}

			function SettingsComponent() {
				const settings = useStoreValue(settingsStore);
				settingsRenderSpy();
				return <div data-testid="settings">{settings.theme}</div>;
			}

			render(
				<>
					<UserComponent />
					<SettingsComponent />
				</>,
			);

			const initialUserRenders = userRenderSpy.mock.calls.length;
			const initialSettingsRenders = settingsRenderSpy.mock.calls.length;

			// Update only settings - user component should not re-render
			act(() => {
				settingsStore.set({ theme: "dark", notifications: true });
			});

			await waitFor(() => {
				expect(screen.getByTestId("settings")).toHaveTextContent("dark");
			});

			expect(settingsRenderSpy.mock.calls.length).toBe(
				initialSettingsRenders + 1,
			);
			expect(userRenderSpy.mock.calls.length).toBe(initialUserRenders); // unchanged

			// Update only user - settings component should not re-render
			const settingsRendersBefore = settingsRenderSpy.mock.calls.length;

			act(() => {
				userStore.set({ name: "Bob", email: "bob@example.com" });
			});

			await waitFor(() => {
				expect(screen.getByTestId("user")).toHaveTextContent("Bob");
			});

			expect(userRenderSpy.mock.calls.length).toBe(initialUserRenders + 1);
			expect(settingsRenderSpy.mock.calls.length).toBe(settingsRendersBefore); // unchanged
		});
	});

	describe("Undo/Redo Scenario", () => {
		it("should implement basic undo/redo functionality", async () => {
			const historyStore = store({
				past: [] as number[],
				present: 0,
				future: [] as number[],
			});

			const increment = () => {
				historyStore.set((state) => ({
					past: [...state.past, state.present],
					present: state.present + 1,
					future: [],
				}));
			};

			const undo = () => {
				historyStore.set((state) => {
					if (state.past.length === 0) return state;
					const previous = state.past[state.past.length - 1];
					return {
						past: state.past.slice(0, -1),
						present: previous,
						future: [state.present, ...state.future],
					};
				});
			};

			const redo = () => {
				historyStore.set((state) => {
					if (state.future.length === 0) return state;
					const next = state.future[0];
					return {
						past: [...state.past, state.present],
						present: next,
						future: state.future.slice(1),
					};
				});
			};

			function UndoRedoCounter() {
				const history = useStoreValue(historyStore);
				return (
					<div>
						<div data-testid="counter">{history.present}</div>
						<button type="button" data-testid="increment" onClick={increment}>
							+1
						</button>
						<button
							type="button"
							data-testid="undo"
							onClick={undo}
							disabled={history.past.length === 0}
						>
							Undo
						</button>
						<button
							type="button"
							data-testid="redo"
							onClick={redo}
							disabled={history.future.length === 0}
						>
							Redo
						</button>
					</div>
				);
			}

			render(<UndoRedoCounter />);

			expect(screen.getByTestId("counter")).toHaveTextContent("0");

			for (let i = 0; i < 3; i++) {
				act(() => {
					screen.getByTestId("increment").click();
				});
			}

			await waitFor(() => {
				expect(screen.getByTestId("counter")).toHaveTextContent("3");
			});

			act(() => {
				screen.getByTestId("undo").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("counter")).toHaveTextContent("2");
			});

			act(() => {
				screen.getByTestId("undo").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("counter")).toHaveTextContent("1");
			});

			act(() => {
				screen.getByTestId("redo").click();
			});

			await waitFor(() => {
				expect(screen.getByTestId("counter")).toHaveTextContent("2");
			});
		});
	});
});
