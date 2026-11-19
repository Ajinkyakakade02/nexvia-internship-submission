import React, { useState } from 'react';
import { adminService } from '@/services/adminService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export const AdminSettingsPage: React.FC = () => {
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminService.updateCommissionRate(Number(commissionRate));
      toast.success('Marketplace commission fee updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update commission setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Settings</h1>
        <p className="text-sm text-slate-500">Configure marketplace commission rates and parameters.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission & Revenue Split</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                This percentage represents the platform's cut automatically withheld during checkout payments before transferring net amounts to vendor linked accounts.
              </p>
              <Input
                label="Global Platform Commission (%)"
                type="number"
                min="0"
                max="100"
                step="0.5"
                required
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                helperText="Standard e-commerce commission is between 5% and 15%."
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" isLoading={saving}>
                Update Commission Rate
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

