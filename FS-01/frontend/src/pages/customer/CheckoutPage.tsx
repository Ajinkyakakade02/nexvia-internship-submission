import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Address } from '@/types';
import { orderService } from '@/services/orderService';
import { paymentService } from '@/services/paymentService';
import { openRazorpayCheckout } from '@/utils/razorpay';
import { CartSummary } from '@/components/cart/CartSummary';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MapPin, Plus, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const { items, total, emptyCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [isAddingAddress, setIsAddingAddress] = useState(addresses.length === 0);
  const [newAddress, setNewAddress] = useState<Address>({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [couponCode, setCouponCode] = useState<string | undefined>();
  const [discountAmount, setDiscountAmount] = useState(0);
  const [processingOrder, setProcessingOrder] = useState(false);

  useEffect(() => {
    if (user?.addresses) {
      setAddresses(user.addresses);
      if (user.addresses.length > 0) {
        setIsAddingAddress(false);
      }
    }
  }, [user]);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handlePlaceOrder = async () => {
    let finalAddress: Address;
    if (isAddingAddress || addresses.length === 0) {
      if (!newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
        toast.error('Please complete the delivery address');
        return;
      }
      finalAddress = newAddress;
    } else {
      finalAddress = addresses[selectedAddressIndex];
    }

    setProcessingOrder(true);
    try {
      // 1. Create order in backend
      const order = await orderService.createOrder({
        shippingAddress: finalAddress,
        couponCode,
      });

      // 2. Create Razorpay Payment Order
      const paymentOrder = await paymentService.createPaymentOrder(order._id);

      // 3. Open Razorpay Checkout modal
      await openRazorpayCheckout({
        orderId: paymentOrder.razorpayOrderId,
        amount: order.total,
        key: paymentOrder.keyId,
        name: 'NexMart Order',
        description: `Order #${order.orderNumber}`,
        prefill: {
          name: user?.name || finalAddress.fullName,
          email: user?.email || '',
          contact: finalAddress.phone,
        },
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              ...response,
              orderId: order._id,
            });
            await emptyCart();
            toast.success('Payment verified & Order Placed Successfully!');
            navigate(`/orders/${order._id}`);
          } catch (err: any) {
            toast.error('Payment verification failed');
          }
        },
        onDismiss: () => {
          toast('Payment window closed. You can retry from your orders page.');
          navigate(`/orders/${order._id}`);
        },
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setProcessingOrder(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        <p className="text-xs text-slate-500 mt-1">Complete your delivery address and payment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Address selection & Payment option */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-600" />
                Shipping Address
              </h3>
              {addresses.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  {isAddingAddress ? 'Choose Saved' : 'Add New Address'}
                </Button>
              )}
            </div>

            {/* Saved addresses radio list */}
            {!isAddingAddress && addresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedAddressIndex(idx)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAddressIndex === idx
                        ? 'border-primary-600 bg-primary-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm text-slate-900">{addr.fullName}</p>
                      {selectedAddressIndex === idx && (
                        <CheckCircle2 className="w-4 h-4 text-primary-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{addr.phone}</p>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                      {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* New address form */}
            {isAddingAddress && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Full Name"
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    required
                  />
                </div>
                <Input
                  label="Address Line"
                  placeholder="House/Flat No., Building, Street"
                  value={newAddress.addressLine1}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    required
                  />
                  <Input
                    label="State"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    required
                  />
                  <Input
                    label="Pincode"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Method section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Payment Method
            </h3>
            <div className="p-4 rounded-xl border-2 border-primary-600 bg-primary-50/20 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Razorpay Secure Checkout</p>
                <p className="text-xs text-slate-500 mt-0.5">UPI, Credit/Debit Cards, NetBanking, Wallets</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                100% Secure
              </span>
            </div>
          </div>
        </div>

        {/* Right: Summary & Pay Button */}
        <div className="lg:col-span-1">
          <CartSummary
            subtotal={total}
            discount={discountAmount}
            shipping={total > 500 ? 0 : 50}
            isCheckoutPage
            onApplyCoupon={(disc, code) => {
              setDiscountAmount(disc);
              setCouponCode(code);
            }}
            onCheckout={handlePlaceOrder}
          />
          <div className="mt-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handlePlaceOrder}
              isLoading={processingOrder}
            >
              Pay with Razorpay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CheckoutPage;
