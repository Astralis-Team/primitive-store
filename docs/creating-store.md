## 🏗 Creating a Store

### 🔧 Signature

```ts
new PrimitiveStore(storeName: string, config: StoreConfig)
```

### 🧾 StoreConfig Interface

```ts
interface StoreConfig<T extends Schema, A extends Actions<T> = {}> {
	data: T
	actions?: A
	isPersist?: boolean
}
```

### 🧪 Example

```ts
const counterStore = new PrimitiveStore('CounterStore', {
	data: {
		count: 'number',
	},
	isPersist: true,
})
```
