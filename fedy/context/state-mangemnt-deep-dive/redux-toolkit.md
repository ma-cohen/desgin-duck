# Redux Toolkit (RTK) - Complete Guide

> Enterprise-grade state management with strict structure and time-travel debugging.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Core Concepts](#core-concepts)
3. [API Reference](#api-reference)
4. [Common Patterns](#common-patterns)
5. [Pitfalls & Solutions](#pitfalls--solutions)
6. [Best Practices](#best-practices)

---

## How It Works

Redux follows a **unidirectional data flow**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         REDUX FLOW                              │
│                                                                 │
│   ┌─────────┐    dispatch    ┌──────────┐    new state         │
│   │  View   │ ─────────────► │ Reducer  │ ──────────────┐      │
│   │  (UI)   │                │ (pure fn)│               │      │
│   └────▲────┘                └──────────┘               │      │
│        │                                                │      │
│        │              ┌─────────────────────┐           │      │
│        └──────────────│       Store         │◄──────────┘      │
│         subscribe     │  { state: ... }     │                  │
│                       └─────────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The Three Principles

1. **Single Source of Truth**: The entire app state lives in one store
2. **State is Read-Only**: The only way to change state is to dispatch an action
3. **Changes via Pure Functions**: Reducers are pure functions that take (state, action) and return new state

### Redux Toolkit vs Legacy Redux

Redux Toolkit (RTK) is the modern, recommended way to write Redux:

| Legacy Redux | Redux Toolkit |
|--------------|---------------|
| Manual action creators | Auto-generated from slices |
| Switch statements in reducers | Object syntax with Immer |
| Manual immutable updates | "Mutating" syntax (Immer handles immutability) |
| Separate files for actions/reducers | Co-located in slices |
| configureStore manual setup | Batteries-included store setup |

---

## Core Concepts

### 1. Store

The single object holding your entire application state:

```tsx
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
  },
});

// Infer types from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 2. Slices

A slice is a collection of reducer logic and actions for a single feature:

```tsx
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1; // Immer allows "mutation"
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    reset: () => initialState,
  },
});

// Auto-generated action creators
export const { increment, decrement, incrementByAmount, reset } = counterSlice.actions;

// The reducer
export default counterSlice.reducer;
```

### 3. Actions

Objects describing "what happened". RTK generates these automatically:

```tsx
// Generated action creator
increment()
// Returns: { type: 'counter/increment' }

incrementByAmount(5)
// Returns: { type: 'counter/incrementByAmount', payload: 5 }
```

### 4. Dispatch

The function to send actions to the store:

```tsx
import { useDispatch } from 'react-redux';
import { increment } from './counterSlice';

function Counter() {
  const dispatch = useDispatch();
  
  return (
    <button onClick={() => dispatch(increment())}>
      Increment
    </button>
  );
}
```

### 5. Selectors

Functions that extract specific pieces of state:

```tsx
// Basic selector
export const selectCount = (state: RootState) => state.counter.value;

// Usage
const count = useSelector(selectCount);
```

---

## API Reference

### configureStore

Sets up the Redux store with good defaults:

```tsx
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // Add your slices here
    counter: counterReducer,
    user: userReducer,
  },
  
  // Middleware (thunk included by default)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: true,  // Warns on non-serializable values
      immutableCheck: true,     // Warns on state mutations
      thunk: true,              // Enables async actions
    }).concat(logger),
  
  // Enable Redux DevTools
  devTools: process.env.NODE_ENV !== 'production',
  
  // Preloaded state (for SSR/hydration)
  preloadedState: undefined,
  
  // Store enhancers
  enhancers: (getDefaultEnhancers) => getDefaultEnhancers(),
});
```

### createSlice

Creates a slice with reducers and actions:

```tsx
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: { name: '', email: '', isLoggedIn: false },
  
  reducers: {
    // Standard reducer
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    
    // Prepare callback for action payload transformation
    setUser: {
      reducer: (state, action: PayloadAction<{ name: string; email: string }>) => {
        state.name = action.payload.name;
        state.email = action.payload.email;
      },
      prepare: (name: string, email: string) => ({
        payload: { name, email },
      }),
    },
    
    logout: (state) => {
      state.name = '';
      state.email = '';
      state.isLoggedIn = false;
    },
  },
  
  // Handle actions from other slices or async thunks
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.name = action.payload.name;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});
```

### createAsyncThunk

Creates async actions with automatic pending/fulfilled/rejected states:

```tsx
import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (userId: string, { rejectWithValue, getState, dispatch }) => {
    try {
      const response = await api.fetchUser(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
  {
    // Optional: Prevent duplicate requests
    condition: (userId, { getState }) => {
      const { user } = getState() as RootState;
      if (user.status === 'loading') {
        return false; // Cancel if already loading
      }
    },
  }
);

// Usage in component
dispatch(fetchUser('123'));

// Handle in slice's extraReducers
extraReducers: (builder) => {
  builder
    .addCase(fetchUser.pending, (state) => {
      state.status = 'loading';
    })
    .addCase(fetchUser.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.data = action.payload;
    })
    .addCase(fetchUser.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload ?? action.error.message;
    });
},
```

### createSelector (Reselect)

Creates memoized selectors for derived data:

```tsx
import { createSelector } from '@reduxjs/toolkit';

