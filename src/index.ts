// Types for data schema
type PrimitiveType = 'string' | 'number' | 'boolean' | 'array' | 'object'

type SchemaValue =
	| PrimitiveType
	| (new (...args: any[]) => any)
	| { [key: string]: SchemaValue }

type Schema = Record<string, SchemaValue>

// Utility types for extracting types from schema
type InferType<T> = T extends 'string'
	? string
	: T extends 'number'
	? number
	: T extends 'boolean'
	? boolean
	: T extends 'array'
	? any[]
	: T extends 'object'
	? Record<string, any>
	: T extends new (...args: any[]) => infer R
	? R
	: T extends Record<string, any>
	? { [K in keyof T]: InferType<T[K]> }
	: any

type InferStoreType<T extends Schema> = {
	[K in keyof T]: InferType<T[K]>
}

// Types for listeners
type Listener<T = any> = (newValue: T, oldValue: T, prop?: string) => void
type Unsubscribe = () => void

// Types for actions
type ActionContext<T extends Schema> = {
	get<K extends keyof InferStoreType<T>>(prop: K): InferStoreType<T>[K]
	set<K extends keyof InferStoreType<T>>(
		prop: K,
		value: InferStoreType<T>[K]
	): void
	set(updates: Partial<InferStoreType<T>>): void
	getData(): InferStoreType<T>
	reset(): void
	reset<K extends keyof InferStoreType<T>>(prop: K): void
}

type ActionFunction<T extends Schema> = (
	context: ActionContext<T>,
	...args: any[]
) => any

type Actions<T extends Schema> = Record<string, ActionFunction<T>>

// Store configuration
interface StoreConfig<T extends Schema, A extends Actions<T> = {}> {
	data: T
	actions?: A
	isPersist?: boolean
}

class PrimitiveStore<T extends Schema, A extends Actions<T> = {}> {
	private _data: InferStoreType<T>
	private _listeners: Map<string, Set<Listener>>
	private _schema: T
	private _actions: A
	private _storeName: string
	private _isPersist: boolean
	public actions: { [K in keyof A]: (...args: any[]) => ReturnType<A[K]> }

	constructor(storeName: string, config: StoreConfig<T, A>) {
		this._storeName = storeName
		this._schema = config.data
		this._actions = config.actions || ({} as A)
		this._listeners = new Map()
		this._isPersist = config.isPersist ?? false

		this._data = {} as InferStoreType<T>

		this._initializeData()
		this._loadPersistedData()

		this.actions = this._createActions()

		return this._createProxy()
	}

	private _initializeData(): void {
		Object.keys(this._schema).forEach(key => {
			const type = this._schema[key]
			;(this._data as any)[key] = this._getDefaultValue(type)
		})
	}

	private _getDefaultValue(type: SchemaValue): any {
		if (typeof type === 'string') {
			switch (type.toLowerCase()) {
				case 'string':
					return ''
				case 'number':
					return 0
				case 'boolean':
					return false
				case 'array':
					return []
				case 'object':
					return {}
				default:
					return null
			}
		}
		if (typeof type === 'function') {
			try {
				return new type()
			} catch {
				return null
			}
		}
		if (typeof type === 'object' && type !== null && !Array.isArray(type)) {
			return this._createObjectFromSchema(type)
		}
		return null
	}

	private _createObjectFromSchema(schema: Record<string, SchemaValue>): any {
		const obj: any = {}
		for (const [key, valueType] of Object.entries(schema)) {
			if (typeof valueType === 'string') {
				obj[key] = this._getDefaultValue(valueType)
			} else if (typeof valueType === 'function') {
				try {
					obj[key] = new valueType()
				} catch {
					obj[key] = null
				}
			} else if (typeof valueType === 'object' && valueType !== null) {
				obj[key] = this._createObjectFromSchema(valueType)
			} else {
				obj[key] = null
			}
		}
		return obj
	}

	private _createActions(): {
		[K in keyof A]: (...args: any[]) => ReturnType<A[K]>
	} {
		const boundActions = {} as any

		const context: ActionContext<T> = {
			get: prop => this.get(prop),
			set: (propOrUpdates: any, value?: any) => {
				if (typeof propOrUpdates === 'object') this.set(propOrUpdates)
				else this.set(propOrUpdates, value)
			},
			getData: () => this.getData(),
			reset: (prop?: any) => {
				if (prop) this.reset(prop)
				else this.reset()
			},
		}

		for (const [actionName, actionFn] of Object.entries(this._actions)) {
			boundActions[actionName] = (...args: any[]) => actionFn(context, ...args)
		}

		return boundActions
	}

	private _createProxy(): this & InferStoreType<T> {
		return new Proxy(this, {
			get: (target, prop) => {
				if (typeof prop === 'string') {
					if (prop in target._data) return target._data[prop]
					if (prop === 'actions') return target.actions
				}
				if (typeof (target as any)[prop] === 'function') {
					return (target as any)[prop].bind(target)
				}
				return (target as any)[prop]
			},
			set: (target, prop, value) => {
				if (typeof prop !== 'string') return false
				if (prop === 'actions') return false

				if (prop in target._schema) {
					const oldValue = target._data[prop]
					if (target._validateType(prop, value)) {
						;(target._data as any)[prop] = value
						target._notifyListeners(prop, value, oldValue)
						return true
					} else {
						console.warn(
							`Invalid type for "${prop}". Expected:`,
							target._schema[prop]
						)
						return false
					}
				}

				if (prop.startsWith('_') || prop in target) {
					;(target as any)[prop] = value
					return true
				}

				console.warn(`Property "${prop}" is not defined in schema`)
				return false
			},
		}) as any
	}

