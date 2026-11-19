import React from 'react';
import { Category, ProductFilters as FilterType } from '@/types';
import { Star } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ProductFiltersProps {
  categories: Category[];
  filters: FilterType;
  onChange: (filters: Partial<FilterType>) => void;
  onReset: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  filters,
  onChange,
  onReset,
}) => {
  return (
    <div className="space-y-6 bg-white p-5 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900 text-sm">Filters</h3>
        <button
          onClick={onReset}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          Reset All
        </button>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Categories
        </h4>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <label key={cat._id} className="flex items-center gap-2.5 text-sm text-slate-600 hover:text-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.category === cat.slug || filters.category === cat._id}
                onChange={(e) => {
                  onChange({ category: e.target.checked ? cat.slug : undefined });
                }}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
              />
              <span className="truncate">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Price Range (₹)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice ?? ''}
            onChange={(e) =>
              onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ?? ''}
            onChange={(e) =>
              onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Customer Rating
        </h4>
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange({ rating: filters.rating === rating ? undefined : rating })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                filters.rating === rating
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1">& above</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* In Stock toggle */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked ? true : undefined })}
            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </div>
  );
};
