# Styling & Theming in React Applications

> A comprehensive guide to styling approaches, theming systems, and best practices for modern React applications.

---

## Table of Contents

1. [Styling Approaches Overview](#styling-approaches-overview)
2. [CSS Modules](#css-modules)
3. [Tailwind CSS](#tailwind-css)
4. [CSS-in-JS (Styled Components / Emotion)](#css-in-js)
5. [Design Tokens](#design-tokens)
6. [Theming Systems](#theming-systems)
7. [Dark Mode Implementation](#dark-mode-implementation)
8. [Component Library Integration](#component-library-integration)
9. [Best Practices](#best-practices)
10. [Decision Guide](#decision-guide)

---

## Styling Approaches Overview

### Comparison Matrix

| Approach | Bundle Size | Runtime Cost | DX | Type Safety | Theming |
|----------|-------------|--------------|-----|-------------|---------|
| **CSS Modules** | Zero JS | None | Good | Limited | Manual |
| **Tailwind CSS** | Optimized | None | Excellent | Good | Built-in |
| **Styled Components** | ~12KB | Yes | Good | Excellent | Built-in |
| **Emotion** | ~7KB | Yes | Good | Excellent | Built-in |
| **Vanilla Extract** | Zero JS | None | Good | Excellent | Built-in |
| **Panda CSS** | Zero JS | None | Excellent | Excellent | Built-in |

### The Modern Landscape (2025)

```
┌─────────────────────────────────────────────────────────────────┐
│                    STYLING APPROACHES                           │
│                                                                 │
│   Zero-Runtime (Recommended)    │    Runtime CSS-in-JS         │
│   ─────────────────────────     │    ──────────────────         │
│   • Tailwind CSS ⭐              │    • Styled Components        │
│   • CSS Modules                 │    • Emotion                  │
│   • Vanilla Extract             │    • Stitches (deprecated)    │
│   • Panda CSS                   │                               │
│                                                                 │
│   ⭐ = Most popular in 2025                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### When to Use What

| Scenario | Recommendation |
|----------|----------------|
| New project, fast iteration | **Tailwind CSS** |
| Design system from scratch | **Vanilla Extract** or **Panda CSS** |
| Existing CSS codebase | **CSS Modules** |
| Component library | **CSS Modules** + CSS Variables |
| Maximum type safety | **Vanilla Extract** |
| Server Components (RSC) | Zero-runtime solutions |

---

## CSS Modules

### What It Is

CSS Modules automatically scope CSS class names to the component, preventing style conflicts.

### Setup

```tsx
// Button.module.css
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.button:hover {
  transform: translateY(-1px);
}

.primary {
  background: var(--color-primary);
  color: white;
}

.secondary {
  background: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
}

.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.large {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}
```

```tsx
// Button.tsx
import styles from './Button.module.css';
import clsx from 'clsx';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={clsx(
        styles.button,
        styles[variant],
        size !== 'medium' && styles[size]
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Pros & Cons

**Pros:**
- Zero runtime cost
- Works with any bundler
- Familiar CSS syntax
- Easy to adopt incrementally
- Works with React Server Components

**Cons:**
- No dynamic styles without inline styles
- Limited type safety for class names
- Theming requires CSS variables

### Type-Safe CSS Modules

```tsx
// typed-css-modules or built-in with Vite plugin
// Button.module.css.d.ts (auto-generated)
declare const styles: {
  readonly button: string;
  readonly primary: string;
  readonly secondary: string;
  readonly small: string;
  readonly large: string;
};
export default styles;
```

```bash
# Generate types
npx typed-css-modules src/**/*.module.css
```

---

## Tailwind CSS

### What It Is

Utility-first CSS framework that provides low-level utility classes to build designs directly in your markup.

### Setup

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Semantic colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### Basic Usage

```tsx
// Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500',
        ghost: 'hover:bg-gray-100 focus-visible:ring-gray-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  isLoading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
```

### The `cn` Utility

```tsx
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage - twMerge intelligently merges conflicting Tailwind classes
cn('px-4 py-2', 'px-6'); // → 'py-2 px-6' (px-6 wins)
cn('text-red-500', condition && 'text-blue-500'); // Conditional classes
```

### Component Patterns

```tsx
// Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      'rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
      'dark:border-gray-800 dark:bg-gray-900',
      className
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('mb-4 space-y-1', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h3 className={cn('text-lg font-semibold leading-none', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: CardProps) {
  return (
    <div className={cn('text-gray-600 dark:text-gray-400', className)}>
      {children}
    </div>
  );
}

// Usage
<Card className="max-w-md">
  <CardHeader>
    <CardTitle>Welcome Back</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Your dashboard awaits...</p>
  </CardContent>
</Card>
```

### Responsive Design

```tsx
// Mobile-first responsive design
<div className="
  grid 
  grid-cols-1 
  gap-4 
  sm:grid-cols-2 
  md:grid-cols-3 
  lg:grid-cols-4
">
  {items.map(item => <Card key={item.id} />)}
</div>

// Responsive text
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
  Heading
</h1>

// Responsive padding/margin
<section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
  Content
</section>
```

### Pros & Cons

**Pros:**
- Zero runtime cost (static CSS)
- Rapid development
- Consistent design system
- Excellent IDE support (IntelliSense)
- Built-in dark mode
- Great documentation

**Cons:**
- Long class strings (mitigated by component extraction)
- Learning curve for utility naming
- Requires build step
- Can feel verbose initially

---

## CSS-in-JS

### Styled Components

```bash
npm install styled-components
npm install -D @types/styled-components
```

```tsx
// Button.tsx
import styled, { css } from 'styled-components';

interface ButtonProps {
  $variant?: 'primary' | 'secondary';
  $size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: css`
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  `,
  md: css`
    padding: 0.5rem 1rem;
    font-size: 1rem;
  `,
  lg: css`
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
  `,
};

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $size = 'md' }) => sizeStyles[$size]}
  
  ${({ $variant = 'primary', theme }) =>
    $variant === 'primary'
      ? css`
          background-color: ${theme.colors.primary};
          color: white;
          &:hover {
            background-color: ${theme.colors.primaryDark};
          }
        `
      : css`
          background-color: transparent;
          border: 1px solid ${theme.colors.primary};
          color: ${theme.colors.primary};
          &:hover {
            background-color: ${theme.colors.primaryLight};
          }
        `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export function Button({ variant, size, children, ...props }) {
  return (
    <StyledButton $variant={variant} $size={size} {...props}>
      {children}
    </StyledButton>
  );
}
```

### Styled Components Theming

```tsx
// theme.ts
export const lightTheme = {
  colors: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#eff6ff',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    error: '#ef4444',
    success: '#10b981',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
};

export const darkTheme: typeof lightTheme = {
  colors: {
    primary: '#60a5fa',
    primaryDark: '#3b82f6',
    primaryLight: '#1e3a5f',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    error: '#f87171',
    success: '#34d399',
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
  },
};

export type Theme = typeof lightTheme;
```

```tsx
// App.tsx
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './theme';

function App() {
  const [isDark, setIsDark] = useState(false);
  
  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <GlobalStyles />
      <MainApp />
    </ThemeProvider>
  );
}
```

```tsx
// GlobalStyles.ts
import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    line-height: 1.5;
    transition: background-color 0.2s, color 0.2s;
  }
  
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;
```

### Emotion

```bash
npm install @emotion/react @emotion/styled
```

```tsx
// Button.tsx
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

// Object styles
const buttonBase = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '0.375rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s',
});

// Template literal styles
const Button = styled.button`
  ${buttonBase}
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

// css prop (inline)
function InlineStyled() {
  return (
    <div
      css={css`
        padding: 1rem;
        background: #f0f0f0;
        border-radius: 0.5rem;
      `}
    >
      Content
    </div>
  );
}
```

### Pros & Cons of CSS-in-JS

**Pros:**
- Full JavaScript power (dynamic styles)
- Scoped styles by default
- Excellent TypeScript support
- Co-located styles
- Built-in theming

**Cons:**
- Runtime overhead
- Larger bundle size
- Not compatible with React Server Components
- Learning curve

---

## Design Tokens

### What Are Design Tokens?

Design tokens are the smallest pieces of your design system—colors, typography, spacing, etc.—stored as platform-agnostic variables.

### CSS Variables (Custom Properties)

```css
/* tokens.css */
:root {
  /* Colors - Semantic */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-light: #eff6ff;
  
  --color-secondary: #6b7280;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  /* Colors - Neutral */
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-text: #111827;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;
  --color-border: #e5e7eb;
  
  /* Typography */
  --font-family-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* Spacing */
  --spacing-0: 0;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
  
  /* Z-Index */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-popover: 400;
  --z-tooltip: 500;
}

/* Dark theme override */
[data-theme="dark"] {
  --color-primary: #60a5fa;
  --color-primary-hover: #3b82f6;
  --color-primary-light: #1e3a5f;
  
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
  --color-border: #334155;
  
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
}
```

### Using Tokens in Components

```tsx
// With CSS Modules
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-md);
}

.title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin-bottom: var(--spacing-2);
}
```

```tsx
// With Tailwind (extend config)
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        // ...
      },
    },
  },
};

// Usage
<div className="bg-surface border-border text-text p-6 rounded-lg shadow-md">
```

### TypeScript Token Types

```tsx
// tokens.ts
export const tokens = {
  colors: {
    primary: 'var(--color-primary)',
    primaryHover: 'var(--color-primary-hover)',
    background: 'var(--color-background)',
    text: 'var(--color-text)',
    // ...
  },
  spacing: {
    0: 'var(--spacing-0)',
    1: 'var(--spacing-1)',
    2: 'var(--spacing-2)',
    // ...
  },
  // ...
} as const;

export type ColorToken = keyof typeof tokens.colors;
export type SpacingToken = keyof typeof tokens.spacing;

// Usage with type safety
function Box({ bg }: { bg: ColorToken }) {
  return <div style={{ backgroundColor: tokens.colors[bg] }} />;
}
```

---

## Theming Systems

### CSS Variables + Context (Recommended)

```tsx
// contexts/ThemeContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('theme') as Theme) || 'system';
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (resolved: 'light' | 'dark') => {
      root.setAttribute('data-theme', resolved);
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      setResolvedTheme(resolved);
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme: handleSetTheme }}
    >
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
```

### Theme Toggle Component

```tsx
// components/ThemeToggle.tsx
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'rounded-md p-2 transition-colors',
          theme === 'light'
            ? 'bg-white text-yellow-600 shadow-sm dark:bg-gray-700'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
        )}
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'rounded-md p-2 transition-colors',
          theme === 'dark'
            ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
        )}
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          'rounded-md p-2 transition-colors',
          theme === 'system'
            ? 'bg-white text-gray-700 shadow-sm dark:bg-gray-700 dark:text-gray-200'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
        )}
        aria-label="System preference"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}
