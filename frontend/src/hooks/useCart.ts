import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { fetchCart, addToCart, updateCartItem, removeCartItem, clearCart } from '@/store/slices/cartSlice';
import { useCallback } from 'react';

export const useCart = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, total, itemCount, loading, error } = useSelector((state: RootState) => state.cart);

  const loadCart = useCallback(() => dispatch(fetchCart()), [dispatch]);

  const addItem = useCallback(
    (productId: string, quantity = 1) => dispatch(addToCart({ productId, quantity })),
    [dispatch]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => dispatch(updateCartItem({ productId, quantity })),
    [dispatch]
  );

  const removeItem = useCallback(
    (productId: string) => dispatch(removeCartItem(productId)),
    [dispatch]
  );

  const emptyCart = useCallback(() => dispatch(clearCart()), [dispatch]);

  return {
    items,
    total,
    itemCount,
    loading,
    error,
    loadCart,
    addItem,
    updateQuantity,
    removeItem,
    emptyCart,
  };
};
