# TanStack Query (React Query) - Complete Guide

> The standard for fetching, caching, and synchronizing server state in React applications.

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

TanStack Query treats **server state** as fundamentally different from **client state**. Server state:

- Is persisted remotely (you only have a snapshot)
- Can become stale without your knowledge
- Requires async APIs to fetch/update

### The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR REACT APP                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │ Component A │    │ Component B │    │ Component C │         │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                    │
│                   ┌────────▼────────┐                           │
│                   │   Query Cache   │  ← Single source of truth │
│                   │  ['users', 1]   │                           │
│                   │  ['posts']      │                           │
│                   └────────┬────────┘                           │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Your API      │
                    │   /api/users    │
                    └─────────────────┘
```

### Query Lifecycle

```
fresh ──(staleTime expires)──► stale ──(component mounts)──► fetching
                                 │                              │
                                 │                              ▼
                                 └──────────────────────── background refetch
                                                                │
                                                                ▼
                                                          cache updated
                                                                │
                                                                ▼
                                                          components re-render
```

---

## Core Concepts

### 1. Query Keys

Query keys uniquely identify data in the cache. They can be strings or arrays:

```tsx
// Simple key
useQuery({ queryKey: ['todos'], ... })

// Key with variables (hierarchical)
useQuery({ queryKey: ['todos', { status: 'done' }], ... })
useQuery({ queryKey: ['todos', todoId], ... })
useQuery({ queryKey: ['users', userId, 'posts'], ... })
```

**Key Rules:**
- Keys are hashed deterministically (object property order doesn't matter)
- Use hierarchical keys for related data
- Include all variables the query depends on

### 2. Query Functions

The async function that fetches data:

```tsx
useQuery({
  queryKey: ['todos', todoId],
  queryFn: async () => {
    const response = await fetch(`/api/todos/${todoId}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
});
```

### 3. Stale Time vs Cache Time

```tsx
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5 * 60 * 1000,  // Data considered fresh for 5 minutes
  gcTime: 30 * 60 * 1000,    // Keep in cache for 30 minutes (formerly cacheTime)
});
```

| Concept | Default | Description |
|---------|---------|-------------|
| `staleTime` | 0 | How long data is considered "fresh" |
| `gcTime` | 5 min | How long inactive data stays in cache before garbage collection |

---

## API Reference

### useQuery

For fetching data:

```tsx
const {
  data,              // The resolved data
  error,             // Error object if query failed
  isLoading,         // True on first load (no data yet)
  isFetching,        // True whenever fetching (including background)
  isError,           // True if query is in error state
  isSuccess,         // True if query succeeded
  status,            // 'pending' | 'error' | 'success'
  fetchStatus,       // 'fetching' | 'paused' | 'idle'
  refetch,           // Function to manually refetch
} = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  
  // Options
  enabled: true,                    // Set false to disable auto-fetching
  staleTime: 0,                     // Time until data is considered stale
  gcTime: 5 * 60 * 1000,           // Garbage collection time
  refetchOnWindowFocus: true,       // Refetch when window regains focus
  refetchOnMount: true,             // Refetch when component mounts
  refetchOnReconnect: true,         // Refetch when network reconnects
  refetchInterval: false,           // Polling interval (ms) or false
  retry: 3,                         // Number of retry attempts
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  select: (data) => data.users,     // Transform/select data
  placeholderData: [],              // Show while loading (no loading state)
  initialData: () => cache.get(),   // Hydrate from cache/SSR
});
```

### useMutation

For creating, updating, or deleting data:

```tsx
const {
  mutate,            // Fire-and-forget mutation
  mutateAsync,       // Returns promise
  isPending,         // Mutation is in progress
  isError,           // Mutation failed
  isSuccess,         // Mutation succeeded
  error,             // Error object
  data,              // Returned data
  reset,             // Reset mutation state
} = useMutation({
  mutationFn: async (newUser: CreateUserDTO) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser),
    });
    return response.json();
  },
  
  // Lifecycle callbacks
  onMutate: async (variables) => {
    // Called before mutation fires
    // Great for optimistic updates
    await queryClient.cancelQueries({ queryKey: ['users'] });
    const previous = queryClient.getQueryData(['users']);
    queryClient.setQueryData(['users'], (old) => [...old, variables]);
    return { previous }; // Context for rollback
  },
  onError: (error, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['users'], context.previous);
  },
  onSuccess: (data, variables, context) => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
  onSettled: (data, error, variables, context) => {
    // Always runs (like finally)
  },
});

// Usage
mutate({ name: 'John', email: 'john@example.com' });

// With callbacks
mutate(
  { name: 'John' },
  {
    onSuccess: () => navigate('/users'),
    onError: (error) => toast.error(error.message),
  }
);
```

### useQueryClient

Access the query client for cache manipulation:

```tsx
const queryClient = useQueryClient();

// Invalidate queries (marks stale, triggers refetch if mounted)
queryClient.invalidateQueries({ queryKey: ['users'] });
queryClient.invalidateQueries({ queryKey: ['users', userId] });

// Set data directly
queryClient.setQueryData(['users', userId], updatedUser);

// Get cached data
const users = queryClient.getQueryData(['users']);

// Prefetch data
await queryClient.prefetchQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),
});

// Cancel ongoing queries
await queryClient.cancelQueries({ queryKey: ['users'] });

// Remove from cache
queryClient.removeQueries({ queryKey: ['users'] });

// Reset to initial state
queryClient.resetQueries({ queryKey: ['users'] });
```

### useInfiniteQuery

For paginated/infinite scroll data:

```tsx
const {
  data,
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
  isFetchingNextPage,
  isFetchingPreviousPage,
} = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: async ({ pageParam }) => {
    const response = await fetch(`/api/posts?cursor=${pageParam}`);
    return response.json();
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  getPreviousPageParam: (firstPage) => firstPage.prevCursor ?? undefined,
});

// Data structure
// data.pages = [page1, page2, page3, ...]
// data.pageParams = [0, cursor1, cursor2, ...]

// Flatten for rendering
const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];
```

---

## Common Patterns

### 1. Dependent Queries

```tsx
// Fetch user first, then their posts
function UserPosts({ userId }: { userId: string }) {
  const userQuery = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  });

  const postsQuery = useQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => fetchUserPosts(userId),
    enabled: !!userQuery.data, // Only fetch when user is loaded
  });
}
```

### 2. Parallel Queries

```tsx
// Using useQueries for dynamic parallel queries
const userQueries = useQueries({
  queries: userIds.map((id) => ({
    queryKey: ['users', id],
    queryFn: () => fetchUser(id),
  })),
});

// All results
const users = userQueries.map((q) => q.data);
const isLoading = userQueries.some((q) => q.isLoading);
```

### 3. Optimistic Updates

```tsx
const updateTodo = useMutation({
  mutationFn: updateTodoApi,
  onMutate: async (newTodo) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['todos', newTodo.id] });

    // Snapshot previous value
    const previousTodo = queryClient.getQueryData(['todos', newTodo.id]);

    // Optimistically update
    queryClient.setQueryData(['todos', newTodo.id], newTodo);

    // Return context for rollback
    return { previousTodo };
  },
  onError: (err, newTodo, context) => {
    // Rollback on error
    queryClient.setQueryData(['todos', newTodo.id], context.previousTodo);
  },
  onSettled: (data, error, variables) => {
    // Always refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['todos', variables.id] });
  },
});
```

### 4. Prefetching

```tsx
// On hover
<Link
  to={`/user/${userId}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['users', userId],
      queryFn: () => fetchUser(userId),
      staleTime: 5000, // Don't refetch if less than 5s old
    });
  }}