```

### Preventing Flash (FOUC)

```html
<!-- index.html - Add script in <head> before styles -->
<script>
  (function() {
    const theme = localStorage.getItem('theme') || 'system';
    let resolved = theme;
    
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.classList.add(resolved);
  })();
</script>
```

---

## Dark Mode Implementation

### Tailwind Dark Mode

```tsx
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'selector' in v4
  // ...
};

// Usage
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
    Title
  </h1>
  <p className="text-gray-600 dark:text-gray-400">
    Description
  </p>
</div>
```

### CSS Variables Dark Mode

```css
/* Base tokens (light) */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
}

/* Dark mode tokens */
:root[data-theme="dark"],
.dark {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --border-color: #374151;
}

/* Component using tokens - works in both modes */
.card {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
```

### Media Query Fallback

```css
/* System preference only */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg-primary: #111827;
    --text-primary: #f9fafb;
    /* ... */
  }
}
```

### Images in Dark Mode

```tsx
// Different images per theme
function Logo() {
  const { resolvedTheme } = useTheme();
  
  return (
    <img
      src={resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'}
      alt="Logo"
    />
  );
}

// CSS approach
<picture>
  <source srcset="/logo-dark.svg" media="(prefers-color-scheme: dark)" />
  <img src="/logo-light.svg" alt="Logo" />
</picture>

// Tailwind approach - invert/filter
<img
  src="/logo.svg"
  alt="Logo"
  className="dark:invert dark:brightness-0"
/>
```

---

## Component Library Integration

### shadcn/ui Pattern

The shadcn/ui approach: copy components into your codebase, own and customize them.

```tsx
// components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### Theme Configuration

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}
```

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
};
```

