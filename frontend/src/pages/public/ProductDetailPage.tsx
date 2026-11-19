import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { productService } from '@/services/productService';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { ProductReviews } from '@/components/products/ProductReviews';
import { StarRating } from '@/components/ui/StarRating';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Zap, Store, ShieldCheck, Truck, RotateCcw, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'vendor'>('description');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      productService
        .getProductById(id)
        .then(setProduct)
        .catch(() => toast.error('Product not found'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading product..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-sm text-slate-500">The product you are looking for does not exist or has been removed.</p>
        <Link to="/products">
          <Button variant="primary">Back to Products</Button>
        </Link>
      </div>
    );
  }

  const vendor = typeof product.vendor === 'object' && product.vendor !== null ? product.vendor : null;
  const vendorName = vendor ? vendor.businessName : 'Verified Vendor';

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addItem(product._id, quantity);
      toast.success(`Added ${quantity} of ${product.name} to cart`);
    } catch {
      toast.error('Failed to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      await addItem(product._id, quantity);
      navigate('/checkout');
    } catch {
      toast.error('Failed to proceed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-400 flex items-center gap-2">
        <Link to="/" className="hover:text-slate-700">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-slate-700">Products</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main product presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Gallery */}
        <div>
          <ProductImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Right: Info & Buying */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Store className="w-3.5 h-3.5 text-primary-600" />
              <span>Sold by <strong className="text-slate-800">{vendorName}</strong></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{product.name}</h1>
            <div className="mt-3 flex items-center gap-3">
              <StarRating rating={product.avgRating || 0} size="md" showText totalReviews={product.ratingCount || 0} />
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold text-slate-500">{product.soldCount || 0} Sold</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <PriceDisplay price={product.price} comparePrice={product.comparePrice} size="xl" />
            <p className="text-xs text-slate-400 mt-1">Inclusive of all local taxes</p>
          </div>

          {/* Stock state */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Availability</p>
            {product.stock > 0 ? (
              <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                In Stock ({product.stock} units available)
              </p>
            ) : (
              <p className="text-sm font-semibold text-rose-600">Currently Out of Stock</p>
            )}
          </div>

          {/* Quantity selector */}
          {product.stock > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Quantity
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl w-32 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 hover:bg-slate-100 text-slate-600 rounded-l-xl transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center font-bold text-slate-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="p-2 hover:bg-slate-100 text-slate-600 rounded-r-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              size="lg"
              variant="outline"
              disabled={product.stock <= 0 || adding}
              isLoading={adding}
              onClick={handleAddToCart}
              leftIcon={<ShoppingCart className="w-5 h-5" />}
              className="flex-1"
            >
              Add to Cart
            </Button>
            <Button
              size="lg"
              variant="primary"
              disabled={product.stock <= 0}
              onClick={handleBuyNow}
              leftIcon={<Zap className="w-5 h-5" />}
              className="flex-1"
            >
              Buy Now
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <Truck className="w-5 h-5 text-primary-600 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-700">Quick Delivery</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-primary-600 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-700">Buyer Protection</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <RotateCcw className="w-5 h-5 text-primary-600 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-700">7-Day Return</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Reviews, Vendor */}
      <div className="pt-8">
        <div className="border-b border-slate-200 flex gap-6">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'description'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'reviews'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Reviews ({product.ratingCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'vendor'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Vendor Information
          </button>
        </div>

        <div className="pt-6">
          {activeTab === 'description' && (
            <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          )}

          {activeTab === 'reviews' && <ProductReviews productId={product._id} />}

          {activeTab === 'vendor' && (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 max-w-xl">
              <h4 className="text-base font-bold text-slate-900">{vendorName}</h4>
              <p className="text-sm text-slate-600">{vendor?.businessDescription || 'Verified marketplace merchant'}</p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>Email: {vendor?.businessEmail || 'N/A'}</p>
                <p>Location: {vendor?.businessAddress || 'India'}</p>
                {vendor?.gstNumber && <p>GSTIN: {vendor.gstNumber}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ProductDetailPage;
