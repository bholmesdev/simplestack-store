# Changelog

## [0.7.3]

### Added

- `select()` now accepts variadic paths for nested objects/arrays, with type inference that propagates `undefined` when the path may not exist.
- Dev-only warning when `set()` is discarded because a `select()` path crosses a potentially undefined value.

Example:

```ts
const documentStore = store({
    meta: {
        tags: [{ name: "cooking" }],
    }
});

const tagsStore = documentStore.select('meta', 'tags');
// -> Store<Array<{ name: string }>>
const firstTagNameStore = tagsStore.select(0, 'name');
// -> Store<string | undefined>
// For potentially undefined selections, the `undefined` is propagated
```

### Fixed

- Nested `select()` setters now update deeply nested arrays/objects by cloning each parent level instead of only the top level.
- `select()` path setters safely no-op when array indices or object keys are missing at runtime (rather than mutating invalid paths).

## [0.7.0]

### Breaking Changes

- **`useStoreValue` no longer accepts `undefined`**: We previously allowed `undefined` to make nested selects easier for potentially undefined object keys. However, this caused components to be "stuck" in an `undefined` state until the next render.

  ```ts
  // ❌ No longer allowed
  const value = useStoreValue(undefined);
  
  // ✅ Use conditional rendering instead
  {myStore && <Component store={myStore} />}
  ```

  Note: Stores that contain `undefined` as a value are still supported:
  ```ts
  const undefinedStore = store(undefined);
  const value = useStoreValue(undefinedStore); // ✅ Works fine
  ```
