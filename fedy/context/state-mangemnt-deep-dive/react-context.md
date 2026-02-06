# React Context API - Complete Guide

> React's built-in solution for dependency injection and low-frequency state sharing.

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

React Context provides a way to pass data through the component tree without manually passing props at every level (prop drilling).

### The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     WITHOUT CONTEXT                             │
│                                                                 │
│   <App theme="dark">                                           │
│     <Layout theme="dark">                                      │
│       <Sidebar theme="dark">                                   │
│         <Nav theme="dark">                                     │
│           <NavItem theme="dark" />  ← Finally uses theme       │
│                                                                 │
│   Every component must pass theme as a prop!                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      WITH CONTEXT                               │
│                                                                 │
│   <ThemeProvider value="dark">                                 │
│     <Layout>                                                   │
│       <Sidebar>                                                │
│         <Nav>                                                  │
│           <NavItem />  ← useContext(ThemeContext) → "dark"     │
│                                                                 │
│   No prop drilling! Any component can access theme directly.   │
└─────────────────────────────────────────────────────────────────┘
```

### When to Use Context

| Use Case | Recommendation |
|----------|----------------|
| Theme (dark/light mode) | ✅ Perfect |
| Current user/auth | ✅ Perfect |
| Locale/i18n | ✅ Perfect |
| Feature flags | ✅ Perfect |
| Dependency injection | ✅ Perfect |
| Frequently changing data | ❌ Use Zustand/Jotai |
| Complex state logic | ❌ Use Redux/Zustand |
| Server data | ❌ Use TanStack Query |

---

## Core Concepts

### 1. Creating Context

```tsx
import { createContext } from 'react';

// Create with default value (used when no Provider is found)
const ThemeContext = createContext<'light' | 'dark'>('light');

// Create with null default (requires Provider)
const UserContext = createContext<User | null>(null);
```

### 2. Providing Context

```tsx
function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  return (
    <ThemeContext.Provider value={theme}>
      <MainLayout />
    </ThemeContext.Provider>
  );
}
```

### 3. Consuming Context

```tsx
import { useContext } from 'react';

function ThemedButton() {
  const theme = useContext(ThemeContext);
  
  return (
    <button className={theme === 'dark' ? 'btn-dark' : 'btn-light'}>
      Click me
    </button>
  );
}
```

---

## API Reference

### createContext

Creates a context object:

```tsx
const MyContext = createContext<Type>(defaultValue);
```

- `defaultValue`: Used when a component doesn't have a matching Provider above it in the tree
- Returns: Context object with `Provider` and `Consumer` (legacy) components

```tsx
// With explicit type
interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);
```

### Context.Provider

Provides context value to descendants:

```tsx
<MyContext.Provider value={contextValue}>
  {children}
</MyContext.Provider>
```

- `value`: The value to pass to consuming components
- Multiple providers of the same context can be nested; inner providers override outer ones

```tsx
// Nested providers
<ThemeContext.Provider value="dark">
  <Sidebar /> {/* Gets "dark" */}
  
  <ThemeContext.Provider value="light">
    <MainContent /> {/* Gets "light" */}
  </ThemeContext.Provider>
</ThemeContext.Provider>
```

### useContext

Hook to consume context:

```tsx
const value = useContext(MyContext);
```

- Returns current context value (from nearest Provider above)
- Component re-renders when context value changes
- If no Provider found, returns `defaultValue` from `createContext`

```tsx
function Component() {
  const theme = useContext(ThemeContext);
  
  // If ThemeContext has no Provider and default is null
  if (theme === null) {
    throw new Error('Component must be used within ThemeProvider');
  }
  
  return <div className={theme.className}>{/* ... */}</div>;
}
```

### Context.Consumer (Legacy)

Class component pattern (avoid in new code):

```tsx
// Legacy pattern - avoid
<ThemeContext.Consumer>
  {(theme) => <div className={theme}>Content</div>}
</ThemeContext.Consumer>

// Modern pattern - prefer
function Component() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>Content</div>;
}
```

### use (React 19+)

New hook that can be called conditionally:

```tsx
import { use } from 'react';

function Component({ showTheme }: { showTheme: boolean }) {
  // Can be called conditionally!
  if (showTheme) {
    const theme = use(ThemeContext);
    return <div>{theme}</div>;
  }
  return <div>No theme</div>;
}
```

---

## Common Patterns

### 1. Theme Context

```tsx
// contexts/ThemeContext.tsx
import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize from localStorage or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  // Memoize to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme]
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

### 2. Authentication Context

```tsx
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const userData = await response.json();
    setUser(userData);
  }

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
  }

  async function signup(data: SignupData) {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    const userData = await response.json();
    setUser(userData);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      signup,
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

// Convenience hook for protected routes
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  return { user, isLoading };
}
```

### 3. Internationalization (i18n) Context

