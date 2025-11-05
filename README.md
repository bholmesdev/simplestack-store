# Simple Store

A simple, `select`-xcellent state management library for React.

The goal: make a storage solution as powerful as Zustand or Redux, without complicated functions to set and select state.

Here's an overview of how stores are created, and how you can operate on parts of a store using `.select()`:

```tsx
import { store } from "@simplestack/store";
import { useStoreValue } from "@simplestack/store/react";

// Define your store with an initial state
const documentStore = store({
  title: "Untitled",
  authors: ["Ada", "Ben"],
  meta: {
    pages: 3,
    tags: ["draft", "internal"],
  },
});

function Document() {
  // Update your UI with the store's current state
  const { title, meta: { tags } } = useStoreValue(documentStore);
  return (
    <div>
      {title} {tags.join(", ")}
    </div>
  );
}

// Or, select parts of a store to listen to individually
const titleStore = documentStore.select("title");
const tagsStore = documentStore.select("meta").select("tags");

function Title() {
  // And scope updates with selected stores for fine-grained control
  const title = useStoreValue(titleStore);
  return (
    <input value={title} onChange={(e) => titleStore.set(e.target.value)} />
  );
}
```

## API

### store(initial)

Creates a store with `get`, `getInitial`, `set`, `subscribe`, and (for objects and arrays) `select`.

- Parameters: `initial: number | string | boolean | null | undefined | object`
- Returns: `Store<T>` where `T` is inferred from `initial` or supplied via generics

```ts
import { store } from "@simplestack/store";

const counter = store(0);
counter.set((n) => n + 1);
console.log(counter.get()); // 1

// Select parts of a store for objects and arrays
const doc = store({ title: "x" });
const title = doc.select("title");
```

### React

#### useStoreValue(store)

React hook to subscribe to a store and get its current value.

- Parameters: `store: Store<T> | undefined`
- Returns: `T | undefined`

```tsx
import { store } from "@simplestack/store";
import { useStoreValue } from "@simplestack/store/react";

const counterStore = store(0);

function Counter() {
  const counter = useStoreValue(counterStore);
  return (
    <button onClick={() => counterStore.set((n) => n + 1)}>{counter}</button>
  );
}
```

## Type Reference

These types are exported for TypeScript users.

- StateObject: `Record<string | number | symbol, any>`
- StatePrimitive: `string | number | boolean | null | undefined`
- Setter<T>: `T | ((state: T) => T)`
- Store<T>:
  - `get(): T`
  - `getInitial(): T`
  - `set(setter: Setter<T>): void`
  - `subscribe(callback: (state: T) => void): () => void`
  - `select(key: K): Store<SelectValue<T, K>>`: present only when `T` is an object or array

## Contributing

Contributions are welcome! Please feel free to submit an issue or pull request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
