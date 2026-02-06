# Testing Business Logic in React Applications

> A comprehensive guide to testing business logic effectively, with strategies for each state management approach.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Separating Business Logic from UI](#separating-business-logic-from-ui)
3. [The Testing Strategy](#the-testing-strategy)
4. [Testing Pure Business Logic](#testing-pure-business-logic)
5. [Testing with State Management](#testing-with-state-management)
6. [Integration Testing](#integration-testing)
7. [Best Practices](#best-practices)

---

## Testing Philosophy

### The Goal: Test Business Logic, Not Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHAT TO TEST                                 │
│                                                                 │
│   ✅ Business Rules       │  ❌ Implementation Details          │
│   ─────────────────────   │  ────────────────────────           │
│   • Cart total calc       │  • Which state lib is used          │
│   • Discount logic        │  • Internal state shape             │
│   • Validation rules      │  • Number of re-renders             │
│   • User permissions      │  • CSS class names                  │
│   • Data transformations  │  • DOM structure                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The Testing Pyramid

```
                    ┌─────────┐
                    │   E2E   │  Few, slow, expensive
                    │  Tests  │  (Playwright/Cypress)
                   ─┴─────────┴─
                 ┌───────────────┐
                 │  Integration  │  Some, medium speed
                 │    Tests      │  (Testing Library)
                ─┴───────────────┴─
              ┌───────────────────────┐
              │      Unit Tests       │  Many, fast, cheap
              │   (Business Logic)    │  (Vitest/Jest)
             ─┴───────────────────────┴─
```

### Key Principle: Isolate Business Logic

The easier your business logic is to test, the better your architecture.

```tsx
// ❌ BAD: Business logic buried in component
function Cart() {
  const [items, setItems] = useState([]);
  
  const addItem = (item) => {
    // Business logic mixed with UI
    if (items.length >= 10) {
      toast.error("Cart is full");
      return;
    }
    const existing = items.find(i => i.id === item.id);
    if (existing) {
      setItems(items.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, { ...item, quantity: 1 }]);
    }
  };
  
  // Hard to test without rendering the component!
}

// ✅ GOOD: Business logic extracted and testable
// Pure function - easy to test
function addItemToCart(items: CartItem[], newItem: Product): CartItem[] {
  if (items.length >= 10) {
    throw new CartFullError();
  }
  const existing = items.find(i => i.id === newItem.id);
  if (existing) {
    return items.map(i =>
      i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
    );
  }
  return [...items, { ...newItem, quantity: 1 }];
}

// Test without any React!
describe('addItemToCart', () => {
  it('adds new item with quantity 1', () => {
    const result = addItemToCart([], { id: '1', name: 'Widget', price: 10 });
    expect(result).toEqual([{ id: '1', name: 'Widget', price: 10, quantity: 1 }]);
  });
  
  it('increments quantity for existing item', () => {
    const items = [{ id: '1', name: 'Widget', price: 10, quantity: 1 }];
    const result = addItemToCart(items, { id: '1', name: 'Widget', price: 10 });
    expect(result[0].quantity).toBe(2);
  });
  
  it('throws when cart is full', () => {
    const items = Array(10).fill({ id: '1', quantity: 1 });
    expect(() => addItemToCart(items, { id: '2' })).toThrow(CartFullError);
  });
});
```

---

## Separating Business Logic from UI


```
src/
├── domain/                    # Pure business logic (no React)
│   ├── cart/
│   │   ├── cart.ts           # Cart entity & operations
│   │   ├── cart.test.ts      # Unit tests
│   │   ├── discounts.ts      # Discount calculations
│   │   └── discounts.test.ts
│   ├── user/
│   │   ├── permissions.ts    # Permission checks
│   │   └── permissions.test.ts
│   └── order/
│       ├── validation.ts     # Order validation rules
│       └── validation.test.ts
│

### Example: Domain Layer

```tsx
// domain/cart/cart.ts
// Pure TypeScript - no React, no state management

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  couponCode: string | null;
}

export const MAX_CART_ITEMS = 50;
export const MAX_ITEM_QUANTITY = 99;

// Pure functions - easy to test
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateDiscount(
  subtotal: number,
  couponCode: string | null
): number {
  if (!couponCode) return 0;
  
  const discounts: Record<string, number> = {
    'SAVE10': 0.10,
    'SAVE20': 0.20,
    'HALF': 0.50,
  };
  
  const rate = discounts[couponCode.toUpperCase()] ?? 0;
  return subtotal * rate;
}

export function calculateTotal(cart: Cart): number {
  const subtotal = calculateSubtotal(cart.items);
  const discount = calculateDiscount(subtotal, cart.couponCode);
  return Math.max(0, subtotal - discount);
}

export function addItem(cart: Cart, product: Product): Cart {
  if (cart.items.length >= MAX_CART_ITEMS) {
    throw new Error('Cart is full');
  }
  
  const existingIndex = cart.items.findIndex(
    (item) => item.productId === product.id
  );
  
  if (existingIndex >= 0) {
    const existing = cart.items[existingIndex];
    if (existing.quantity >= MAX_ITEM_QUANTITY) {
      throw new Error('Maximum quantity reached');
    }
    
    return {
      ...cart,
      items: cart.items.map((item, i) =>
        i === existingIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ),
    };
  }
  
  return {
    ...cart,
    items: [
      ...cart.items,
      {
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      },
    ],
  };
}

export function removeItem(cart: Cart, itemId: string): Cart {
  return {
    ...cart,
    items: cart.items.filter((item) => item.id !== itemId),
  };
}

export function updateQuantity(
  cart: Cart,
  itemId: string,
  quantity: number
): Cart {
  if (quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
    throw new Error(`Quantity must be between 1 and ${MAX_ITEM_QUANTITY}`);
  }
  
  return {
    ...cart,
    items: cart.items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    ),
  };
}

export function applyCoupon(cart: Cart, code: string): Cart {
  return { ...cart, couponCode: code };
}

export function isValidCoupon(code: string): boolean {
  const validCoupons = ['SAVE10', 'SAVE20', 'HALF'];
  return validCoupons.includes(code.toUpperCase());
}
```

```tsx
// domain/cart/cart.test.ts
// Fast, pure unit tests - no mocking needed

import { describe, it, expect } from 'vitest';
import {
  calculateSubtotal,
  calculateDiscount,
  calculateTotal,
  addItem,
  removeItem,
  updateQuantity,
  isValidCoupon,
  MAX_CART_ITEMS,
  MAX_ITEM_QUANTITY,
} from './cart';

describe('Cart Domain', () => {
  describe('calculateSubtotal', () => {
    it('returns 0 for empty cart', () => {
      expect(calculateSubtotal([])).toBe(0);
    });

    it('calculates sum of price * quantity', () => {
      const items = [
        { id: '1', productId: 'p1', name: 'A', price: 10, quantity: 2 },
        { id: '2', productId: 'p2', name: 'B', price: 15, quantity: 3 },
      ];
      expect(calculateSubtotal(items)).toBe(10 * 2 + 15 * 3); // 65
    });
  });

  describe('calculateDiscount', () => {
    it('returns 0 when no coupon', () => {
      expect(calculateDiscount(100, null)).toBe(0);
    });

    it('applies 10% for SAVE10', () => {
      expect(calculateDiscount(100, 'SAVE10')).toBe(10);
    });

    it('applies 20% for SAVE20', () => {
      expect(calculateDiscount(100, 'SAVE20')).toBe(20);
    });

    it('is case insensitive', () => {
      expect(calculateDiscount(100, 'save10')).toBe(10);
    });

    it('returns 0 for invalid coupon', () => {
      expect(calculateDiscount(100, 'INVALID')).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    it('subtracts discount from subtotal', () => {
      const cart = {
        items: [{ id: '1', productId: 'p1', name: 'A', price: 100, quantity: 1 }],
        couponCode: 'SAVE20',
      };
      expect(calculateTotal(cart)).toBe(80);
    });

    it('never goes below 0', () => {
      const cart = {
        items: [{ id: '1', productId: 'p1', name: 'A', price: 10, quantity: 1 }],
        couponCode: 'HALF',
      };
      expect(calculateTotal(cart)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('addItem', () => {
    const emptyCart = { items: [], couponCode: null };
    const product = { id: 'p1', name: 'Widget', price: 25 };

    it('adds new item with quantity 1', () => {
      const result = addItem(emptyCart, product);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(1);
      expect(result.items[0].productId).toBe('p1');
    });

    it('increments quantity for existing item', () => {
      const cartWithItem = addItem(emptyCart, product);
      const result = addItem(cartWithItem, product);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(2);
    });

    it('throws when cart is full', () => {
      const fullCart = {
        items: Array(MAX_CART_ITEMS).fill({
          id: '1',
          productId: 'p1',
          name: 'X',
          price: 1,
          quantity: 1,
        }),
        couponCode: null,
      };
      expect(() => addItem(fullCart, product)).toThrow('Cart is full');
    });

    it('throws when max quantity reached', () => {
      const cart = {
        items: [{
          id: '1',
          productId: 'p1',
          name: 'Widget',
          price: 25,
          quantity: MAX_ITEM_QUANTITY,
        }],
        couponCode: null,
      };
      expect(() => addItem(cart, product)).toThrow('Maximum quantity');
    });
  });

  describe('updateQuantity', () => {
    const cart = {
      items: [{ id: '1', productId: 'p1', name: 'A', price: 10, quantity: 5 }],
      couponCode: null,
    };

    it('updates quantity for matching item', () => {
      const result = updateQuantity(cart, '1', 10);
      expect(result.items[0].quantity).toBe(10);
    });

    it('throws for quantity < 1', () => {
      expect(() => updateQuantity(cart, '1', 0)).toThrow();
    });

    it('throws for quantity > MAX', () => {
      expect(() => updateQuantity(cart, '1', MAX_ITEM_QUANTITY + 1)).toThrow();
    });
  });

  describe('isValidCoupon', () => {
    it('returns true for valid coupons', () => {
      expect(isValidCoupon('SAVE10')).toBe(true);
      expect(isValidCoupon('SAVE20')).toBe(true);
      expect(isValidCoupon('HALF')).toBe(true);
    });

    it('returns false for invalid coupons', () => {
      expect(isValidCoupon('FAKE')).toBe(false);
      expect(isValidCoupon('')).toBe(false);
    });
  });
});
```

---

## The Testing Strategy

### What to Test Where

| Layer | What to Test | Tools | Speed |
|-------|--------------|-------|-------|
| **Domain** | Business rules, calculations, validations | Vitest/Jest | ⚡ Very Fast |
| **Stores** | State transitions, actions | Vitest | 🚀 Fast |
| **Hooks** | Hook behavior, side effects | Testing Library | 🏃 Medium |
| **Components** | User interactions, rendering | Testing Library | 🏃 Medium |
| **E2E** | Full user flows | Playwright | 🐢 Slow |

### Testing Priority

```
┌─────────────────────────────────────────────────────────────────┐
│                     TESTING PRIORITY                            │
│                                                                 │
│   1. Domain Logic (MUST TEST)                                  │
│      • All business rules                                       │
│      • Calculations                                             │
│      • Validations                                              │
│                                                                 │
│   2. Store/State Logic (SHOULD TEST)                           │
│      • State transitions                                        │
│      • Action side effects                                      │
│      • Derived state                                            │
│                                                                 │
│   3. Integration Points (SHOULD TEST)                          │
│      • API calls                                                │
│      • External service integration                             │
│                                                                 │
│   4. Component Behavior (CAN TEST)                             │
│      • Critical user flows                                      │
│      • Complex interactions                                     │
│      • Accessibility                                            │
│                                                                 │
│   5. E2E Critical Paths (MUST TEST)                            │
│      • Checkout flow                                            │
│      • Authentication                                           │
│      • Core features                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Pure Business Logic

### Pattern: Extract → Test → Import

```tsx
// 1. EXTRACT: Put logic in pure functions
// domain/pricing.ts
export function calculateShipping(
  subtotal: number,
  country: string,
  isExpress: boolean
): number {
  const baseRate = country === 'US' ? 5 : 15;
  const expressMultiplier = isExpress ? 2.5 : 1;
  const freeShippingThreshold = 100;
  
  if (subtotal >= freeShippingThreshold && !isExpress) {
    return 0;
  }
  
  return baseRate * expressMultiplier;
}

// 2. TEST: Pure unit tests
// domain/pricing.test.ts
describe('calculateShipping', () => {
  it('returns $5 base for US', () => {
    expect(calculateShipping(50, 'US', false)).toBe(5);
  });

  it('returns $15 base for international', () => {
    expect(calculateShipping(50, 'UK', false)).toBe(15);
  });

  it('returns free for US orders over $100', () => {
    expect(calculateShipping(150, 'US', false)).toBe(0);
  });

  it('multiplies by 2.5 for express', () => {
    expect(calculateShipping(50, 'US', true)).toBe(12.5);
  });

  it('charges express even over threshold', () => {
    expect(calculateShipping(150, 'US', true)).toBe(12.5);
  });
});

// 3. IMPORT: Use in your store/component
// stores/useCheckoutStore.ts
import { calculateShipping } from '@/domain/pricing';

const useCheckoutStore = create((set, get) => ({
  country: 'US',
  isExpress: false,
  
  getShippingCost: () => {
    const { country, isExpress } = get();
    const subtotal = useCartStore.getState().getSubtotal();
    return calculateShipping(subtotal, country, isExpress);
  },
}));
```

### Testing Validation Logic

```tsx
// domain/validation.ts
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
  } else if (!email.includes('@')) {
    errors.push('Invalid email format');
  } else if (email.length > 254) {
    errors.push('Email too long');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateCreditCard(number: string): ValidationResult {
  const errors: string[] = [];
  const cleaned = number.replace(/\s/g, '');
  
  if (!/^\d{13,19}$/.test(cleaned)) {
    errors.push('Invalid card number');
  } else if (!luhnCheck(cleaned)) {
    errors.push('Card number failed validation');
  }
  
  return { valid: errors.length === 0, errors };
}

function luhnCheck(num: string): boolean {
  let sum = 0;
  let isEven = false;
  
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}
```

```tsx
// domain/validation.test.ts
describe('validateEmail', () => {
  it('fails for empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('fails for email without @', () => {
    const result = validateEmail('invalid-email');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('passes for valid email', () => {
    const result = validateEmail('user@example.com');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('validatePassword', () => {
  it('requires minimum length', () => {
    const result = validatePassword('Abc1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('requires uppercase letter', () => {
    const result = validatePassword('abcd1234');
    expect(result.errors).toContain('Password must contain an uppercase letter');
  });

  it('passes for strong password', () => {
    const result = validatePassword('SecurePass123');
    expect(result.valid).toBe(true);
  });
});

describe('validateCreditCard', () => {
  it('validates real card numbers (Luhn)', () => {
    // Test card number
    expect(validateCreditCard('4532015112830366').valid).toBe(true);
  });

  it('fails for invalid card numbers', () => {
    expect(validateCreditCard('1234567890123456').valid).toBe(false);
  });

  it('handles spaces in card number', () => {
    expect(validateCreditCard('4532 0151 1283 0366').valid).toBe(true);
  });
});
```

---

## Testing with State Management

### Testing Zustand Stores

```tsx
// stores/useCartStore.ts
import { create } from 'zustand';
import { Cart, addItem, removeItem, calculateTotal } from '@/domain/cart';

interface CartStore {
  cart: Cart;
  addItem: (product: Product) => void;
  removeItem: (itemId: string) => void;
  getTotal: () => number;
  clear: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: { items: [], couponCode: null },
  
  addItem: (product) => {
    set((state) => ({
      cart: addItem(state.cart, product),
    }));
  },
  
  removeItem: (itemId) => {
    set((state) => ({
      cart: removeItem(state.cart, itemId),
    }));
  },
  
  getTotal: () => calculateTotal(get().cart),
  
  clear: () => set({ cart: { items: [], couponCode: null } }),
}));
```

```tsx
// stores/useCartStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './useCartStore';

describe('useCartStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useCartStore.setState({ cart: { items: [], couponCode: null } });
  });

  it('starts with empty cart', () => {
    const { cart } = useCartStore.getState();
    expect(cart.items).toHaveLength(0);
  });

  it('adds item to cart', () => {
    const { addItem } = useCartStore.getState();
    
    addItem({ id: 'p1', name: 'Widget', price: 25 });
    
    const { cart } = useCartStore.getState();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('p1');
    expect(cart.items[0].quantity).toBe(1);
  });

  it('increments quantity for duplicate items', () => {
    const { addItem } = useCartStore.getState();
    const product = { id: 'p1', name: 'Widget', price: 25 };
    
    addItem(product);
    addItem(product);
    
    const { cart } = useCartStore.getState();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
  });

  it('removes item from cart', () => {
    const { addItem, removeItem, cart } = useCartStore.getState();
    
    addItem({ id: 'p1', name: 'Widget', price: 25 });
    const itemId = useCartStore.getState().cart.items[0].id;
    
    removeItem(itemId);
    
    expect(useCartStore.getState().cart.items).toHaveLength(0);
  });

  it('calculates total correctly', () => {
    const { addItem, getTotal } = useCartStore.getState();
    
    addItem({ id: 'p1', name: 'Widget', price: 10 });
    addItem({ id: 'p2', name: 'Gadget', price: 20 });
    
    expect(getTotal()).toBe(30);
  });

  it('clears cart', () => {
    const { addItem, clear } = useCartStore.getState();
    
    addItem({ id: 'p1', name: 'Widget', price: 25 });
    clear();
    
    expect(useCartStore.getState().cart.items).toHaveLength(0);
  });
});
```

### Testing Redux Toolkit Stores

```tsx
// stores/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Cart, addItem, removeItem, calculateTotal } from '@/domain/cart';

const initialState: Cart = { items: [], couponCode: null };

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addProduct: (state, action: PayloadAction<Product>) => {
      return addItem(state, action.payload);
    },
    removeProduct: (state, action: PayloadAction<string>) => {
      return removeItem(state, action.payload);
    },
    applyCoupon: (state, action: PayloadAction<string>) => {
      state.couponCode = action.payload;
    },
    clearCart: () => initialState,
  },
});

export const { addProduct, removeProduct, applyCoupon, clearCart } = cartSlice.actions;

// Selectors
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartTotal = (state: RootState) => calculateTotal(state.cart);
```

```tsx
// stores/cartSlice.test.ts
import { describe, it, expect } from 'vitest';
import cartReducer, {
  addProduct,
  removeProduct,
  applyCoupon,
  clearCart,
} from './cartSlice';

describe('cartSlice', () => {
  const initialState = { items: [], couponCode: null };

  it('should handle initial state', () => {
    expect(cartReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle addProduct', () => {
    const product = { id: 'p1', name: 'Widget', price: 25 };
    const actual = cartReducer(initialState, addProduct(product));
    
    expect(actual.items).toHaveLength(1);
    expect(actual.items[0].productId).toBe('p1');
  });

  it('should handle removeProduct', () => {
    const stateWithItem = {
      items: [{ id: 'item1', productId: 'p1', name: 'Widget', price: 25, quantity: 1 }],
      couponCode: null,
    };
    
    const actual = cartReducer(stateWithItem, removeProduct('item1'));
    expect(actual.items).toHaveLength(0);
  });

  it('should handle applyCoupon', () => {
    const actual = cartReducer(initialState, applyCoupon('SAVE20'));
    expect(actual.couponCode).toBe('SAVE20');
  });

  it('should handle clearCart', () => {
    const stateWithItems = {
      items: [{ id: '1', productId: 'p1', name: 'X', price: 10, quantity: 1 }],
      couponCode: 'SAVE20',
    };
    
    const actual = cartReducer(stateWithItems, clearCart());
    expect(actual).toEqual(initialState);
  });
});
```

### Testing with Redux Store

```tsx
// stores/store.test.ts
import { configureStore } from '@reduxjs/toolkit';
import cartReducer, { addProduct, selectCartTotal } from './cartSlice';

describe('Redux Store Integration', () => {
  function createTestStore() {
    return configureStore({
      reducer: { cart: cartReducer },
    });
  }

  it('calculates cart total through selector', () => {
    const store = createTestStore();
    
    store.dispatch(addProduct({ id: 'p1', name: 'A', price: 10 }));
    store.dispatch(addProduct({ id: 'p2', name: 'B', price: 20 }));
    
    const total = selectCartTotal(store.getState());
    expect(total).toBe(30);
  });
});
```

### Testing Jotai Atoms

```tsx
// atoms/cart.ts
import { atom } from 'jotai';
import { Cart, addItem, calculateTotal } from '@/domain/cart';

export const cartAtom = atom<Cart>({ items: [], couponCode: null });

export const cartTotalAtom = atom((get) => calculateTotal(get(cartAtom)));

export const addItemAtom = atom(null, (get, set, product: Product) => {
  const cart = get(cartAtom);
  set(cartAtom, addItem(cart, product));
});
```

```tsx
// atoms/cart.test.ts
import { describe, it, expect } from 'vitest';
import { createStore } from 'jotai';
import { cartAtom, cartTotalAtom, addItemAtom } from './cart';

describe('Cart Atoms', () => {
  it('starts with empty cart', () => {
    const store = createStore();
    const cart = store.get(cartAtom);
    expect(cart.items).toHaveLength(0);
  });

  it('adds item via addItemAtom', () => {
    const store = createStore();
    
    store.set(addItemAtom, { id: 'p1', name: 'Widget', price: 25 });
    
    const cart = store.get(cartAtom);
    expect(cart.items).toHaveLength(1);
  });

  it('calculates total via derived atom', () => {
    const store = createStore();
    
    store.set(addItemAtom, { id: 'p1', name: 'Widget', price: 10 });
    store.set(addItemAtom, { id: 'p2', name: 'Gadget', price: 20 });
    
    const total = store.get(cartTotalAtom);
    expect(total).toBe(30);
  });
});
```

### Testing TanStack Query

```tsx
// queries/useUsers.test.tsx
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useUsers, useCreateUser } from './useUsers';

// Mock API with MSW
const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' },
    ]);
  }),
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: '3', ...body });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Wrapper for React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useUsers', () => {
  it('fetches users successfully', async () => {
    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].name).toBe('Alice');
  });

  it('handles error state', async () => {
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateUser', () => {
  it('creates user and returns data', async () => {
    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: 'Charlie', email: 'charlie@example.com' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.id).toBe('3');
    expect(result.current.data.name).toBe('Charlie');
  });
});
```

### Testing React Context

```tsx
// contexts/AuthContext.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

// Test component that uses the context
function TestComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      <span data-testid="auth-status">
        {isAuthenticated ? `Logged in as ${user?.name}` : 'Not logged in'}
      </span>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Mock fetch
global.fetch = vi.fn();

describe('AuthContext', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('provides unauthenticated state initially', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not logged in');
    });
  });

  it('logs in user', async () => {
    const user = userEvent.setup();
    
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: false } as Response) // Initial check
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', name: 'John', email: 'john@example.com' }),
      } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged in as John');
    });
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<TestComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    
    spy.mockRestore();
  });
});
```

---

## Integration Testing

### Testing Components with State

```tsx
// components/Cart.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/useCartStore';
import { Cart } from './Cart';

describe('Cart Component', () => {
  beforeEach(() => {
    // Reset store
    useCartStore.setState({ cart: { items: [], couponCode: null } });
  });

  it('shows empty state when cart is empty', () => {
    render(<Cart />);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('displays cart items', () => {
    // Pre-populate store
    useCartStore.getState().addItem({ id: 'p1', name: 'Widget', price: 25 });
    
    render(<Cart />);
    
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });

  it('removes item when clicking remove button', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem({ id: 'p1', name: 'Widget', price: 25 });
    
    render(<Cart />);
    
    await user.click(screen.getByRole('button', { name: /remove/i }));
    
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('updates total when quantity changes', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem({ id: 'p1', name: 'Widget', price: 10 });
    
    render(<Cart />);
    
    const quantityInput = screen.getByRole('spinbutton');
    await user.clear(quantityInput);
    await user.type(quantityInput, '5');
    
    expect(screen.getByTestId('cart-total')).toHaveTextContent('$50.00');
  });
});
```

### Testing Hooks

```tsx
// hooks/useCart.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from './useCart';
import { useCartStore } from '@/stores/useCartStore';

describe('useCart', () => {
  beforeEach(() => {
    useCartStore.setState({ cart: { items: [], couponCode: null } });
  });

  it('returns cart state', () => {
    const { result } = renderHook(() => useCart());
    
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ id: 'p1', name: 'Widget', price: 25 });
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(25);
  });

  it('calculates total with discount', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem({ id: 'p1', name: 'Widget', price: 100 });
      result.current.applyCoupon('SAVE20');
    });
    
    expect(result.current.total).toBe(80);
  });
});
```

### Full Integration Test Example

```tsx
// __tests__/checkout.integration.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useCartStore } from '@/stores/useCartStore';
import { CheckoutPage } from '@/pages/CheckoutPage';

const server = setupServer(
  http.post('/api/orders', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 'order-123',
      status: 'confirmed',
      total: body.total,
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Checkout Flow Integration', () => {
  beforeEach(() => {
    useCartStore.setState({ cart: { items: [], couponCode: null } });
  });

  it('completes checkout successfully', async () => {
    const user = userEvent.setup();
    
    // Add items to cart
    useCartStore.getState().addItem({ id: 'p1', name: 'Widget', price: 50 });
    useCartStore.getState().addItem({ id: 'p2', name: 'Gadget', price: 75 });
    
    renderWithProviders(<CheckoutPage />);
    
    // Verify cart summary
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('Gadget')).toBeInTheDocument();
    expect(screen.getByTestId('order-total')).toHaveTextContent('$125.00');
    
    // Fill shipping info
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/address/i), '123 Main St');
    
    // Submit order
    await user.click(screen.getByRole('button', { name: /place order/i }));
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
      expect(screen.getByText('order-123')).toBeInTheDocument();
    });
    
    // Cart should be cleared
    expect(useCartStore.getState().cart.items).toHaveLength(0);
  });

  it('shows validation errors for invalid input', async () => {
    const user = userEvent.setup();
    useCartStore.getState().addItem({ id: 'p1', name: 'Widget', price: 50 });
    
    renderWithProviders(<CheckoutPage />);
    
    // Submit without filling form
    await user.click(screen.getByRole('button', { name: /place order/i }));
    
    // Verify errors
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    
    server.use(
      http.post('/api/orders', () => {
        return HttpResponse.json(
          { message: 'Payment failed' },
          { status: 400 }
        );
      })
    );
    
    useCartStore.getState().addItem({ id: 'p1', name: 'Widget', price: 50 });
    
    renderWithProviders(<CheckoutPage />);
    
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/address/i), '123 Main St');
    await user.click(screen.getByRole('button', { name: /place order/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
    });
    
    // Cart should NOT be cleared on error
    expect(useCartStore.getState().cart.items).toHaveLength(1);
  });
});
```

---

## Best Practices

### 1. Test Behavior, Not Implementation

```tsx
// ❌ BAD: Testing implementation details
it('calls setItems with new array', () => {
  const setItems = vi.fn();
  // Testing internal implementation...
});

// ✅ GOOD: Testing behavior
it('adds item to cart', () => {
  addItem({ id: 'p1', name: 'Widget', price: 25 });
  expect(getCartItems()).toContainEqual(
    expect.objectContaining({ productId: 'p1' })
  );
});
```

### 2. Use Test Factories

```tsx
// test/factories.ts
export function createProduct(overrides?: Partial<Product>): Product {
  return {
    id: 'product-1',
    name: 'Test Product',
    price: 9.99,
    description: 'A test product',
    ...overrides,
  };
}

export function createCartItem(overrides?: Partial<CartItem>): CartItem {
  return {
    id: 'item-1',
    productId: 'product-1',
    name: 'Test Product',
    price: 9.99,
    quantity: 1,
    ...overrides,
  };
}

export function createCart(overrides?: Partial<Cart>): Cart {
  return {
    items: [],
    couponCode: null,
    ...overrides,
  };
}

// Usage in tests
it('calculates total for multiple items', () => {
  const cart = createCart({
    items: [
      createCartItem({ price: 10, quantity: 2 }),
      createCartItem({ id: 'item-2', price: 15, quantity: 1 }),
    ],
  });
  
  expect(calculateTotal(cart)).toBe(35);
});
```

### 3. Reset State Between Tests

```tsx
// For Zustand
beforeEach(() => {
  useCartStore.setState(initialState);
});

// For Redux
beforeEach(() => {
  store.dispatch(resetAction());
});

// For Jotai
const store = createStore();
beforeEach(() => {
  store.set(cartAtom, initialCart);
});
```

### 4. Mock External Dependencies

```tsx
// Mock API calls with MSW
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.get('/api/products', () => {
    return HttpResponse.json([
      { id: '1', name: 'Product 1', price: 10 },
    ]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 5. Test Edge Cases

```tsx
describe('calculateDiscount', () => {
  // Happy path
  it('applies discount correctly', () => { ... });
  
  // Edge cases
  it('handles zero subtotal', () => { ... });
  it('handles negative subtotal', () => { ... });
  it('handles null coupon', () => { ... });
  it('handles empty string coupon', () => { ... });
  it('handles very large numbers', () => { ... });
  it('handles floating point precision', () => {
    // 0.1 + 0.2 !== 0.3 in JavaScript!
    expect(calculateDiscount(0.30, 'HALF')).toBeCloseTo(0.15);
  });
});
```

### 6. Organize Tests by Feature

```
src/
├── domain/
│   └── cart/
│       ├── cart.ts
│       └── cart.test.ts       # Unit tests right next to code
├── stores/
│   └── useCartStore.ts
│   └── useCartStore.test.ts
└── __tests__/                  # Integration/E2E tests
    ├── checkout.integration.test.tsx
    └── cart.e2e.test.ts
```

### 7. Use Descriptive Test Names

```tsx
// ❌ BAD: Vague test names
it('works', () => { ... });
it('handles edge case', () => { ... });

// ✅ GOOD: Descriptive test names
it('adds new item with quantity 1 when product not in cart', () => { ... });
it('throws CartFullError when adding to cart with 50 items', () => { ... });
it('applies 20% discount for SAVE20 coupon code', () => { ... });
```

---

## Summary

### Testing by State Management Type

| State Management | What to Test | How to Test |
|------------------|--------------|-------------|
| **Pure Functions** | Business logic | Direct unit tests |
| **Zustand** | Store actions, state changes | `useStore.getState()` / `useStore.setState()` |
| **Redux** | Reducers, selectors, thunks | Import reducer, test with actions |
| **Jotai** | Atom values, derived atoms | `createStore()` from Jotai |
| **TanStack Query** | Query/mutation behavior | `renderHook` + MSW |
| **React Context** | Provider behavior | Render with wrapper |

### The Testing Mantra

1. **Extract** business logic to pure functions
2. **Test** pure functions with simple unit tests
3. **Import** tested logic into state management
4. **Integration test** the full flow sparingly

The more logic you extract from React, the easier testing becomes.