	private _validateType(prop: string, value: any): boolean {
		const expectedType = this._schema[prop]
		if (typeof expectedType === 'string') {
			switch (expectedType) {
				case 'string':
					return typeof value === 'string'
				case 'number':
					return typeof value === 'number'
				case 'boolean':
					return typeof value === 'boolean'
				case 'array':
					return Array.isArray(value)
				case 'object':
					return (
						typeof value === 'object' && !Array.isArray(value) && value !== null
					)
			}
		}
		if (typeof expectedType === 'function') {
			return (
				value instanceof expectedType || value === null || value === undefined
			)
		}
		if (typeof expectedType === 'object' && expectedType !== null) {
			return this._validateObjectSchema(value, expectedType)
		}
		return true
	}

	private _validateObjectSchema(
		value: any,
		schema: Record<string, SchemaValue>
	): boolean {
		if (typeof value !== 'object' || value === null || Array.isArray(value))
			return false
		for (const [key, expectedType] of Object.entries(schema)) {
			if (!(key in value)) continue
			const fieldValue = value[key]
			if (typeof expectedType === 'string') {
				switch (expectedType) {
					case 'string':
						if (typeof fieldValue !== 'string') return false
						break
					case 'number':
						if (typeof fieldValue !== 'number') return false
						break
					case 'boolean':
						if (typeof fieldValue !== 'boolean') return false
						break
					case 'array':
						if (!Array.isArray(fieldValue)) return false
						break
					case 'object':
						if (
							typeof fieldValue !== 'object' ||
							fieldValue === null ||
							Array.isArray(fieldValue)
						)
							return false
						break
				}
			} else if (typeof expectedType === 'function') {
				if (fieldValue !== null && !(fieldValue instanceof expectedType))
					return false
			} else if (typeof expectedType === 'object') {
				if (!this._validateObjectSchema(fieldValue, expectedType)) return false
			}
		}
		return true
	}

	private _notifyListeners(prop: string, newValue: any, oldValue: any): void {
		const propListeners = this._listeners.get(prop)
		if (propListeners) {
			propListeners.forEach(cb => cb(newValue, oldValue, prop))
		}
		const globalListeners = this._listeners.get('*')
		if (globalListeners) {
			globalListeners.forEach(cb => cb(newValue, oldValue, prop))
		}
		this._persist()
	}

	private _persist(): void {
		if (typeof window === 'undefined' || !this._isPersist) return
		try {
			const dataToSave = JSON.stringify(this._data)
			window.localStorage.setItem(this._storeName, dataToSave)
		} catch (err) {
			console.warn(
				`Error saving store "${this._storeName}" to localStorage:`,
				err
			)
		}
	}

	private _loadPersistedData(): void {
		if (typeof window === 'undefined' || !this._isPersist) return
		try {
			const raw = window.localStorage.getItem(this._storeName)
			if (raw) {
				const parsed = JSON.parse(raw)
				this.set(parsed)
			}
		} catch (err) {
			console.warn(
				`Error loading store "${this._storeName}" from localStorage:`,
				err
			)
		}
	}

	subscribe<K extends keyof InferStoreType<T>>(
		prop: K,
		callback: Listener<InferStoreType<T>[K]>
	): Unsubscribe

	subscribe(callback: Listener): Unsubscribe

	subscribe<K extends keyof InferStoreType<T>>(
		propOrCallback: K | Listener,
		callback?: Listener<InferStoreType<T>[K]>
	): Unsubscribe {
		let prop: string
		let cb: Listener

		if (typeof propOrCallback === 'function') {
			cb = propOrCallback
			prop = '*'
		} else {
			prop = propOrCallback as string
			cb = callback!
		}

		if (!this._listeners.has(prop)) {
			this._listeners.set(prop, new Set())
		}

		this._listeners.get(prop)!.add(cb)

		return () => {
			const listeners = this._listeners.get(prop)
			if (listeners) {
				listeners.delete(cb)
				if (listeners.size === 0) this._listeners.delete(prop)
			}
		}
	}

	get<K extends keyof InferStoreType<T>>(prop: K): InferStoreType<T>[K] {
		return this._data[prop]
	}

	set<K extends keyof InferStoreType<T>>(
		prop: K,
		value: InferStoreType<T>[K]
	): void
	set(updates: Partial<InferStoreType<T>>): void
	set<K extends keyof InferStoreType<T>>(
		propOrUpdates: K | Partial<InferStoreType<T>>,
		value?: InferStoreType<T>[K]
	): void {
		if (typeof propOrUpdates === 'object') {
			Object.keys(propOrUpdates).forEach(key => {
				;(this as any)[key] = (propOrUpdates as any)[key]
			})
		} else {
			;(this as any)[propOrUpdates] = value
		}
	}

	getData(): InferStoreType<T> {
		return { ...this._data }
	}

	reset(): void
	reset<K extends keyof InferStoreType<T>>(prop: K): void
	reset<K extends keyof InferStoreType<T>>(prop?: K): void {
		if (prop) {
			if (prop in this._schema) {
				;(this as any)[prop] = this._getDefaultValue(this._schema[prop])
			}
		} else {
			Object.keys(this._schema).forEach(key => {
				;(this as any)[key] = this._getDefaultValue(this._schema[key])
			})
		}
	}

	getSchema(): T {
		return { ...this._schema }
	}
}