```tsx
// contexts/I18nContext.tsx
import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

type Locale = 'en' | 'es' | 'fr' | 'de';

type TranslationKey = keyof typeof translations.en;

const translations = {
  en: {
    greeting: 'Hello',
    goodbye: 'Goodbye',
    welcome: 'Welcome, {name}!',
  },
  es: {
    greeting: 'Hola',
    goodbye: 'Adiós',
    welcome: '¡Bienvenido, {name}!',
  },
  // ... more locales
} as const;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('locale') as Locale;
    return saved || navigator.language.split('-')[0] as Locale || 'en';
  });

  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    let text = translations[locale]?.[key] || translations.en[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, value);
      });
    }
    
    return text;
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale: (newLocale: Locale) => {
        localStorage.setItem('locale', newLocale);
        setLocale(newLocale);
      },
      t,
    }),
    [locale]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Usage
function Greeting({ name }: { name: string }) {
  const { t } = useI18n();
  return <h1>{t('welcome', { name })}</h1>;
}
```

### 4. Feature Flags Context

```tsx
// contexts/FeatureFlagsContext.tsx
import { createContext, useContext, ReactNode } from 'react';

interface FeatureFlags {
  newDashboard: boolean;
  darkMode: boolean;
  experimentalFeature: boolean;
}

const defaultFlags: FeatureFlags = {
  newDashboard: false,
  darkMode: true,
  experimentalFeature: false,
};

const FeatureFlagsContext = createContext<FeatureFlags>(defaultFlags);

interface Props {
  children: ReactNode;
  flags?: Partial<FeatureFlags>;
}

export function FeatureFlagsProvider({ children, flags = {} }: Props) {
  const mergedFlags = { ...defaultFlags, ...flags };
  
  return (
    <FeatureFlagsContext.Provider value={mergedFlags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

export function useFeatureFlag(flag: keyof FeatureFlags) {
  const flags = useContext(FeatureFlagsContext);
  return flags[flag];
}

// Usage
function Dashboard() {
  const newDashboard = useFeatureFlag('newDashboard');
  
  return newDashboard ? <NewDashboard /> : <LegacyDashboard />;
}
```

### 5. Compound Components Pattern

```tsx
// components/Tabs/index.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs');
  }
  return context;
}

// Main container
function Tabs({
  children,
  defaultTab,
}: {
  children: ReactNode;
  defaultTab: string;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

// Tab list
function TabList({ children }: { children: ReactNode }) {
  return <div className="tab-list" role="tablist">{children}</div>;
}

// Individual tab trigger
function Tab({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab, setActiveTab } = useTabs();
  
  return (
    <button
      role="tab"
      aria-selected={activeTab === id}
      className={activeTab === id ? 'tab active' : 'tab'}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
}

// Tab panel
function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  const { activeTab } = useTabs();
  
  if (activeTab !== id) return null;
  
  return (
    <div role="tabpanel" className="tab-panel">
      {children}
    </div>
  );
}

// Attach sub-components
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

export { Tabs };

// Usage
function Example() {
  return (
    <Tabs defaultTab="overview">
      <Tabs.List>
        <Tabs.Tab id="overview">Overview</Tabs.Tab>
        <Tabs.Tab id="features">Features</Tabs.Tab>
        <Tabs.Tab id="pricing">Pricing</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel id="overview">
        <h2>Overview Content</h2>
      </Tabs.Panel>
      <Tabs.Panel id="features">
        <h2>Features Content</h2>
      </Tabs.Panel>
      <Tabs.Panel id="pricing">
        <h2>Pricing Content</h2>
      </Tabs.Panel>
    </Tabs>
  );
}
```

---

## Pitfalls & Solutions

### 1. ❌ Context Value Causing Unnecessary Re-renders

```tsx
// ❌ BAD: New object on every render causes all consumers to re-render
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ✅ GOOD: Memoize the context value
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 2. ❌ Using Context for High-Frequency Updates

```tsx
// ❌ BAD: Mouse position updates 60+ times per second
const MouseContext = createContext({ x: 0, y: 0 });

function MouseProvider({ children }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handler = (e) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  
  return (
    <MouseContext.Provider value={position}>
      {children}
    </MouseContext.Provider>
  );
  // ALL consumers re-render on every mouse move!
}

// ✅ GOOD: Use Zustand or Jotai for high-frequency updates
import { create } from 'zustand';

const useMouseStore = create((set) => ({
  x: 0,
  y: 0,
}));

// Subscribe only where needed with selectors
function XPosition() {
  const x = useMouseStore((state) => state.x);
  return <span>{x}</span>;
}
```

### 3. ❌ Missing Provider Error Handling

```tsx
// ❌ BAD: Silently returns undefined
const UserContext = createContext(undefined);

function Profile() {
  const user = useContext(UserContext);
  return <div>{user.name}</div>; // 💥 Cannot read 'name' of undefined
}

// ✅ GOOD: Explicit error with helpful message
const UserContext = createContext<User | null>(null);