>
  View User
</Link>
```

### 5. Polling

```tsx
useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  refetchInterval: 30000, // Poll every 30 seconds
  refetchIntervalInBackground: false, // Stop when tab is hidden
});
```

---

## Pitfalls & Solutions

### 1. ❌ Using useEffect for Data Fetching

```tsx
// ❌ BAD: Manual fetching with useEffect
function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  
  // No caching, no background refetch, no deduplication...
}

// ✅ GOOD: Use TanStack Query
function Users() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
}
```

### 2. ❌ Unstable Query Keys

```tsx
// ❌ BAD: Object reference changes every render
useQuery({
  queryKey: ['users', { filter: { status: 'active' } }],
  queryFn: fetchUsers,
});

// This is actually fine - TanStack Query hashes objects deterministically
// But avoid functions or non-serializable values in keys!

// ❌ BAD: Function in query key
useQuery({
  queryKey: ['users', () => getFilter()], // Functions break hashing
  queryFn: fetchUsers,
});
```

### 3. ❌ Missing Variables in Query Key

```tsx
// ❌ BAD: Query key doesn't include the variable
function User({ userId }: { userId: string }) {
  useQuery({
    queryKey: ['user'], // Same key for all users!
    queryFn: () => fetchUser(userId),
  });
}

// ✅ GOOD: Include the variable
useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),
});
```

### 4. ❌ Not Handling Loading/Error States

```tsx
// ❌ BAD: Assuming data exists
function Users() {
  const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  return <ul>{data.map(...)}</ul>; // 💥 data is undefined on first render!
}

