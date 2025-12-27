# Simple Store

<div>
    <a href='https://github.com/bholmesdev/simplestack-store' rel='nofollow'>
        <img alt='stars' src='https://img.shields.io/github/stars/bholmesdev/simplestack-store?color=blue'>
    </a>
    <a href='https://www.npmjs.com/package/@simplestack/store' rel='nofollow'>
        <img alt='npm' src='https://img.shields.io/npm/v/@simplestack/store?color=blue'>
    </a>
</div>

[![I fixed Zustand's BIGGEST problem](https://img.youtube.com/vi/gXz-lLIJbMI/0.jpg)](https://www.youtube.com/watch?v=gXz-lLIJbMI)

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

Creates a store with `get`, `set`, `subscribe`, and (for objects and arrays) `select`.

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

#### useStoreValue(store, selector?)

A React hook to subscribe to a store and get its current value. Optionally pass a selector function to derive a value from the store.

- Parameters:
  - `store: Store<T> | undefined`
  - `selector?: (state: T) => R` - optional function to select/compute a value
- Returns: `R | T | undefined`

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

With a selector:

```tsx
const documentStore = store({
  notes: {
    "1": { title: "First" },
    "2": { title: "Second" },
  },
});

function NoteTitle({ id }: { id: string }) {
  // Only re-renders when this specific note's title changes
  const title = useStoreValue(documentStore, (s) => s.notes[id]?.title);
  return <h1>{title}</h1>;
}

function NoteCount() {
  // Compute derived values inline
  const count = useStoreValue(documentStore, (s) => Object.keys(s.notes).length);
  return <span>{count} notes</span>;
}
```

#### useShallow(selector)

Wraps a selector with shallow equality comparison. Use this when your selector returns a new array or object reference on each call.

**The problem:** selectors that return new references (like `Object.values()`, array `filter()`, or object spreads) cause infinite re-renders because React sees a "new" value each time.

```tsx
import { useStoreValue, useShallow } from "@simplestack/store/react";

// ❌ BAD: Creates new array reference each render → infinite loop
const [title, author] = useStoreValue(noteStore, (s) => [s.title, s.author]);

// ✅ GOOD: useShallow compares array contents, stable reference
const [title, author] = useStoreValue(noteStore, useShallow((s) => [s.title, s.author]));
```

More examples:

```tsx
// Filtering creates new array
const drafts = useStoreValue(
  docStore,
  useShallow((s) => s.notes.filter((n) => n.isDraft))
);

// Spreading creates new object
const meta = useStoreValue(
  docStore,
  useShallow((s) => ({ title: s.title, author: s.author }))
);

// Object.keys/values/entries create new arrays
const ids = useStoreValue(
  docStore,
  useShallow((s) => Object.keys(s.notes))
);
```

## Type Reference

These types are exported for TypeScript users.

- StateObject: `Record<string | number | symbol, any>`
- StatePrimitive: `string | number | boolean | null | undefined`
- Setter<T>: `T | ((state: T) => T)`
- Store<T>:
  - `get(): T` - Get the current value of the store.
  - `set(setter: Setter<T>): void` - Set the value directly or by using a function that receives the current state.
  - `subscribe(callback: (state: T) => void): () => void` - Subscribe with a callback. Returns an unsubscribe function.
  - `select(key: K): Store<SelectValue<T, K>>` (present only when `T` is an object or array) - Select a key or array index of the store. Returns a nested Store.
  - `getInitial(): T` - Get the initial state the store was created with. Used internally for SSR resume-ability.

## Contributing

We are open to contributions! **Before submitting your feature request**, please read the [CONTRIBUTING.md](CONTRIBUTING.md) for our issue and PR process.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
