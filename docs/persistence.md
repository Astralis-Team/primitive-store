## 💾 Persistence

### ✅ What it does

- Saves the store data to `localStorage` under the `storeName`
- Restores data automatically on initialization (on the client)
- Keeps store and localStorage in sync

### 🔧 Enabling persistence

```ts
const themeStore = new PrimitiveStore('ThemeStore', {
	data: { mode: 'string' },
	isPersist: true,
})
```

### 🧠 Notes

- Only works in the browser (`typeof window !== 'undefined'`)
- Safe to use in SSR environments (persistence skipped server-side)