// ✅ GOOD: Handle all states
function Users() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return <ul>{data.map(...)}</ul>;
}
```

### 5. ❌ Over-invalidating

```tsx
// ❌ BAD: Nuclear option - invalidates everything
queryClient.invalidateQueries(); 

// ✅ GOOD: Surgical invalidation
queryClient.invalidateQueries({ queryKey: ['users'] }); // All user queries
queryClient.invalidateQueries({ queryKey: ['users', userId] }); // Specific user
```

### 6. ❌ Not Setting Appropriate Stale Times

```tsx
// ❌ BAD: Default staleTime is 0, causes refetch on every mount
useQuery({
  queryKey: ['config'],
  queryFn: fetchAppConfig,
  // staleTime: 0 (default) - refetches immediately on component mount
});

// ✅ GOOD: Set staleTime based on data characteristics
useQuery({
  queryKey: ['config'],
  queryFn: fetchAppConfig,
  staleTime: Infinity, // App config rarely changes
});

useQuery({
  queryKey: ['stock-price'],
  queryFn: fetchStockPrice,
  staleTime: 1000, // Stock prices change frequently
});
```

### 7. ❌ Mixing Server State with Client State

```tsx
// ❌ BAD: Storing API data in Zustand/Redux
const useStore = create((set) => ({
  users: [],
  fetchUsers: async () => {
    const users = await api.getUsers();
    set({ users });
  },
}));

// ✅ GOOD: Use TanStack Query for server state
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: api.getUsers,
});

```

---

## Best Practices

### 1. Create Custom Hooks

```tsx
// queries/useUsers.ts
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => api.getUsers(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => api.getUser(userId),
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

### 2. Set Global Defaults

```tsx
// lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### 3. Use Query Key Factories

```tsx
// queries/keys.ts
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Usage
useQuery({ queryKey: userKeys.detail(userId), ... });
queryClient.invalidateQueries({ queryKey: userKeys.lists() });
```

### 4. Type Your Queries

```tsx
interface User {
  id: string;
  name: string;
  email: string;
}

// Fully typed
const { data } = useQuery<User[], Error>({
  queryKey: ['users'],
  queryFn: async (): Promise<User[]> => {
    const response = await fetch('/api/users');
    return response.json();
  },
});
// data is User[] | undefined
```

---

## Setup

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

```bash
# Installation
npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools
```
