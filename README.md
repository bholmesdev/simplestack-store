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
const tagsStore = documentStore.select("meta").select("tags");

function Title() {
  // And scope updates with selected stores for fine-grained control
  const title = useStoreValue(titleStore);
  return (
    <input value={title} onChange={(e) => titleStore.set(e.target.value)} />
  );
}
```

📚 For a complete usage guide and API reference, [visit our documentation](https://simple-stack.dev/store).

## Contributing

We are open to contributions! **Before submitting your feature request**, please read the [CONTRIBUTING.md](CONTRIBUTING.md) for our issue and PR process.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
