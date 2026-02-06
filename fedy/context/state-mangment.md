# State Management Approaches in React

> A comprehensive guide to choosing the right state management solution for your React application.

---

## Table of Contents

1. [Server State (TanStack Query)](#1-server-state-tanstack-query)
2. [Global Store: The Heavyweight (Redux Toolkit)](#2-global-store-the-heavyweight-redux-toolkit---rtk)
3. [Global Store: The Modern Standard (Zustand)](#3-global-store-the-modern-standard-zustand)
4. [Atomic State (Jotai / Recoil)](#4-atomic-state-jotai--recoil)
5. [React Context API](#5-react-context-api)
6. [Decision Matrix](#decision-matrix)

---

## 1. Server State (TanStack Query)

### Context

Used when fetching, caching, and syncing **asynchronous data** from APIs. Server state is fundamentally different from client state—it lives on the server, and your app only has a cached snapshot.

### Pros

- ✅ Automates caching, retries, polling, and "stale-while-revalidate" logic
- ✅ Eliminates `useEffect` fetching boilerplate
- ✅ Built-in loading, error, and success states
- ✅ Background refetching keeps data fresh
- ✅ Optimistic updates out of the box
- ✅ Automatic garbage collection of unused data

### Cons

- ❌ Adds bundle size (~12KB gzipped)
- ❌ Requires learning a specific API
- ❌ Overkill for simple, one-off fetches

### Agent Rule

> **"If the data comes from an API, do not put it in a global store, unless there is very limited on time fetch. Use TanStack Query."**

### Code Example

```tsx
// queries/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
}

// Fetch all users
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const response = await api.get('/users');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });
}

// Fetch single user
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async (): Promise<User> => {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId, // Only fetch if userId exists
  });
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newUser: Omit<User, 'id'>) => {
      const response = await api.post('/users', newUser);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

```tsx
// components/UsersList.tsx
import { useUsers, useCreateUser } from '@/queries/useUsers';

export function UsersList() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <button
        onClick={() => createUser.mutate({ name: 'John', email: 'john@example.com' })}
        disabled={createUser.isPending}
      >
        {createUser.isPending ? 'Adding...' : 'Add User'}
      </button>

      <ul>
        {users?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Real-World Example

Any data-driven application: E-commerce product listings, Social media feeds, Dashboard analytics.

---

## 2. Global Store: The Heavyweight (Redux Toolkit - RTK)

### Context

Enterprise-grade applications with **complex, transaction-like state changes** that require strict audit trails and predictable state mutations.

### Pros

- ✅ Excellent debugging (DevTools with time-travel)
- ✅ Strict, opinionated structure prevents chaos
- ✅ Massive ecosystem and community
- ✅ Great for complex state transitions
- ✅ Middleware support (thunks, sagas, etc.)
- ✅ Perfect for audit logging and undo/redo

### Cons

- ❌ High boilerplate (even with Toolkit)
- ❌ Steeper learning curve
- ❌ Rigid—may feel heavy for simple apps
- ❌ Larger bundle size
- ❌ **Selector performance pitfalls**: Non-memoized selectors recalculate on every render, causing performance issues. Requires `createSelector` (reselect) for derived data

### Selector Performance Warning

```tsx
// ❌ BAD: This selector creates a new array reference every time
const selectExpensiveItems = (state: RootState) =>
  state.cart.items.filter((item) => item.price > 100);

// Every component using this will re-render on ANY state change,
// even if cart.items hasn't changed!

// ✅ GOOD: Use createSelector for memoization
import { createSelector } from '@reduxjs/toolkit';

const selectCartItems = (state: RootState) => state.cart.items;

const selectExpensiveItems = createSelector(
  [selectCartItems],
  (items) => items.filter((item) => item.price > 100)
);
// Only recalculates when cart.items actually changes
```

### Code Example

```tsx
// store/slices/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isCheckingOut: boolean;
}

const initialState: CartState = {
  items: [],
  isCheckingOut: false,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<CartItem, 'quantity'>>) => {
      const existingItem = state.items.find((item) => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((item) => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
    setCheckingOut: (state, action: PayloadAction<boolean>) => {
      state.isCheckingOut = action.payload;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, setCheckingOut } = cartSlice.actions;

// Selectors
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTotal = (state: RootState) =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
export const selectCartItemCount = (state: RootState) =>
  state.cart.items.reduce((count, item) => count + item.quantity, 0);

export default cartSlice.reducer;
```

```tsx
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import cartReducer from './slices/cartSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: true,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

```tsx
// components/Cart.tsx
import { useAppDispatch, useAppSelector } from '@/store';
import { addItem, removeItem, selectCartItems, selectCartTotal } from '@/store/slices/cartSlice';

export function Cart() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);

  return (
    <div>
      <h2>Shopping Cart</h2>
      {items.map((item) => (
        <div key={item.id}>
          <span>{item.name} x {item.quantity}</span>
          <span>${(item.price * item.quantity).toFixed(2)}</span>
          <button onClick={() => dispatch(removeItem(item.id))}>Remove</button>
        </div>
      ))}
      <div>Total: ${total.toFixed(2)}</div>
    </div>
  );
}
```

### Real-World Example

**Discord**, **Banking Dashboards**—where strict audit trails of state changes are needed and complex state interactions occur.

---

## 3. Global Store: The Modern Standard (Zustand)

### Context

The **default choice for 90% of React apps in 2025**. Simple, performant, and gets out of your way.

### Pros

- ✅ Minimalist, hooks-based API
- ✅ No Context Provider wrapper needed (avoids re-render chains)
- ✅ Easy to set up (under 5 minutes)
- ✅ Works outside React components
- ✅ Tiny bundle size (~1KB gzipped)
- ✅ Built-in persistence, devtools, and middleware

### Cons

- ❌ Less opinionated (can lead to messy code if not structured well)
- ❌ No built-in time-travel debugging (though devtools exist)
- ❌ Requires discipline to maintain clean architecture
- ❌ **Selector performance pitfalls**: Same as RTK—inline selectors that return new references cause unnecessary re-renders

### Selector Performance Warning

```tsx
// ❌ BAD: Creates new array on every render, causing infinite re-render loops
function ExpensiveItems() {
  const expensiveItems = useCartStore((state) =>
    state.items.filter((item) => item.price > 100)
  );
  // Re-renders on EVERY state change, not just when filtered result changes!
}

// ✅ GOOD: Memoize outside the component or use a stable selector
import { useMemo } from 'react';

function ExpensiveItems() {
  const items = useCartStore((state) => state.items);
  const expensiveItems = useMemo(
    () => items.filter((item) => item.price > 100),
    [items]
  );
}

// ✅ BETTER: Define selector in the store
export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  // ... actions
  
  // Derived state as a getter
  getExpensiveItems: () => get().items.filter((item) => item.price > 100),
}));

// ✅ ALSO GOOD: Use useShallow for object/array selections
import { useShallow } from 'zustand/react/shallow';

function CartSummary() {
  const { items, total } = useCartStore(
    useShallow((state) => ({
      items: state.items,
      total: state.getTotal(),
    }))
  );
}
```

### Code Example

```tsx
// stores/useCartStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed (as getters)
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],

        addItem: (item) =>
          set((state) => {
            const existingItem = state.items.find((i) => i.id === item.id);
            if (existingItem) {
              return {
                items: state.items.map((i) =>
                  i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                ),
              };
            }
            return { items: [...state.items, { ...item, quantity: 1 }] };
          }),

        removeItem: (id) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          })),

        updateQuantity: (id, quantity) =>
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, quantity } : item
            ),
          })),

        clearCart: () => set({ items: [] }),

        getTotal: () => {
          const { items } = get();
          return items.reduce((total, item) => total + item.price * item.quantity, 0);
        },

        getItemCount: () => {
          const { items } = get();
          return items.reduce((count, item) => count + item.quantity, 0);
        },
      }),
      {
        name: 'cart-storage', // localStorage key
      }
    ),
    { name: 'CartStore' }
  )
);
```

```tsx
// components/Cart.tsx
import { useCartStore } from '@/stores/useCartStore';

