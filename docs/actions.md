## ⚙ Actions

### 🔧 Action Function Signature

```ts
type ActionFunction<T extends Schema> = (
	context: ActionContext<T>,
	...args: any[]
) => any
```

### 📦 Context API

```ts
interface ActionContext<T> {
	get(prop)
	set(prop, value)
	getData()
	reset(prop?)
}
```

### 🔧 Example

```ts
const counterStore = new PrimitiveStore('Counter', {
	data: {
		count: 'number',
	},
	actions: {
		increment({ get, set }) {
			set('count', get('count') + 1)
		},
	},
})

counterStore.actions.increment()
```
