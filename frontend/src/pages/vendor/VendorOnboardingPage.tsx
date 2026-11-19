import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { vendorService } from '@/services/vendorService';
import { OnboardingStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

const vendorOnboardingSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  businessDescription: z.string().min(10, 'Please provide a detailed description (min 10 characters)'),
  businessEmail: z.string().email('Valid business email is required'),
  businessPhone: z.string().min(8, 'Valid contact number is required'),
  businessAddress: z.string().min(5, 'Physical business address is required'),
  gstNumber: z.string().optional()
});

type OnboardingFormData = z.infer<typeof vendorOnboardingSchema>;

export const VendorOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>('NOT_APPLIED');
  const [adminNotes, setAdminNotes] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(vendorOnboardingSchema)
  });

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await vendorService.getStatus();
      const currentStatus = (res as any).onboardingStatus || (res as any).status || 'NOT_APPLIED';
      setStatus(currentStatus);
      setAdminNotes((res as any).adminNotes);

      if (currentStatus === OnboardingStatus.APPROVED || currentStatus === 'APPROVED') {
        navigate('/vendor/dashboard');
      }
    } catch {
      setStatus('NOT_APPLIED');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setSubmitting(true);
      await vendorService.apply({
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        businessEmail: data.businessEmail,
        businessPhone: data.businessPhone,
        businessAddress: data.businessAddress,
        gstNumber: data.gstNumber
      });
      toast.success('Vendor onboarding application submitted successfully!');
      setStatus(OnboardingStatus.PENDING);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit vendor application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === OnboardingStatus.PENDING || status === 'PENDING') {
    return (
      <div className="mx-auto max-w-2xl py-12 px-4">
        <Card className="text-center p-8 border-amber-200 bg-amber-50/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4">
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Application Under Review</h2>
          <p className="mt-3 text-slate-600 leading-relaxed">
            Thank you for applying to sell on NexMart! Your vendor onboarding application has been received and is currently being reviewed by our marketplace administrator team.
          </p>
          <div className="mt-6 rounded-lg bg-white p-4 text-left border border-amber-200">
            <h4 className="font-semibold text-slate-800 text-sm">Next Steps:</h4>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-600 list-disc list-inside">
              <li>Our compliance team verifies your business details and GST credentials.</li>
              <li>Approval is typically processed within 24 to 48 business hours.</li>
              <li>Once approved, your full Vendor Dashboard and Product Management capabilities will unlock automatically.</li>
            </ul>
          </div>
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="outline" onClick={fetchStatus}>
              Refresh Status
            </Button>
            <Button onClick={() => navigate('/')}>
              Browse Marketplace
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-10 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 mb-3">
          <Store className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Seller Onboarding</h1>
        <p className="mt-2 text-slate-600">
          Partner with NexMart to reach thousands of customers across the nation. Fill in your business details below to get started.
        </p>
      </div>

      {(status === OnboardingStatus.REJECTED || status === 'REJECTED') && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3 text-red-800">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Previous Application Rejected</h4>
            <p className="text-xs mt-1">
              {adminNotes || 'Please update your business details or GST information and resubmit for evaluation.'}
            </p>
          </div>
        </div>
      )}

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Registered Business Name *"
                placeholder="e.g. Apex Electronics Retail Pvt Ltd"
                {...register('businessName')}
                error={errors.businessName?.message}
              />
            </div>

            <Input
              label="Official Business Email *"
              type="email"
              placeholder="contact@yourbusiness.com"
              {...register('businessEmail')}
              error={errors.businessEmail?.message}
            />

            <Input
              label="Business Phone Number *"
              placeholder="+91 9876543210"
              {...register('businessPhone')}
              error={errors.businessPhone?.message}
            />

            <div className="sm:col-span-2">
              <Input
                label="GSTIN / Business Tax Identification (Optional)"
                placeholder="e.g. 29ABCDE1234F1Z5"
                {...register('gstNumber')}
                error={errors.gstNumber?.message}
              />
            </div>

            <div className="sm:col-span-2">
              <Textarea
                label="Registered Business Address *"
                rows={3}
                placeholder="Suite, Building, Street, City, State, PIN Code"
                {...register('businessAddress')}
                error={errors.businessAddress?.message}
              />
            </div>

            <div className="sm:col-span-2">
              <Textarea
                label="Company & Product Overview *"
                rows={4}
                placeholder="Describe your product catalog, manufacturing/distribution capabilities and brand story..."
                {...register('businessDescription')}
                error={errors.businessDescription?.message}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Submit Application
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default VendorOnboardingPage;

