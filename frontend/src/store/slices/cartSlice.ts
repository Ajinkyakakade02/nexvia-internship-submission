import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Cart, CartItem } from '@/types';
import { cartService } from '@/services/cartService';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  error: null,
};

const calculateTotals = (items: CartItem[]) => {
  const total = items.reduce((acc, item) => {
    const price = item.product?.price || item.priceAtAdd || 0;
    return acc + price * item.quantity;
  }, 0);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  return { total, itemCount };
};

export const fetchCart = createAsyncThunk<Cart, void, { rejectValue: string }>(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      return await cartService.getCart();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk<Cart, { productId: string; quantity?: number }, { rejectValue: string }>(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      return await cartService.addToCart(productId, quantity);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add item to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk<Cart, { productId: string; quantity: number }, { rejectValue: string }>(
  'cart/updateCartItem',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      return await cartService.updateCartItem(productId, quantity);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update item quantity');
    }
  }
);

export const removeCartItem = createAsyncThunk<Cart, string, { rejectValue: string }>(
  'cart/removeCartItem',
  async (productId, { rejectWithValue }) => {
    try {
      return await cartService.removeCartItem(productId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove item from cart');
    }
  }
);

export const clearCart = createAsyncThunk<void, void, { rejectValue: string }>(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await cartService.clearCart();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to clear cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const handleFulfilled = (state: CartState, action: { payload: Cart }) => {
      state.loading = false;
      state.items = action.payload?.items || [];
      const { total, itemCount } = calculateTotals(state.items);
      state.total = total;
      state.itemCount = itemCount;
    };

    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, handleFulfilled)
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToCart.fulfilled, handleFulfilled)
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || null;
      })
      // Update item
      .addCase(updateCartItem.fulfilled, handleFulfilled)
      // Remove item
      .addCase(removeCartItem.fulfilled, handleFulfilled)
      // Clear cart
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.total = 0;
        state.itemCount = 0;
      });
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