---

## Best Practices

### 1. Use Semantic Color Names

```css
/* ❌ BAD: Literal color names */
:root {
  --blue-500: #3b82f6;
  --gray-100: #f3f4f6;
}

/* ✅ GOOD: Semantic names */
:root {
  --color-primary: #3b82f6;
  --color-background: #f3f4f6;
}
```

### 2. Component-Level Composition

```tsx
// ❌ BAD: Utility classes everywhere
<div className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
      {initial}
    </div>
    <div>
      <h3 className="font-semibold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-500">{email}</p>
    </div>
  </div>
</div>

// ✅ GOOD: Extract into component
<UserCard user={user} />

// UserCard.tsx - still uses Tailwind, but abstracted
function UserCard({ user }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="flex items-center justify-between p-4">
        <Avatar user={user} />
        <UserInfo name={user.name} email={user.email} />
      </CardContent>
    </Card>
  );
}
```

### 3. Consistent Spacing Scale

```tsx
// ❌ BAD: Arbitrary values
<div className="p-[13px] mt-[7px] gap-[9px]">

// ✅ GOOD: Use scale
<div className="p-3 mt-2 gap-2">
```

### 4. Mobile-First Responsive

```tsx
// ❌ BAD: Desktop-first
<div className="grid-cols-4 md:grid-cols-2 sm:grid-cols-1">

// ✅ GOOD: Mobile-first
<div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

### 5. Organize Tailwind Classes

```tsx
// Use consistent ordering
<div
  className={cn(
    // Layout
    'flex items-center justify-between',
    // Sizing
    'w-full max-w-md h-12',
    // Spacing
    'p-4 gap-3',
    // Typography
    'text-sm font-medium',
    // Colors
    'bg-white text-gray-900',
    // Borders
    'border border-gray-200 rounded-lg',
    // Effects
    'shadow-sm',
    // States
    'hover:bg-gray-50 focus:ring-2',
    // Transitions
    'transition-colors duration-200',
    // Responsive
    'md:p-6 lg:max-w-lg',
    // Dark mode
    'dark:bg-gray-800 dark:text-white dark:border-gray-700'
  )}
