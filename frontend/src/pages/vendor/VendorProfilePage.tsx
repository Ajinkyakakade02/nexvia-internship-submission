import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { vendorService } from '@/services/vendorService';
import { OnboardingStatus, VendorProfile } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export const VendorProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Partial<VendorProfile>>();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await vendorService.getProfile();
        setProfile(data);
        reset({
          businessName: data.businessName,
          businessDescription: data.businessDescription,
          businessEmail: data.businessEmail,
          businessPhone: data.businessPhone,
          businessAddress: data.businessAddress,
          gstNumber: data.gstNumber,
        });
      } catch (err: any) {
        toast.error(err.message || 'Failed to fetch vendor profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: Partial<VendorProfile>) => {
    try {
      const updated = await vendorService.updateProfile(data);
      setProfile(updated);
      toast.success('Business profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" label="Loading vendor profile..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Profile</h1>
        <p className="text-sm text-slate-500">Manage your store details and business credentials.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Onboarding Status</CardTitle>
            <StatusBadge status={profile?.onboardingStatus || OnboardingStatus.PENDING} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600">
            {profile?.onboardingStatus === OnboardingStatus.APPROVED && (
              <p className="text-emerald-700">
                Your account is active and verified. Your products are eligible to appear in the marketplace search and catalog.
              </p>
            )}
            {profile?.onboardingStatus === OnboardingStatus.PENDING && (
              <p className="text-amber-700">
                Your vendor application is currently undergoing admin review. Product visibility may be limited until approved.
              </p>
            )}
            {profile?.onboardingStatus === OnboardingStatus.REJECTED && (
              <p className="text-rose-700">
                Your application was declined. Reason:{' '}
                <span className="font-semibold">{profile.adminNotes || 'Contact support for details.'}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Business Name"
              required
              {...register('businessName', { required: true })}
            />

            <Textarea
              label="Business Description"
              rows={3}
              {...register('businessDescription')}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Business Contact Email"
                type="email"
                required
                {...register('businessEmail', { required: true })}
              />

              <Input
                label="Business Phone"
                required
                {...register('businessPhone', { required: true })}
              />
            </div>

            <Textarea
              label="Registered Business Address"
              rows={3}
              required
              {...register('businessAddress', { required: true })}
            />

            <Input
              label="GST Identification Number (GSTIN)"
              placeholder="e.g. 22AAAAA0000A1Z5"
              {...register('gstNumber')}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isSubmitting}>
                Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