const selectItems = (state: RootState) => state.cart.items;
const selectTaxRate = (state: RootState) => state.config.taxRate;

// Memoized selector - only recalculates when inputs change
export const selectCartTotal = createSelector(
  [selectItems, selectTaxRate],
  (items, taxRate) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return subtotal * (1 + taxRate);
  }
);

// Parameterized selector
export const makeSelectItemById = () =>
  createSelector(
    [selectItems, (_, itemId: string) => itemId],
    (items, itemId) => items.find((item) => item.id === itemId)
  );
```

### createEntityAdapter

Normalized state management for collections:

```tsx
import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
}

const usersAdapter = createEntityAdapter<User>({
  selectId: (user) => user.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

const usersSlice = createSlice({
  name: 'users',
  initialState: usersAdapter.getInitialState({
    loading: false,
  }),
  reducers: {
    addUser: usersAdapter.addOne,
    addUsers: usersAdapter.addMany,
    updateUser: usersAdapter.updateOne,
    removeUser: usersAdapter.removeOne,
    setAllUsers: usersAdapter.setAll,
  },
});

// Generated selectors
export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
  selectEntities: selectUserEntities,
  selectTotal: selectTotalUsers,
} = usersAdapter.getSelectors((state: RootState) => state.users);
```

### Typed Hooks

Create typed versions of useSelector and useDispatch:

```tsx
// store/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## Common Patterns

### 1. Feature-Based Folder Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── authSlice.ts
│   │   ├── authSelectors.ts
│   │   ├── authThunks.ts
│   │   └── AuthForm.tsx
│   ├── cart/
│   │   ├── cartSlice.ts
│   │   ├── cartSelectors.ts
│   │   └── Cart.tsx
│   └── users/
│       ├── usersSlice.ts
│       └── UserList.tsx
├── store/
│   ├── store.ts
│   └── hooks.ts
└── App.tsx
```

### 2. Handling Loading States

```tsx
interface AsyncState<T> {
  data: T | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AsyncState<User[]> = {
  data: null,
  status: 'idle',
  error: null,
};

// In component
const { data, status, error } = useAppSelector((state) => state.users);

if (status === 'loading') return <Spinner />;
if (status === 'failed') return <Error message={error} />;
if (!data) return null;

return <UserList users={data} />;
```

### 3. Optimistic Updates

```tsx
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Optimistic add
    optimisticAddItem: (state, action: PayloadAction<CartItem>) => {
      state.items.push({ ...action.payload, pending: true });
    },
    // Confirm after API success
    confirmAddItem: (state, action: PayloadAction<string>) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) item.pending = false;
    },
    // Rollback on error
    rollbackAddItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
  },
});

// Thunk combining optimistic update with API call
export const addItemToCart = createAsyncThunk(
  'cart/addItem',
  async (item: CartItem, { dispatch, rejectWithValue }) => {
    dispatch(optimisticAddItem(item));
    try {
      await api.addToCart(item);
      dispatch(confirmAddItem(item.id));
    } catch (error) {
      dispatch(rollbackAddItem(item.id));
      return rejectWithValue(error.message);
    }
  }
);
```

### 4. Cross-Slice Communication

```tsx
// authSlice.ts
export const logout = createAction('auth/logout');

// cartSlice.ts
extraReducers: (builder) => {
  builder.addCase(logout, (state) => {
    // Clear cart when user logs out
    return initialState;
  });
},

// userSlice.ts
extraReducers: (builder) => {
  builder.addCase(logout, (state) => {
    // Clear user data when logging out
    return initialState;
  });
},
```

---

## Pitfalls & Solutions

### 1. ❌ Non-Memoized Selectors Creating New References

```tsx
// ❌ BAD: Creates new array every time, causes unnecessary re-renders
const selectActiveUsers = (state: RootState) =>
  state.users.filter((user) => user.isActive);

