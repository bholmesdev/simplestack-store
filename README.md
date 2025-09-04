# Simple Store

A simple, `select`-xcellent state management library with the power of Jotai and Zustand combined.

```ts
import { store } from "@simplestack/store";

// Define your store with an initial state
const documentStore = store({
  title: "Untitled",
  authors: ["Ada", "Ben"],
  meta: {
    pages: 3,
    tags: ["draft", "internal"],
  },
});

// Use getters and setters to update the store
documentStore.set((doc) => ({ ...doc, title: "Welcome to simple store!" }));
console.log(documentStore.get());
// { title: "Welcome to simple store!", authors: ["Ada", "Ben"], meta: { pages: 3, tags: ["draft", "internal"] } }

// Select parts of a store to listen and update individually
const titleStore = documentStore.select("title");
const tagsStore = documentStore.select("meta").select("tags");

titleStore.set("You're going to love selectors");
console.log(titleStore.get()); // "You're going to love selectors"
console.log(documentStore.get().title); // "You're going to love selectors"
```

## API

### store(initial)

Creates a store with `get`, `set`, `listen`, and (for objects and arrays) `select`.

- Parameters: `initial: number | string | boolean | null | undefined | object`
- Returns: `Store<T>` where `T` is inferred from `initial` or supplied via generics

```ts
import { store } from "@simplestack/store";

const counter = store(0);
counter.set((n) => n + 1);
console.log(counter.get()); // 1

// Select sub-stores for objects and arrays
const doc = store({ title: "x" });
const title = doc.select("title");
```

### React

#### useStoreValue(store)

React hook to subscribe to a store and get its current value.

- Parameters: `store: Store<T> | undefined`
- Returns: `T | undefined`

```ts path=null start=null
import { store } from "simplestack-store";
import { useStoreValue } from "simplestack-store/react";

const counter = store(0);

function Counter() {
  const value = useStoreValue(counter);
  return <span>{value}</span>;
}
```

## Type Reference

These types are exported for TypeScript users.

- StateObject: `Record<string | number | symbol, any>`
- StatePrimitive: `string | number | boolean | null | undefined`
- Setter<T>: `T | ((state: T) => T)`
- Store<T>:
  - `get(): T`
  - `set(setter: Setter<T>): void`
  - `listen(callback: (state: T) => void): () => void`
  - `select(key: K): Store<SelectValue<T, K>>`: present only when `T` is an object or array

## Contributing

Contributions are welcome! Please feel free to submit an issue or pull request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