>
```

### 6. Create Variant Components with CVA

```tsx
import { cva, type VariantProps } from 'class-variance-authority';

const badge = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badge({ variant }), className)} {...props} />;
}
```

### 7. Use CSS Layers for Specificity Control

```css
@layer base, tokens, components, utilities;

@layer tokens {
  :root {
    --color-primary: #3b82f6;
  }
}

@layer components {
  .btn {
    /* Component styles */
  }
}
```

---

## Decision Guide

```
┌─────────────────────────────────────────────────────────────────┐
│                  STYLING APPROACH DECISION                      │
│                                                                 │
│   Need Server Components (RSC)?                                 │
│   ├── YES → Use zero-runtime: Tailwind, CSS Modules, Vanilla   │
│   │         Extract, or Panda CSS                               │
│   │                                                             │
│   └── NO → All options available                                │
│                                                                 │
│   Team familiarity?                                             │
│   ├── CSS experts → CSS Modules + CSS Variables                 │
│   ├── JS-first → Styled Components / Emotion                    │
│   └── New team → Tailwind (great docs, fast onboarding)         │
│                                                                 │
│   Project type?                                                 │
│   ├── Startup/MVP → Tailwind + shadcn/ui                        │
│   ├── Design System → Vanilla Extract or Panda CSS              │
│   ├── Component Library → CSS Modules + CSS Variables           │
│   └── Enterprise → Whatever team knows + strict conventions     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Stack (2025)

For most React applications:

```
Tailwind CSS (styling)
  + class-variance-authority (variants)
  + tailwind-merge (class merging)
  + clsx (conditional classes)
  + CSS Variables (theming)
  + shadcn/ui (component patterns)
```

```bash
npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
npm install class-variance-authority clsx tailwind-merge
```

This gives you:
- Zero runtime overhead
- Excellent DX with IntelliSense
- Built-in dark mode
- Full customization
- Server Component compatibility
- Great TypeScript support
