# Zustand - Complete Guide

> The modern, minimalist state management library for React.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Core Concepts](#core-concepts)
3. [API Reference](#api-reference)
4. [Middleware](#middleware)
5. [Common Patterns](#common-patterns)
6. [Pitfalls & Solutions](#pitfalls--solutions)
7. [Best Practices](#best-practices)

---

## How It Works

Zustand is a small, fast, and scalable state management library. Unlike Redux, it doesn't require Providers, reducers, or actions. Unlike Context, it doesn't cause unnecessary re-renders.

### The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        ZUSTAND FLOW                             │
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │ Component A │    │ Component B │    │ Component C │        │
│   │  (counter)  │    │   (name)    │    │  (neither)  │        │
│   └──────┬──────┘    └──────┬──────┘    └─────────────┘        │
│          │                  │              (no re-render)       │
│   subscribes to       subscribes to                             │
│   state.counter       state.name                                │
│          │                  │                                   │
│          ▼                  ▼                                   │
│   ┌─────────────────────────────────────────────────┐          │
│   │                    STORE                         │          │
│   │  { counter: 0, name: 'John', increment: fn }    │          │
│   └─────────────────────────────────────────────────┘          │
│                                                                 │
│   No Provider needed! Store lives outside React.               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Differentiators

| Feature | Context | Redux | Zustand |
|---------|---------|-------|---------|
| Provider Required | Yes | Yes | No |
| Re-renders | All consumers | Selector-based | Selector-based |
| Bundle Size | 0 | ~15KB | ~1KB |
| Boilerplate | Low | High | Very Low |
| Works Outside React | No | Yes | Yes |

---

## Core Concepts

### 1. Creating a Store

```tsx
import { create } from 'zustand';

interface BearStore {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
}

const useBearStore = create<BearStore>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));
```

### 2. Using the Store

```tsx
function BearCounter() {
  // Subscribe to specific state - only re-renders when bears changes
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} bears around here</h1>;
}

function Controls() {
  // Subscribe to action - doesn't re-render on state changes
  const increasePopulation = useBearStore((state) => state.increasePopulation);
  return <button onClick={increasePopulation}>Add bear</button>;
}
```

### 3. The `set` Function

```tsx
const useStore = create((set, get) => ({
  count: 0,
  
  // Replace the entire state slice
  reset: () => set({ count: 0 }),
  
  // Update based on previous state
  increment: () => set((state) => ({ count: state.count + 1 })),
  
  // Replace entire state (second arg = true)
  replaceState: () => set({ count: 0 }, true),
}));
```

### 4. The `get` Function

Access current state without subscribing:

```tsx
const useStore = create((set, get) => ({
  items: [],
  
  getTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.price, 0);
  },
  
  addItem: (item) => {
    const currentTotal = get().getTotal();
    if (currentTotal + item.price > 1000) {
      console.warn('Budget exceeded!');
      return;
    }
    set((state) => ({ items: [...state.items, item] }));
  },
}));
```

---

## API Reference

### create

The main function to create a store:

```tsx
import { create } from 'zustand';

// Basic usage
const useStore = create<State>((set, get, store) => ({
  // Initial state
  count: 0,
  
  // Actions
  increment: () => set((state) => ({ count: state.count + 1 })),
  
  // Async actions
  fetchData: async () => {
    const data = await api.fetch();
    set({ data });
  },
  
  // Computed values (as methods)
  getDoubled: () => get().count * 2,
}));

// With middleware
const useStore = create<State>()(
  devtools(
    persist(
      (set, get) => ({
        // ...
      }),
      { name: 'store-name' }
    )
  )
);
```

### Store Hook Usage

```tsx
// Subscribe to a single value
const count = useStore((state) => state.count);

// Subscribe to an action (stable reference)
const increment = useStore((state) => state.increment);

// Subscribe to multiple values with shallow comparison
import { useShallow } from 'zustand/react/shallow';

const { count, name } = useStore(
  useShallow((state) => ({ count: state.count, name: state.name }))
);

// Get entire state (rarely needed - causes re-render on any change)
const state = useStore();

// Get state outside React
const count = useStore.getState().count;

// Subscribe outside React
const unsub = useStore.subscribe((state) => console.log(state));

// Subscribe to specific slice outside React
const unsub = useStore.subscribe(
  (state) => state.count,
  (count) => console.log('Count changed:', count)
);
```

### setState (Outside React)

```tsx
// Set state from anywhere
useStore.setState({ count: 10 });

// With updater function
useStore.setState((state) => ({ count: state.count + 1 }));
```

### getState (Outside React)

```tsx
// Get current state snapshot
const currentState = useStore.getState();
console.log(currentState.count);
```

---

## Middleware

### devtools

Enables Redux DevTools integration:

```tsx
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useStore = create<Store>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set(
        (state) => ({ count: state.count + 1 }),
        false, // replace: false (default)
        'increment' // action name for DevTools
      ),
    }),
    {
      name: 'MyStore', // Name in DevTools
      enabled: process.env.NODE_ENV !== 'production',
    }
  )
);
```

### persist

Persists state to storage:

```tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useStore = create<Store>()(
  persist(
    (set, get) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
    {
      name: 'my-store', // localStorage key
      
      // Optional: Use sessionStorage instead
      storage: createJSONStorage(() => sessionStorage),
      
      // Optional: Only persist certain fields
      partialize: (state) => ({ count: state.count }),
      
      // Optional: Version for migrations
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migration logic
        }
        return persistedState as Store;
      },
      
      // Optional: Merge strategy
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
      }),
      
      // Optional: Callbacks
      onRehydrateStorage: (state) => {
        console.log('Hydration starts');
        return (state, error) => {
          if (error) console.error('Hydration failed', error);
          else console.log('Hydration finished');
        };
      },
    }
  )
);

// Check hydration status
const hasHydrated = useStore.persist.hasHydrated();
await useStore.persist.rehydrate();
useStore.persist.clearStorage();
```

### immer

Enables Immer-style "mutations":

```tsx
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useStore = create<Store>()(
  immer((set) => ({
    items: [],
    
    addItem: (item) =>
      set((state) => {
        state.items.push(item); // "Mutate" directly
      }),
    
    updateItem: (id, changes) =>
      set((state) => {
        const item = state.items.find((i) => i.id === id);
        if (item) {
          Object.assign(item, changes);
        }
      }),
  }))
);
```

### subscribeWithSelector

Enables subscribing to state slices:

```tsx
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const useStore = create<Store>()(
  subscribeWithSelector((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))
);

// Subscribe to specific slice
useStore.subscribe(
  (state) => state.count,
  (count, prevCount) => {
    console.log(`Count changed from ${prevCount} to ${count}`);
  },
  {
    equalityFn: Object.is, // Custom equality check
    fireImmediately: true, // Fire on subscribe
  }
);
```

### Combining Middleware

```tsx
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useStore = create<Store>()(
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // Your store
        })),
        { name: 'my-store' }
      )
    ),
    { name: 'MyStore' }
  )
);
```

---

## Common Patterns

### 1. Sliced Stores

Split a large store into slices:

```tsx
// slices/userSlice.ts
export interface UserSlice {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

export const createUserSlice: StateCreator<
  UserSlice & CartSlice, // Full store type
  [],
  [],
  UserSlice
> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
});

// slices/cartSlice.ts
export interface CartSlice {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  clearCart: () => void;
}

export const createCartSlice: StateCreator<
  UserSlice & CartSlice,
  [],
  [],
  CartSlice
> = (set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  clearCart: () => set({ items: [] }),
});

// store.ts
import { create } from 'zustand';
import { createUserSlice, UserSlice } from './slices/userSlice';
import { createCartSlice, CartSlice } from './slices/cartSlice';

type Store = UserSlice & CartSlice;

export const useStore = create<Store>()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
}));
```

### 2. Async Actions

```tsx
const useStore = create<Store>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await api.getUsers();
      set({ users, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // With optimistic updates
  addUser: async (user) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticUser = { ...user, id: tempId };
    
    // Optimistic add
    set((state) => ({ users: [...state.users, optimisticUser] }));
    
    try {
      const savedUser = await api.createUser(user);
      // Replace temp with real
      set((state) => ({
        users: state.users.map((u) =>
          u.id === tempId ? savedUser : u
        ),
      }));
    } catch (error) {
      // Rollback
      set((state) => ({
        users: state.users.filter((u) => u.id !== tempId),
        error: error.message,
      }));
    }
  },
}));
```

### 3. Computed Values

```tsx
const useStore = create<Store>((set, get) => ({
  items: [],
  
  // Method-based computed (called on demand)
  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price, 0);
  },
  
  getItemById: (id: string) => {
    return get().items.find((item) => item.id === id);
  },
}));

// In component - memoize if expensive
function CartTotal() {
  const items = useStore((state) => state.items);
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  );
  return <span>${total}</span>;
}
```

### 4. Reset Store

```tsx
const initialState = {
  count: 0,
  name: '',
};

const useStore = create<Store>((set) => ({
  ...initialState,
  
  increment: () => set((state) => ({ count: state.count + 1 })),
  setName: (name) => set({ name }),
  
  reset: () => set(initialState),
}));
```

### 5. Using Outside React

```tsx
// In a utility function
export function logCurrentCount() {
  const count = useStore.getState().count;
  console.log('Current count:', count);
}

// In an API interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Subscribe to changes
useStore.subscribe((state) => {
  localStorage.setItem('app-state', JSON.stringify(state));
});
```

---

## Pitfalls & Solutions

### 1. ❌ Inline Selectors Creating New References

```tsx
// ❌ BAD: Filter creates new array every render
function ExpensiveItems() {
  const expensiveItems = useStore((state) =>
    state.items.filter((item) => item.price > 100)
  );
  // Re-renders on EVERY state change!
}

// ✅ GOOD: Memoize in component
function ExpensiveItems() {
  const items = useStore((state) => state.items);
  const expensiveItems = useMemo(
    () => items.filter((item) => item.price > 100),
    [items]
  );
}

// ✅ ALSO GOOD: Define as store method
const useStore = create((set, get) => ({
  items: [],
  getExpensiveItems: () => get().items.filter((i) => i.price > 100),
}));
```

### 2. ❌ Selecting Objects/Arrays Without Shallow

```tsx
// ❌ BAD: New object reference every render
function UserInfo() {
  const { name, email } = useStore((state) => ({
    name: state.name,
    email: state.email,
  }));
  // Re-renders on ANY state change because {} !== {}
}

// ✅ GOOD: Use useShallow
import { useShallow } from 'zustand/react/shallow';

function UserInfo() {
  const { name, email } = useStore(
    useShallow((state) => ({
      name: state.name,
      email: state.email,
    }))
  );
}

// ✅ ALSO GOOD: Separate selectors
function UserInfo() {
  const name = useStore((state) => state.name);
  const email = useStore((state) => state.email);
}
```

### 3. ❌ Subscribing to Entire State

```tsx
// ❌ BAD: Re-renders on any state change
function Component() {
  const state = useStore();
  return <div>{state.count}</div>;
}

// ✅ GOOD: Subscribe only to what you need
function Component() {
  const count = useStore((state) => state.count);
  return <div>{count}</div>;
}
```

### 4. ❌ Mutating State Directly

```tsx
// ❌ BAD: Direct mutation doesn't trigger re-render
const useStore = create((set, get) => ({
  items: [],
  addItem: (item) => {
    get().items.push(item); // Mutates but doesn't update!
  },
}));

// ✅ GOOD: Use set() with new reference
const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),
}));

// ✅ ALSO GOOD: Use immer middleware
const useStore = create(immer((set) => ({
  items: [],
  addItem: (item) => set((state) => {
    state.items.push(item); // Safe with immer
  }),
})));
```

### 5. ❌ Stale Closure in Actions

```tsx
// ❌ BAD: Captures stale count at creation time
const useStore = create((set) => {
  let count = 0;
  return {
    count,
    increment: () => {
      count++; // This local variable, not state!
      set({ count });
    },
  };
});

// ✅ GOOD: Use set with updater function
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// ✅ GOOD: Use get() for current state
const useStore = create((set, get) => ({
  count: 0,
  incrementBy: (amount) => {
    const currentCount = get().count;
    set({ count: currentCount + amount });
  },
}));
```

### 6. ❌ Forgetting persist Hydration

```tsx
// ❌ BAD: Using state before hydration
function App() {
  const user = useStore((state) => state.user);
  // user might be null even if persisted, because hydration is async!
}

// ✅ GOOD: Wait for hydration
function App() {
  const hasHydrated = useStore((state) => state._hasHydrated);
  
  if (!hasHydrated) return <Loading />;
  
  return <MainApp />;
}

// Add hydration flag to store
const useStore = create(
  persist(
    (set) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'store',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
```

---

## Best Practices

### 1. Type Your Stores

```tsx
import { create } from 'zustand';

interface Store {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

### 2. Separate State from Actions in Selectors

```tsx
// Actions are stable - select once
const Component = () => {
  // This selector returns the same function reference
  const increment = useStore((state) => state.increment);
  
  // These will cause re-renders when values change
  const count = useStore((state) => state.count);
};
```

### 3. Create Custom Hooks for Common Selections

```tsx
// hooks/useCart.ts
export function useCartItems() {
  return useStore((state) => state.items);
}

export function useCartTotal() {
  const items = useStore((state) => state.items);
  return useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
}

export function useCartActions() {
  return useStore(
    useShallow((state) => ({
      addItem: state.addItem,
      removeItem: state.removeItem,
      clearCart: state.clearCart,
    }))
  );
}
```


---

## Setup

```tsx
// stores/useCounterStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterStore>()(
  devtools(
    persist(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
        decrement: () => set((state) => ({ count: state.count - 1 })),
        reset: () => set({ count: 0 }),
      }),
      { name: 'counter-store' }
    ),
    { name: 'CounterStore' }
  )
);
```

```bash
# Installation
npm install zustand

# Optional: Immer for mutations
npm install immer
```
