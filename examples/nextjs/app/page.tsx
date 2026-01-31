"use client";

import { store } from "@simplestack/store";
import { useStoreValue } from "@simplestack/store/react";

const countStore = store(0);

const documentStore = store({
  title: "Untitled",
  authors: ["Ada", "Ben"],
  meta: {
    pages: 3,
    tags: [{name: "draft", color: "red"}, {name: "internal", color: "blue"}],
  },
});

function Counter() {
  const count = useStoreValue(countStore);

  return (
    <div className="counter">
      <span className="count">{count}</span>
      <button onClick={() => countStore.set((c) => c + 1)}>+1</button>
    </div>
  );
}

export default function Home() {
  return (
    <div className="app">
      <h1>@simplestack/store</h1>
      <p>Next.js Example</p>
      <Counter />
    </div>
  );
}
