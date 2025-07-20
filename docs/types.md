## 📐 Supported Types & Schema

### 🔸 Primitive Types

| Type    | Description       |
| ------- | ----------------- |
| string  | Text              |
| number  | Numeric value     |
| boolean | True/False        |
| array   | Array of items    |
| object  | Plain object      |
| Class   | JS/TS constructor |

### 🔸 Example Schema

```ts
const schema = {
	name: 'string',
	age: 'number',
	isAdmin: 'boolean',
	tags: 'array',
	profile: {
		bio: 'string',
		avatar: 'string',
	},
}
```

### 🔸 Using Classes

```ts
class Point {
	constructor(public x = 0, public y = 0) {}
}

const store = new PrimitiveStore('GeometryStore', {
	data: {
		current: Point,
	},
})
```
