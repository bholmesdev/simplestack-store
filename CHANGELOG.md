# Changelog

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