export function Cart() {
  // Subscribe to specific slices to avoid unnecessary re-renders
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotal = useCartStore((state) => state.getTotal);

  return (
    <div>
      <h2>Shopping Cart</h2>
      {items.map((item) => (
        <div key={item.id}>
          <span>{item.name} x {item.quantity}</span>
          <span>${(item.price * item.quantity).toFixed(2)}</span>
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
      <div>Total: ${getTotal().toFixed(2)}</div>
    </div>
  );
}

// Can also be used outside React!
// useCartStore.getState().addItem({ id: '1', name: 'Widget', price: 9.99 });
```

```tsx
// Using selectors for optimized re-renders
import { useShallow } from 'zustand/react/shallow';

export function CartBadge() {
  // Only re-renders when item count changes
  const itemCount = useCartStore((state) => state.getItemCount());
  return <span className="badge">{itemCount}</span>;
}

// Multiple values with shallow comparison
export function CartSummary() {
  const { items, getTotal } = useCartStore(
    useShallow((state) => ({
      items: state.items,
      getTotal: state.getTotal,
    }))
  );
  
  return (
    <div>
      <p>{items.length} items</p>
      <p>Total: ${getTotal().toFixed(2)}</p>
    </div>
  );
}
```

### Real-World Example

**Shopify Hydrogen** components, **Startups** building fast iteration products, most modern React applications.

---

## 4. Atomic State (Jotai / Recoil)

### Context

Apps where state is **highly interdependent**, like a spreadsheet or a canvas editor. State is managed as small, independent "atoms" that can be composed together.

### Pros

- ✅ "Bottom-up" state management
- ✅ Changing one atom only re-renders the specific component subscribing to it
- ✅ No "top-down" render ripple
- ✅ Derived state (computed values) are first-class citizens
- ✅ Excellent for complex, interconnected state graphs
- ✅ Tiny bundle size

### Cons

- ❌ Harder to visualize the entire app state at once
- ❌ Can become hard to track with too many atoms
- ❌ Less tooling compared to Redux

### Code Example (Jotai)

```tsx
// atoms/spreadsheet.ts
import { atom } from 'jotai';

// Primitive atoms - the source of truth
export const cellsAtom = atom<Record<string, string>>({
  A1: '100',
  A2: '200',
  B1: '=A1+A2', // Formula
});

// Derived atom - automatically updates when dependencies change
export const cellValueAtom = (cellId: string) =>
  atom((get) => {
    const cells = get(cellsAtom);
    const rawValue = cells[cellId] || '';

    // If it's a formula, evaluate it
    if (rawValue.startsWith('=')) {
      return evaluateFormula(rawValue, cells);
    }
    return rawValue;
  });

// Write atom - for updating cells
export const updateCellAtom = atom(
  null, // no read value
  (get, set, update: { cellId: string; value: string }) => {
    const cells = get(cellsAtom);
    set(cellsAtom, { ...cells, [update.cellId]: update.value });
  }
);

// Selected cell tracking
export const selectedCellAtom = atom<string | null>(null);

// Derived atom for selected cell's value
export const selectedCellValueAtom = atom((get) => {
  const selectedCell = get(selectedCellAtom);
  if (!selectedCell) return null;
  
  const cells = get(cellsAtom);
  return cells[selectedCell];
});

function evaluateFormula(formula: string, cells: Record<string, string>): string {
  // Simple formula evaluation (A1+A2)
  const expression = formula
    .slice(1)
    .replace(/([A-Z]\d+)/g, (match) => cells[match] || '0');
  try {
    return String(eval(expression));
  } catch {
    return '#ERROR';
  }
}
```

```tsx
// components/Cell.tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { cellValueAtom, updateCellAtom, selectedCellAtom } from '@/atoms/spreadsheet';

interface CellProps {
  cellId: string;
}

export function Cell({ cellId }: CellProps) {
  // Only re-renders when THIS cell's computed value changes
  const displayValue = useAtomValue(cellValueAtom(cellId));
  const updateCell = useSetAtom(updateCellAtom);
  const [selectedCell, setSelectedCell] = useAtom(selectedCellAtom);

  const isSelected = selectedCell === cellId;

  return (
    <input
      className={isSelected ? 'cell selected' : 'cell'}
      value={displayValue}
      onFocus={() => setSelectedCell(cellId)}
      onChange={(e) => updateCell({ cellId, value: e.target.value })}
    />
  );
}
```

```tsx
// components/Spreadsheet.tsx
import { Cell } from './Cell';

const COLUMNS = ['A', 'B', 'C', 'D'];
const ROWS = [1, 2, 3, 4, 5];

export function Spreadsheet() {
  return (
    <div className="spreadsheet">
      {ROWS.map((row) => (
        <div key={row} className="row">
          {COLUMNS.map((col) => (
            <Cell key={`${col}${row}`} cellId={`${col}${row}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

```tsx
// atoms/canvasEditor.ts - Another Jotai example for a design tool
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

interface Shape {
  id: string;
  type: 'rect' | 'circle' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

// Atom family - creates individual atoms for each shape
export const shapeAtom = atomFamily((id: string) =>
  atom<Shape | null>(null)
);

// Track all shape IDs
export const shapeIdsAtom = atom<string[]>([]);

// Selected shapes
export const selectedShapeIdsAtom = atom<Set<string>>(new Set());

// Derived: Get all selected shapes
export const selectedShapesAtom = atom((get) => {
  const selectedIds = get(selectedShapeIdsAtom);
  return Array.from(selectedIds)
    .map((id) => get(shapeAtom(id)))
    .filter(Boolean) as Shape[];
});

// Derived: Bounding box of selection
export const selectionBoundsAtom = atom((get) => {
  const shapes = get(selectedShapesAtom);
  if (shapes.length === 0) return null;

  return {
    minX: Math.min(...shapes.map((s) => s.x)),
    minY: Math.min(...shapes.map((s) => s.y)),
    maxX: Math.max(...shapes.map((s) => s.x + s.width)),
    maxY: Math.max(...shapes.map((s) => s.y + s.height)),
  };
});
```

### Real-World Example

**Figma-like editors**, **Excel-like grids**, **Node-based editors** (like React Flow), complex forms with interdependent validations.

---

## 5. React Context API

### Context

**Dependency Injection** for values that rarely change. Think of it as "React's built-in way to avoid prop drilling."

### Pros

- ✅ Built-in, no dependencies
- ✅ Perfect for static or semi-static values
- ✅ Great for theming, localization, and auth
- ✅ Simple mental model

### Cons

- ❌ **Performance pitfalls**: If the Context value changes, ALL consumers re-render
- ❌ Bad for high-frequency data updates
- ❌ No built-in selectors (entire context or nothing)
- ❌ Provider wrapper hell with multiple contexts

### Agent Rule

> **"Use Context only for state that rarely changes (Theme, Localization, User Auth Object). Do not use for data feeds."**

### Code Example

```tsx
// contexts/ThemeContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');

  // Memoize to prevent unnecessary re-renders
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  const resolvedTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  // Memoize context value to prevent re-renders when parent re-renders
  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

```tsx
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) {
      const userData = await response.json();
      setUser(userData);
    } else {
      throw new Error('Login failed');
    }
  }

  function logout() {
    setUser(null);
    fetch('/api/auth/logout', { method: 'POST' });
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

```tsx
// components/ProtectedRoute.tsx
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

```tsx
// App.tsx - Provider composition
export function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LocalizationProvider>
          <RouterProvider router={router} />
        </LocalizationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

### Real-World Example

**Theme switching**, **i18n/Localization**, **Authentication state**, **Feature flags**.

---

## Decision Matrix

| Criteria | TanStack Query | Redux Toolkit | Zustand | Jotai | Context API |
|----------|----------------|---------------|---------|-------|-------------|
| **Best For** | Server/API data | Enterprise apps | General client state | Interdependent state | Dependency injection |
| **Bundle Size** | ~12KB | ~15KB+ | ~1KB | ~3KB | 0KB (built-in) |
| **Learning Curve** | Medium | High | Low | Medium | Low |
| **Boilerplate** | Low | Medium-High | Very Low | Low | Low |
| **DevTools** | ✅ Excellent | ✅ Excellent | ✅ Good | ⚠️ Basic | ❌ None |
| **Re-render Control** | Automatic | Manual (selectors) | Manual (selectors) | Automatic (atomic) | ❌ Poor |
| **Outside React** | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Limited | ❌ No |

---

## Summary: When to Use What

```
┌─────────────────────────────────────────────────────────────────┐
│                     STATE MANAGEMENT DECISION TREE              │
└─────────────────────────────────────────────────────────────────┘

Is the data from an API/Server?
├── YES → Use TanStack Query
│
└── NO → Is it rarely-changing app config? (theme, auth, i18n)
    ├── YES → Use React Context
    │
    └── NO → Is the state highly interdependent? (spreadsheet, canvas)
        ├── YES → Use Jotai/Recoil
        │
        └── NO → Do you need strict audit trails? (banking, enterprise)
            ├── YES → Use Redux Toolkit
            │
            └── NO → Use Zustand (default choice)
```

---

## Agent Rules Summary

1. **Server Data**: Always use TanStack Query for API data. Never manually cache in Redux/Zustand.

2. **Context Boundaries**: Use React Context only for low-frequency updates (theme, auth, i18n).

3. **Default Choice**: When in doubt, use Zustand for client state.

4. **Atomic State**: For spreadsheet/canvas-like apps with interdependent cells, prefer Jotai.

5. **Enterprise Scale**: Only reach for Redux when you need strict audit trails or complex middleware chains.