function useUser() {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error(
      'useUser must be used within a UserProvider. ' +
      'Wrap your component tree with <UserProvider>.'
    );
  }
  return context;
}
```

### 4. ❌ Provider Hell

```tsx
// ❌ BAD: Deeply nested providers
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <I18nProvider>
          <FeatureFlagsProvider>
            <NotificationProvider>
              <ModalProvider>
                <ToastProvider>
                  <MainApp />
                </ToastProvider>
              </ModalProvider>
            </NotificationProvider>
          </FeatureFlagsProvider>
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

// ✅ GOOD: Compose providers
function composeProviders(...providers: React.FC<{ children: ReactNode }>[]) {
  return providers.reduce(
    (Prev, Curr) =>
      ({ children }) => (
        <Prev>
          <Curr>{children}</Curr>
        </Prev>
      ),
    ({ children }) => <>{children}</>
  );
}

const AppProviders = composeProviders(
  AuthProvider,
  ThemeProvider,
  I18nProvider,
  FeatureFlagsProvider,
  NotificationProvider
);

function App() {
  return (
    <AppProviders>
      <MainApp />
    </AppProviders>
  );
}

// ✅ ALSO GOOD: Single Providers component
function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <I18nProvider>
          {children}
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

### 5. ❌ Splitting Related State Across Contexts

```tsx
// ❌ BAD: Theme value and setter in separate contexts
const ThemeValueContext = createContext('light');
const ThemeSetterContext = createContext(() => {});

// ✅ GOOD: Keep related state together
const ThemeContext = createContext({
  theme: 'light',
  setTheme: (theme: string) => {},
});
```

### 6. ❌ Using Context for Derived/Computed Values

```tsx
// ❌ BAD: Recomputing in context
function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  
  // Recomputed on every render
  const total = items.reduce((sum, item) => sum + item.price, 0);
  
  return (
    <CartContext.Provider value={{ items, total, setItems }}>
      {children}
    </CartContext.Provider>
  );
}

// ✅ GOOD: Memoize derived values
function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  );
  
  const value = useMemo(
    () => ({ items, total, setItems }),
    [items, total]
  );
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
```

---

## Best Practices

### 1. Create Custom Hooks for Context

```tsx
// Always create a custom hook instead of exporting the context
const MyContext = createContext<MyContextType | null>(null);

// ❌ Don't export the context directly
export { MyContext }; // Avoid

// ✅ Export a custom hook
export function useMyContext() {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
}
```

### 2. Split Context by Update Frequency

```tsx
// Separate rarely-changing from frequently-changing data
const UserContext = createContext<User | null>(null);        // Rarely changes
const UserActionsContext = createContext<UserActions | null>(null);  // Never changes

function UserProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  
  // Actions are stable - defined once
  const actions = useMemo(() => ({
    login: async (credentials) => { /* ... */ },
    logout: async () => { /* ... */ },
  }), []);
  
  return (
    <UserContext.Provider value={user}>
      <UserActionsContext.Provider value={actions}>
        {children}
      </UserActionsContext.Provider>
    </UserContext.Provider>
  );
}

// Components that only need actions don't re-render on user change
function LogoutButton() {
  const { logout } = useContext(UserActionsContext);
  return <button onClick={logout}>Logout</button>;
}
```

### 3. Use Context for Dependency Injection

```tsx
// Inject services/utilities that components need
interface Services {
  api: ApiClient;
  analytics: AnalyticsService;
  logger: Logger;
}

const ServicesContext = createContext<Services | null>(null);

function ServicesProvider({ children }: { children: ReactNode }) {
  const services = useMemo(() => ({
    api: new ApiClient(),
    analytics: new AnalyticsService(),
    logger: new Logger(),
  }), []);
  
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

// Easy to mock in tests!
function renderWithServices(ui: ReactElement, mockServices?: Partial<Services>) {
  const services = {
    api: mockServices?.api ?? new MockApiClient(),
    analytics: mockServices?.analytics ?? new MockAnalytics(),
    logger: mockServices?.logger ?? new MockLogger(),
  };
  
  return render(
    <ServicesContext.Provider value={services}>
      {ui}
    </ServicesContext.Provider>
  );
}
```

### 4. Consider Context Boundaries

```tsx
// Not everything needs to be at the app root
function App() {
  return (
    <AuthProvider>  {/* App-wide */}
      <ThemeProvider>  {/* App-wide */}
        <Routes>
          <Route path="/admin/*" element={
            <AdminProvider>  {/* Only for admin routes */}
              <AdminLayout />
            </AdminProvider>
          } />
          <Route path="/checkout/*" element={
            <CheckoutProvider>  {/* Only for checkout */}
              <CheckoutFlow />
            </CheckoutProvider>
          } />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

### 5. Colocate Context with Feature

```
src/
├── features/
│   ├── auth/
│   │   ├── AuthContext.tsx    # Context + Provider + Hook
│   │   ├── LoginForm.tsx
│   │   └── index.ts
│   ├── theme/
│   │   ├── ThemeContext.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── index.ts
```

---

## Setup

```tsx
// contexts/ThemeContext.tsx
import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// App.tsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
```

```bash
# No installation needed - React Context is built-in!
```
