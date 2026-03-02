# Simple Store

<div>
    <a href='https://github.com/bholmesdev/simplestack-store' rel='nofollow'>
        <img alt='stars' src='https://img.shields.io/github/stars/bholmesdev/simplestack-store?color=blue'>
    </a>
    <a href='https://www.npmjs.com/package/@simplestack/store' rel='nofollow'>
        <img alt='npm' src='https://img.shields.io/npm/v/@simplestack/store?color=blue'>
    </a>
</div>

Simple Store (`@simplestack/store`) is a lightweight state management library for React that combines signal-based reactivity with Zustand-style selectors. Create stores, select nested values with `.select()`, and get fine-grained component updates — without the boilerplate of Redux or complex middleware setups.

[![I fixed Zustand's BIGGEST problem](https://img.youtube.com/vi/gXz-lLIJbMI/0.jpg)](https://www.youtube.com/watch?v=gXz-lLIJbMI)

## Features

- **Simple API** — create a store with `store(initialValue)` and read it with `useStoreValue()`
- **Fine-grained selectors** — use `.select('key')` to create sub-stores that update independently
- **Nested path selection** — select deeply nested values with `.select('a', 'b', 'c')`
- **Framework support** — works with Vite, Next.js (App Router), and any React 18/19 setup
- **Middleware system** — built-in logger and support for custom middleware (localStorage, devtools, etc.)
- **Signals under the hood** — powered by the TC39 Signals proposal polyfill for efficient reactivity
- **TypeScript-first** — full type inference for stores, selectors, and middleware
- **Tiny bundle** — minimal dependencies (`signal-polyfill` + `esm-env`)

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
  const {
    title,
    meta: { tags },
  } = useStoreValue(documentStore);
  return (
    <div>
      {title} {tags.join(", ")}
    </div>
  );
}

// Or, select parts of a store to listen to individually
const titleStore = documentStore.select("title");
const tagsStore = documentStore.select("meta", "tags");

function Title() {
  // And scope updates with selected stores for fine-grained control
  const title = useStoreValue(titleStore);
  return (
    <input value={title} onChange={(e) => titleStore.set(e.target.value)} />
  );
}
```

📚 For a complete usage guide and API reference, [visit our documentation](https://simple-stack.dev/store).

## FAQ

### How does Simple Store compare to Zustand?

Simple Store provides a similar selector-based API but uses the TC39 Signals proposal under the hood instead of subscriptions. The `.select()` method creates real sub-stores that automatically sync with the parent, eliminating manual spread-based updates for nested state.

### Does Simple Store work with Next.js?

Yes. Simple Store is compatible with Next.js App Router. Stores initialize once per server request, and client components hydrate with the store's initial value. Components using `useStoreValue()` must be marked as `"use client"`.

### What is the bundle size?

Simple Store has only two dependencies (`signal-polyfill` and `esm-env`) and ships as ESM. The core module is under 2 KB minified + gzipped.

### Can I use Simple Store without React?

Yes. The core `store()` function, `.get()`, `.set()`, and `.select()` work without React. The `useStoreValue` hook is in a separate `/react` entry point and is only needed for React integration.

## Contributing

We are open to contributions! **Before submitting your feature request**, please read the [CONTRIBUTING.md](CONTRIBUTING.md) for our issue and PR process.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
