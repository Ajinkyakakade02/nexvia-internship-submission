import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Headphones, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Product, Category } from '@/types';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, feat, trend] = await Promise.all([
          categoryService.getCategories(),
          productService.getFeaturedProducts(),
          productService.getTrendingProducts(),
        ]);
        setCategories(cats.slice(0, 6));
        setFeaturedProducts(feat.slice(0, 8));
        setTrendingProducts(trend.slice(0, 4));
      } catch (err) {
        console.error('Home page fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-900 via-primary-800 to-slate-900 text-white py-20 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-primary-200 border border-white/10 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              One marketplace. Endless possibilities.
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Discover Quality Products from <span className="text-primary-400">Trusted Vendors</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300">
              A unified marketplace for customers, vendors, and growing businesses.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/products">
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore Marketplace
                </Button>
              </Link>
              <Link to="/register?role=vendor">
                <Button size="lg" variant="secondary">
                  Become a Seller
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Swift Delivery</h4>
              <p className="text-xs text-slate-500">Fast dispatch nationwide</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Verified Vendors</h4>
              <p className="text-xs text-slate-500">100% authentic sellers</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Easy Returns</h4>
              <p className="text-xs text-slate-500">Hassle-free 7-day policy</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Dedicated Support</h4>
              <p className="text-xs text-slate-500">24/7 client resolution</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Categories</h2>
            <p className="text-sm text-slate-500">Explore items across popular departments</p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/products?category=${cat.slug}`}
              className="group p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-primary-500 hover:shadow-sm text-center transition-all flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-primary-50 flex items-center justify-center text-primary-600 mb-3 transition-colors">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-xs font-semibold text-slate-800 group-hover:text-primary-600 truncate w-full">
                {cat.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{cat.productCount || 0} items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Featured Products</h2>
            <p className="text-sm text-slate-500">Hand-picked top products from our sellers</p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            See More
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featuredProducts.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-primary-600 to-indigo-700 p-8 sm:p-12 text-white relative overflow-hidden shadow-lg">
          <div className="max-w-lg space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
              Special Launch Offer
            </span>
            <h3 className="text-3xl font-extrabold">Sell to Millions Across India</h3>
            <p className="text-sm text-primary-100">
              Join NexMart vendor network with 0% listing fee and fair transparent commission. Start selling in minutes.
            </p>
            <Link to="/register?role=vendor">
              <Button size="md" variant="secondary" className="mt-2">
                Open Vendor Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Trending Now</h2>
              <p className="text-sm text-slate-500">Products shoppers are loving this week</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {trendingProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
export default HomePage;
