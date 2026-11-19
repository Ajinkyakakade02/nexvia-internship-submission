import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerSchema } from '@/utils/validators';
import { RegisterFormData, UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, User as UserIcon, Phone, Store } from 'lucide-react';
import toast from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'vendor' ? UserRole.VENDOR : UserRole.CUSTOMER;
  const [role, setRole] = useState<UserRole>(initialRole);

  const { register: registerAuth, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: initialRole,
    },
  });

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setValue('role', selectedRole);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const res = await registerAuth(data).unwrap();
      toast.success('Registration successful!');
      if (res.user.role === UserRole.VENDOR) {
        navigate('/vendor/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err || 'Registration failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create an account</h2>
        <p className="text-sm text-slate-500 mt-1">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => handleRoleChange(UserRole.CUSTOMER)}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${
            role === UserRole.CUSTOMER
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Customer
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange(UserRole.VENDOR)}
          className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            role === UserRole.VENDOR
              ? 'bg-white text-primary-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          Vendor (Seller)
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. Rahul Sharma"
          leftIcon={<UserIcon className="w-4 h-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="rahul@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="9876543210"
          leftIcon={<Phone className="w-4 h-4" />}
          error={errors.phone?.message}
          {...register('phone')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        {/* Vendor Onboarding Fields */}
        {role === UserRole.VENDOR && (
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Vendor Business Information</h3>

            <Input
              label="Business / Store Name"
              placeholder="e.g. Apex Electronics Store"
              error={errors.businessName?.message}
              {...register('businessName')}
            />

            <Textarea
              label="Business Description"
              rows={2}
              placeholder="Tell us what you sell..."
              error={errors.businessDescription?.message}
              {...register('businessDescription')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Business Email"
                type="email"
                placeholder="sales@store.com"
                error={errors.businessEmail?.message}
                {...register('businessEmail')}
              />
              <Input
                label="GST Number (Optional)"
                placeholder="22AAAAA0000A1Z5"
                error={errors.gstNumber?.message}
                {...register('gstNumber')}
              />
            </div>

            <Input
              label="Business Address"
              placeholder="Street, City, State, PIN"
              error={errors.businessAddress?.message}
              {...register('businessAddress')}
            />
          </div>
        )}

        <Button type="submit" variant="primary" size="md" className="w-full mt-4" isLoading={loading}>
          {role === UserRole.VENDOR ? 'Apply as Vendor' : 'Create Account'}
        </Button>
      </form>
    </div>
  );
};
export default RegisterPage;
