import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { Category, ProductFormData, ProductStatus } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export const VendorProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    defaultValues: {
      status: ProductStatus.ACTIVE,
      images: [],
    },
  });

  useEffect(() => {
    const init = async () => {
      try {
        const cats = await categoryService.getCategories();
        setCategories(cats);

        if (id) {
          const product = await productService.getProductById(id);
          reset({
            name: product.name,
            description: product.description,
            price: product.price,
            comparePrice: product.comparePrice,
            stock: product.stock,
            category: typeof product.category === 'object' ? product.category._id : product.category,
            status: product.status,
            images: product.images || [],
          });
          setImages(product.images || []);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load form details');
      } finally {
        setFetching(false);
      }
    };
    init();
  }, [id, reset]);

  const onSubmit = async (data: ProductFormData) => {
    if (images.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    try {
      setLoading(true);
      const payload: ProductFormData = {
        ...data,
        price: Number(data.price),
        comparePrice: data.comparePrice ? Number(data.comparePrice) : undefined,
        stock: Number(data.stock),
        images,
      };

      if (isEditing && id) {
        await productService.updateProduct(id, payload);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(payload);
        toast.success('Product created successfully');
      }
      navigate('/vendor/products');
    } catch (err: any) {
      toast.error(err.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSuccess = (url: string) => {
    setImages((prev) => [...prev, url]);
  };

  const handleImageRemove = (url: string) => {
    setImages((prev) => prev.filter((item) => item !== url));
  };

  if (fetching) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" label="Loading product..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/vendor/products')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-sm text-slate-500">
            {isEditing ? 'Update the details for this product.' : 'Fill in the details to publish a new product.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Product Title"
              required
              placeholder="e.g. Wireless Noise Canceling Headphones"
              error={errors.name?.message}
              {...register('name', { required: 'Product title is required' })}
            />

            <Textarea
              label="Description"
              required
              rows={5}
              placeholder="Detailed description of features, specifications, and materials..."
              error={errors.description?.message}
              {...register('description', { required: 'Description is required' })}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Category"
                required
                options={categories.map((c) => ({ value: c._id, label: c.name }))}
                placeholder="Select category"
                error={errors.category?.message}
                {...register('category', { required: 'Category is required' })}
              />

              <Select
                label="Status"
                required
                options={[
                  { value: ProductStatus.ACTIVE, label: 'Active (Visible in store)' },
                  { value: ProductStatus.DRAFT, label: 'Draft (Hidden from store)' },
                  { value: ProductStatus.INACTIVE, label: 'Inactive' },
                ]}
                error={errors.status?.message}
                {...register('status', { required: 'Status is required' })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Selling Price (₹)"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              error={errors.price?.message}
              {...register('price', {
                required: 'Price is required',
                min: { value: 1, message: 'Price must be positive' },
              })}
            />

            <Input
              label="Compare Price / MRP (₹)"
              type="number"
              step="0.01"
              placeholder="0.00 (optional)"
              error={errors.comparePrice?.message}
              {...register('comparePrice')}
            />

            <Input
              label="Available Stock"
              type="number"
              required
              placeholder="0"
              error={errors.stock?.message}
              {...register('stock', {
                required: 'Stock quantity is required',
                min: { value: 0, message: 'Stock cannot be negative' },
              })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Media</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              existingUrls={images}
              onUploadSuccess={handleImageSuccess}
              onRemove={handleImageRemove}
              maxFiles={5}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/vendor/products')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={loading || isSubmitting}
          >
            {isEditing ? 'Save Changes' : 'Publish Product'}
          </Button>
        </div>
      </form>
    </div>
  );
};

