# Jotai - Complete Guide

> Primitive and flexible state management for React. Atomic state at its finest.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Core Concepts](#core-concepts)
3. [API Reference](#api-reference)
4. [Atom Types](#atom-types)
5. [Common Patterns](#common-patterns)
6. [Pitfalls & Solutions](#pitfalls--solutions)
7. [Best Practices](#best-practices)

---

## How It Works

Jotai takes a **bottom-up** approach to state management. Instead of one big store, you create small pieces of state called **atoms** that can be composed together.

### The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        JOTAI MODEL                              │
│                                                                 │
│   Traditional (Top-Down)           Jotai (Bottom-Up)           │
│   ┌─────────────────┐              ┌─────┐ ┌─────┐ ┌─────┐    │
│   │     STORE       │              │ A1  │ │ A2  │ │ A3  │    │
│   │  { all state }  │              └──┬──┘ └──┬──┘ └──┬──┘    │
│   └────────┬────────┘                 │       │       │        │
│            │                          │   ┌───┴───┐   │        │
│     ┌──────┼──────┐                   │   │  D1   │   │        │
│     ▼      ▼      ▼                   │   │derived│   │        │
│   ┌───┐  ┌───┐  ┌───┐                 │   └───┬───┘   │        │
│   │ A │  │ B │  │ C │                 │       │       │        │
│   └───┘  └───┘  └───┘                 ▼       ▼       ▼        │
│                                     ┌───┐   ┌───┐   ┌───┐      │
│   All components re-render          │ A │   │ B │   │ C │      │
│   on any store change               └───┘   └───┘   └───┘      │
│                                                                 │
│                                     Only subscribed components  │
│                                     re-render                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Benefits

| Feature | Jotai |
|---------|-------|
| Re-render Scope | Only components using the changed atom |
| Derived State | First-class (derived atoms) |
| Async Support | Built-in (async atoms) |
| Code Splitting | Natural (atoms are independent) |
| Bundle Size | ~3KB gzipped |
| TypeScript | Excellent inference |

---

## Core Concepts

### 1. Primitive Atoms

The simplest building block - a piece of state:

```tsx
import { atom } from 'jotai';

// Primitive atom (read-write)
const countAtom = atom(0);
const nameAtom = atom('John');
const isOpenAtom = atom(false);
const itemsAtom = atom<string[]>([]);
```

### 2. Using Atoms in Components

```tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { countAtom } from './atoms';

function Counter() {
  // Read and write
  const [count, setCount] = useAtom(countAtom);
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}

function DisplayCount() {
  // Read only (more optimized)
  const count = useAtomValue(countAtom);
  return <span>{count}</span>;
}

function IncrementButton() {
  // Write only (no re-render on value change)
  const setCount = useSetAtom(countAtom);
  return <button onClick={() => setCount((c) => c + 1)}>+</button>;
}
```

### 3. Derived Atoms (Read-only)

Atoms that compute values from other atoms:

```tsx
const priceAtom = atom(100);
const quantityAtom = atom(2);
const taxRateAtom = atom(0.1);

// Derived atom - automatically updates when dependencies change
const totalAtom = atom((get) => {
  const price = get(priceAtom);
  const quantity = get(quantityAtom);
  const tax = get(taxRateAtom);
  return price * quantity * (1 + tax);
});

// Usage
function Total() {
  const total = useAtomValue(totalAtom);
  return <span>${total.toFixed(2)}</span>;
}
```

### 4. Writable Derived Atoms

Atoms with custom read and write logic:

```tsx
const celsiusAtom = atom(0);

// Read as Fahrenheit, write in Fahrenheit
const fahrenheitAtom = atom(
  // Read: convert from Celsius
  (get) => get(celsiusAtom) * (9 / 5) + 32,
  // Write: convert to Celsius
  (get, set, fahrenheit: number) => {
    set(celsiusAtom, (fahrenheit - 32) * (5 / 9));
  }
);

// Usage
function Temperature() {
  const [fahrenheit, setFahrenheit] = useAtom(fahrenheitAtom);
  return (
    <input
      type="number"
      value={fahrenheit}
      onChange={(e) => setFahrenheit(Number(e.target.value))}
    />
  );
}
```

---

## API Reference

### atom()

Creates an atom:

```tsx
import { atom } from 'jotai';

// Primitive atom
const primitiveAtom = atom(initialValue);

// Read-only derived atom
const derivedAtom = atom((get) => {
  return get(someAtom) * 2;
});

// Read-write derived atom
const readWriteAtom = atom(
  (get) => get(someAtom),
  (get, set, newValue) => {
    set(someAtom, newValue);
  }
);

// Write-only atom
const writeOnlyAtom = atom(
  null, // no read
  (get, set, arg) => {
    set(someAtom, arg);
  }
);
```

### useAtom()

Subscribe to an atom (read + write):

```tsx
import { useAtom } from 'jotai';

function Component() {
  const [value, setValue] = useAtom(myAtom);
  
  // setValue can take a value or updater function
  setValue(10);
  setValue((prev) => prev + 1);
}
```

### useAtomValue()

Read-only subscription (more optimized when you don't need to write):

```tsx
import { useAtomValue } from 'jotai';

function Display() {
  const value = useAtomValue(myAtom);
  return <span>{value}</span>;
}
```

### useSetAtom()

Write-only (no re-render on value changes):

```tsx
import { useSetAtom } from 'jotai';

function Button() {
  const setValue = useSetAtom(myAtom);
  // This component won't re-render when myAtom changes
  return <button onClick={() => setValue((v) => v + 1)}>+</button>;
}
```

### Provider

Optional - creates an isolated atom store:

```tsx
import { Provider } from 'jotai';

// Each Provider has its own isolated state
function App() {
  return (
    <Provider>
      <MainApp />
    </Provider>
  );
}

// Multiple providers for isolation
function Isolated() {
  return (
    <Provider>
      <Widget1 /> {/* Has its own atom values */}
    </Provider>
  );
}
```

### createStore()

Create a store for use outside React:

```tsx
import { createStore } from 'jotai';
import { countAtom } from './atoms';

const store = createStore();

// Get value
store.get(countAtom);

// Set value
store.set(countAtom, 10);

// Subscribe
const unsub = store.sub(countAtom, () => {
  console.log('Count changed:', store.get(countAtom));
});

// Use with Provider
<Provider store={store}>
  <App />
</Provider>
```

---

## Atom Types

### Async Atoms

Atoms that return promises:

```tsx
const userIdAtom = atom(1);

// Async read
const userAtom = atom(async (get) => {
  const id = get(userIdAtom);
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

// Usage with Suspense
function User() {
  const user = useAtomValue(userAtom);
  return <div>{user.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <User />
    </Suspense>
  );
}
```

### Async Write

```tsx
const saveUserAtom = atom(
  null,
  async (get, set, userData: UserData) => {
    set(loadingAtom, true);
    try {
      const saved = await api.saveUser(userData);
      set(userAtom, saved);
    } finally {
      set(loadingAtom, false);
    }
  }
);

// Usage
const saveUser = useSetAtom(saveUserAtom);
saveUser({ name: 'John' });
```

### atomFamily

Create atoms with parameters:

```tsx
import { atomFamily } from 'jotai/utils';

// Creates a unique atom for each id
const userAtomFamily = atomFamily((userId: string) =>
  atom(async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  })
);

// Usage
function UserCard({ userId }: { userId: string }) {
  const user = useAtomValue(userAtomFamily(userId));
  return <div>{user.name}</div>;
}
```

### atomWithStorage

Persist to localStorage/sessionStorage:

```tsx
import { atomWithStorage } from 'jotai/utils';

const themeAtom = atomWithStorage('theme', 'light');
const tokenAtom = atomWithStorage('auth-token', null, sessionStorage);

// Usage - automatically persists
function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme}
    </button>
  );
}
```

### atomWithReducer

Redux-like reducer pattern:

```tsx
import { atomWithReducer } from 'jotai/utils';

type Action = 
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'set'; value: number };

const countReducer = (state: number, action: Action): number => {
  switch (action.type) {
    case 'increment': return state + 1;
    case 'decrement': return state - 1;
    case 'set': return action.value;
  }
};

const countAtom = atomWithReducer(0, countReducer);

// Usage
function Counter() {
  const [count, dispatch] = useAtom(countAtom);
  return (
    <>
      <span>{count}</span>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
    </>
  );
}
```

### atomWithReset

Atoms that can be reset to initial value:

```tsx
import { atomWithReset, useResetAtom, RESET } from 'jotai/utils';

const countAtom = atomWithReset(0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const reset = useResetAtom(countAtom);
  
  return (
    <>
      <span>{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <button onClick={reset}>Reset</button>
      {/* Or: */}
      <button onClick={() => setCount(RESET)}>Reset</button>
    </>
  );
}
```

### selectAtom

Subscribe to a slice of an atom:

```tsx
import { selectAtom } from 'jotai/utils';

const userAtom = atom({ name: 'John', email: 'john@example.com', age: 30 });

// Only re-renders when name changes
const nameAtom = selectAtom(userAtom, (user) => user.name);

// With equality function
const nameAtom = selectAtom(
  userAtom,
  (user) => user.name,
  (a, b) => a === b
);

// Usage
function UserName() {
  const name = useAtomValue(nameAtom);
  return <span>{name}</span>;
}
```

### focusAtom

Create a "lens" into nested state:

```tsx
import { focusAtom } from 'jotai-optics';

const userAtom = atom({
  profile: {
    name: 'John',
    address: {
      city: 'NYC',
    },
  },
});

// Focus on nested property
const cityAtom = focusAtom(userAtom, (optic) =>
  optic.prop('profile').prop('address').prop('city')
);

// Usage - updates sync back to parent
function City() {
  const [city, setCity] = useAtom(cityAtom);
  return <input value={city} onChange={(e) => setCity(e.target.value)} />;
}
```

---

## Common Patterns

### 1. Spreadsheet/Grid

```tsx
// atoms/spreadsheet.ts
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

// Each cell is its own atom
const cellAtomFamily = atomFamily((cellId: string) =>
  atom('')
);

// All cell IDs
const cellIdsAtom = atom<string[]>(['A1', 'A2', 'B1', 'B2']);

// Derived: Cell with formula evaluation
const evaluatedCellAtomFamily = atomFamily((cellId: string) =>
  atom((get) => {
    const rawValue = get(cellAtomFamily(cellId));
    
    if (rawValue.startsWith('=')) {
      return evaluateFormula(rawValue, get, cellAtomFamily);
    }
    return rawValue;
  })
);

function Cell({ id }: { id: string }) {
  const [value, setValue] = useAtom(cellAtomFamily(id));
  const evaluated = useAtomValue(evaluatedCellAtomFamily(id));
  const [editing, setEditing] = useState(false);

  return editing ? (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => setEditing(false)}
    />
  ) : (
    <div onClick={() => setEditing(true)}>{evaluated}</div>
  );
}
```

### 2. Todo List

```tsx
// atoms/todos.ts
import { atom } from 'jotai';
import { atomFamily, atomWithStorage } from 'jotai/utils';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

// All todo IDs
const todoIdsAtom = atomWithStorage<string[]>('todo-ids', []);

// Individual todo atoms
const todoAtomFamily = atomFamily((id: string) =>
  atomWithStorage<Todo>(`todo-${id}`, {
    id,
    text: '',
    completed: false,
  })
);

// Filter state
const filterAtom = atom<'all' | 'active' | 'completed'>('all');

// Filtered todo IDs
const filteredTodoIdsAtom = atom((get) => {
  const ids = get(todoIdsAtom);
  const filter = get(filterAtom);
  
  return ids.filter((id) => {
    const todo = get(todoAtomFamily(id));
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });
});

// Stats
const statsAtom = atom((get) => {
  const ids = get(todoIdsAtom);
  const todos = ids.map((id) => get(todoAtomFamily(id)));
  return {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    active: todos.filter((t) => !t.completed).length,
  };
});

// Actions
const addTodoAtom = atom(null, (get, set, text: string) => {
  const id = crypto.randomUUID();
  set(todoIdsAtom, [...get(todoIdsAtom), id]);
  set(todoAtomFamily(id), { id, text, completed: false });
});

const toggleTodoAtom = atom(null, (get, set, id: string) => {
  const todo = get(todoAtomFamily(id));
  set(todoAtomFamily(id), { ...todo, completed: !todo.completed });
});
```

### 3. Form State

```tsx
// atoms/form.ts
import { atom } from 'jotai';
import { atomWithValidate } from 'jotai-form';

// Field atoms
const nameAtom = atom('');
const emailAtom = atom('');
const ageAtom = atom('');

// Validation
const emailValidAtom = atom((get) => {
  const email = get(emailAtom);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
});

const formValidAtom = atom((get) => {
  const name = get(nameAtom);
  const emailValid = get(emailValidAtom);
  const age = get(ageAtom);
  
  return name.length > 0 && emailValid && Number(age) > 0;
});

// Form data
const formDataAtom = atom((get) => ({
  name: get(nameAtom),
  email: get(emailAtom),
  age: Number(get(ageAtom)),
}));

// Submit action
const submitAtom = atom(null, async (get, set) => {
  const isValid = get(formValidAtom);
  if (!isValid) return;
  
  const data = get(formDataAtom);
  await api.submit(data);
  
  // Reset
  set(nameAtom, '');
  set(emailAtom, '');
  set(ageAtom, '');
});
```

### 4. Theme with System Preference

```tsx
// atoms/theme.ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

type Theme = 'light' | 'dark' | 'system';

const themePreferenceAtom = atomWithStorage<Theme>('theme', 'system');

const systemThemeAtom = atom<'light' | 'dark'>('light');

// Initialize system theme listener
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  // Set initial and listen for changes in component
}

const resolvedThemeAtom = atom((get) => {
  const preference = get(themePreferenceAtom);
  if (preference !== 'system') return preference;
  return get(systemThemeAtom);
});

// Usage
function ThemeProvider({ children }) {
  const theme = useAtomValue(resolvedThemeAtom);
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  return <>{children}</>;
}
```

---

## Pitfalls & Solutions

### 1. ❌ Creating Atoms Inside Components

```tsx
// ❌ BAD: Creates new atom every render!
function Counter() {
  const countAtom = atom(0); // New atom each render
  const [count, setCount] = useAtom(countAtom);
  return <span>{count}</span>;
}

// ✅ GOOD: Define atoms outside components
const countAtom = atom(0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return <span>{count}</span>;
}

// ✅ ALSO GOOD: Use useMemo if truly dynamic
function DynamicCounter({ initialValue }) {
  const countAtom = useMemo(() => atom(initialValue), [initialValue]);
  const [count, setCount] = useAtom(countAtom);
  return <span>{count}</span>;
}
```

### 2. ❌ Forgetting Suspense for Async Atoms

```tsx
// ❌ BAD: No Suspense boundary - will crash
function App() {
  return <UserProfile />; // Uses async atom
}

// ✅ GOOD: Wrap with Suspense
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile />
    </Suspense>
  );
}

// ✅ ALSO GOOD: Use loadable utility
import { loadable } from 'jotai/utils';

const loadableUserAtom = loadable(userAtom);

function UserProfile() {
  const userLoadable = useAtomValue(loadableUserAtom);
  
  if (userLoadable.state === 'loading') return <Loading />;
  if (userLoadable.state === 'hasError') return <Error />;
  return <div>{userLoadable.data.name}</div>;
}
```

### 3. ❌ Over-Deriving (Too Many Derived Atoms)

```tsx
// ❌ BAD: Chain of derived atoms for simple transforms
const firstNameAtom = atom((get) => get(userAtom).firstName);
const upperFirstNameAtom = atom((get) => get(firstNameAtom).toUpperCase());
const formattedFirstNameAtom = atom((get) => `Mr. ${get(upperFirstNameAtom)}`);

// ✅ GOOD: Single derived atom
const formattedFirstNameAtom = atom((get) => {
  const { firstName } = get(userAtom);
  return `Mr. ${firstName.toUpperCase()}`;
});
```

### 4. ❌ Not Using useSetAtom for Actions

```tsx
// ❌ BAD: useAtom causes re-renders on state change
function IncrementButton() {
  const [count, setCount] = useAtom(countAtom);
  // Re-renders every time count changes, even though we don't display it!
  return <button onClick={() => setCount((c) => c + 1)}>+</button>;
}

// ✅ GOOD: useSetAtom for write-only
function IncrementButton() {
  const setCount = useSetAtom(countAtom);
  // No re-renders on count change
  return <button onClick={() => setCount((c) => c + 1)}>+</button>;
}
```

### 5. ❌ Circular Dependencies

```tsx
// ❌ BAD: Circular dependency - will infinite loop!
const aAtom = atom((get) => get(bAtom) + 1);
const bAtom = atom((get) => get(aAtom) + 1);

// ✅ GOOD: Unidirectional dependencies
const baseAtom = atom(0);
const derivedAAtom = atom((get) => get(baseAtom) + 1);
const derivedBAtom = atom((get) => get(baseAtom) * 2);
```

### 6. ❌ Large Objects in Single Atom

```tsx
// ❌ BAD: Any change re-renders all subscribers
const storeAtom = atom({
  users: [],
  products: [],
  orders: [],
  settings: {},
});

// ✅ GOOD: Separate atoms
const usersAtom = atom([]);
const productsAtom = atom([]);
const ordersAtom = atom([]);
const settingsAtom = atom({});
```

### 7. ❌ Forgetting atomFamily Returns Same Atom for Same Param

```tsx
// atomFamily caches atoms by parameter
const userAtomFamily = atomFamily((id: string) => atom({ id, name: '' }));

// These return the SAME atom:
const userAtom1 = userAtomFamily('123');
const userAtom2 = userAtomFamily('123');
userAtom1 === userAtom2; // true!

// ⚠️ If you need isolated instances, add unique suffix:
const uniqueUserAtom = userAtomFamily(`${id}-${Date.now()}`);
```

---

## Best Practices

### 1. Organize Atoms by Feature

```
src/
├── atoms/
│   ├── auth.ts       # Auth-related atoms
│   ├── cart.ts       # Cart atoms
│   ├── ui.ts         # UI state atoms
│   └── index.ts      # Re-exports
├── components/
└── App.tsx
```

### 2. Use Descriptive Atom Names

```tsx
// ❌ BAD
const a = atom(0);
const b = atom('');

// ✅ GOOD
const itemCountAtom = atom(0);
const searchQueryAtom = atom('');
```

### 3. Prefer useAtomValue/useSetAtom

```tsx
// When you only read:
const count = useAtomValue(countAtom);

// When you only write:
const setCount = useSetAtom(countAtom);

// Only use useAtom when you need both:
const [count, setCount] = useAtom(countAtom);
```

### 4. Use atomFamily for Dynamic Data

```tsx
// For collections with dynamic IDs
const todoAtomFamily = atomFamily((id: string) =>
  atom<Todo>({ id, text: '', completed: false })
);

// Keep track of IDs separately
const todoIdsAtom = atom<string[]>([]);
```

### 5. Debug with DevTools

```tsx
import { DevTools } from 'jotai-devtools';

function App() {
  return (
    <>
      <MainApp />
      <DevTools />
    </>
  );
}
```

---

## Setup

```tsx
// No setup required! Just create atoms and use them.
// Provider is optional for isolation.

// atoms/counter.ts
import { atom } from 'jotai';
export const countAtom = atom(0);

// components/Counter.tsx
import { useAtom } from 'jotai';
import { countAtom } from '../atoms/counter';

export function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      Count: {count}
    </button>
  );
}
```

```bash
# Installation
npm install jotai

# Optional utilities
npm install jotai-devtools    # DevTools
npm install jotai-optics      # Lens/focus utilities
```
