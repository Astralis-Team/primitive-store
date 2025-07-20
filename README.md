# 🧠 PrimitiveStore

`PrimitiveStore` is a lightweight, type-safe reactive state store with:

- Declarative schema definitions
- Support for `string`, `number`, `boolean`, `array`, `object`, and class types
- Reactive subscriptions
- Action system with context
- 💾 Optional persistence using `localStorage`

Ideal for SPA state management, client-server applications, and scenarios where simple yet powerful reactive state is needed.

---

## 🚀 Quick Start

```shell
npm install @astralis-team/primitive-store
```

```ts
import { PrimitiveStore } from '@astralis-team/primitive-store'

const userStore = new PrimitiveStore('UserStore', {
	data: {
		user: {
			name: 'string',
			age: 'number',
		},
	},
	isPersist: true,
})
```
