## 📥 Working with Data

### 🔸 Getting values

```ts
const count = counterStore.count
// or
const count = counterStore.get('count')
```

### 🔸 Setting values

```ts
counterStore.count = 10
// or
counterStore.set('count', 10)
```

### 🔸 Batch update

```ts
counterStore.set({
	count: 5,
	name: 'Alice',
})
```

### 🔸 Get all data

```ts
const snapshot = counterStore.getData()
```

### 🔸 Reset to default

```ts
counterStore.reset() // All fields
counterStore.reset('count') // Specific field
```