// Every component using this re-renders on ANY state change!

// ✅ GOOD: Memoized selector
import { createSelector } from '@reduxjs/toolkit';

const selectUsers = (state: RootState) => state.users;
const selectActiveUsers = createSelector(
  [selectUsers],
  (users) => users.filter((user) => user.isActive)
);
```

### 2. ❌ Selecting Too Much State

```tsx
// ❌ BAD: Component re-renders on ANY user state change
function UserName() {
  const user = useAppSelector((state) => state.user);
  return <span>{user.name}</span>;
}

// ✅ GOOD: Only select what you need
function UserName() {
  const name = useAppSelector((state) => state.user.name);
  return <span>{name}</span>;
}
```

### 3. ❌ Mutating State Accidentally

```tsx
// ❌ BAD: Mutating state outside of a reducer
const items = useAppSelector(selectItems);
items.push(newItem); // This mutates the Redux state directly!

// ✅ GOOD: Dispatch an action to update state
dispatch(addItem(newItem));
```

### 4. ❌ Storing Non-Serializable Values

```tsx
// ❌ BAD: Functions, Promises, classes in state
dispatch(setUser({
  name: 'John',
  createdAt: new Date(), // Not serializable!
  fetchMore: () => api.fetchMore(), // Function in state!
}));

// ✅ GOOD: Only serializable values
dispatch(setUser({
  name: 'John',
  createdAt: new Date().toISOString(), // Serialize dates
}));
// Keep functions in thunks or component logic
```

### 5. ❌ Not Using createAsyncThunk for Async Logic

```tsx
// ❌ BAD: Manual async handling
function fetchUsers() {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const users = await api.fetchUsers();
      dispatch(setUsers(users));
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };
}

// ✅ GOOD: Use createAsyncThunk
const fetchUsers = createAsyncThunk('users/fetch', async () => {
  return await api.fetchUsers();
});

// Handle states in extraReducers
```

### 6. ❌ Overusing Redux for Everything

```tsx
// ❌ BAD: Form state in Redux
const formSlice = createSlice({
  name: 'form',
  initialState: { name: '', email: '', password: '' },
  reducers: {
    setName: (state, action) => { state.name = action.payload },
    setEmail: (state, action) => { state.email = action.payload },
    setPassword: (state, action) => { state.password = action.payload },
  },
});

// ✅ GOOD: Use local state or form libraries for form state
function SignupForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  // Or use React Hook Form, Formik, etc.
}
```

### 7. ❌ Duplicate API State

```tsx
// ❌ BAD: Storing API data in Redux manually
dispatch(setUsers(await fetchUsers()));

// ✅ GOOD: Use RTK Query for API data (or TanStack Query)
// Redux is for client state, not server state
```

---

## Best Practices

### 1. Use RTK Query for API Calls

```tsx
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User', 'Post'],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => 'users',
      providesTags: ['User'],
    }),
    addUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: 'users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGetUsersQuery, useAddUserMutation } = api;
```

### 2. Organize Selectors

```tsx
// features/cart/cartSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';

// Base selectors
const selectCartState = (state: RootState) => state.cart;
export const selectCartItems = (state: RootState) => state.cart.items;

// Derived selectors
export const selectCartTotal = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

export const selectCartItemCount = createSelector(
  [selectCartItems],
  (items) => items.reduce((count, item) => count + item.quantity, 0)
);

export const selectIsCartEmpty = createSelector(
  [selectCartItems],
  (items) => items.length === 0
);
```

### 3. Type Everything

```tsx
// store/store.ts
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed thunk
import { ThunkAction, Action } from '@reduxjs/toolkit';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
```

### 4. Use Immer's "Mutating" Syntax

```tsx
// RTK uses Immer - you can "mutate" state safely
reducers: {
  addItem: (state, action: PayloadAction<Item>) => {
    // This looks like mutation but Immer handles immutability
    state.items.push(action.payload);
  },
  updateItem: (state, action: PayloadAction<{ id: string; changes: Partial<Item> }>) => {
    const item = state.items.find((i) => i.id === action.payload.id);
    if (item) {
      Object.assign(item, action.payload.changes);
    }
  },
}
```

---

## Setup

```tsx
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '@/features/counter/counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```tsx
// main.tsx
import { Provider } from 'react-redux';
import { store } from './store/store';

function App() {
  return (
    <Provider store={store}>
      <YourApp />
    </Provider>
  );
}
```

```bash
# Installation
npm install @reduxjs/toolkit react-redux
```
