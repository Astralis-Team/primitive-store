## 👂 Subscriptions

### 🔸 Subscribe to a field

```ts
const unsubscribe = userStore.subscribe('user', (newVal, oldVal) => {
	console.log('User updated:', newVal)
})
```

### 🔸 Subscribe to all changes

```ts
const unsubscribe = userStore.subscribe((newVal, oldVal, prop) => {
	console.log(`${prop} changed from`, oldVal, 'to', newVal)
})
```

### 🔸 Unsubscribe

```ts
unsubscribe()
```
