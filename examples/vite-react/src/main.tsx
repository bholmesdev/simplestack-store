import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { store } from "@simplestack/store";
import { useStoreValue } from "@simplestack/store/react";

import "./index.css";

const countStore = store(0);

function Counter() {
  const count = useStoreValue(countStore);

  return (
    <div className="counter">
      <span className="count">{count}</span>
      <button onClick={() => countStore.set((c) => c + 1)}>+1</button>
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <h1>@simplestack/store</h1>
      <p>Vite + React Example</p>
      <Counter />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
