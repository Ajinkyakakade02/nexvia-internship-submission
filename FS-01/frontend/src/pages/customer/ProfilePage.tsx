import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { Address } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { MapPin, Plus, Trash2, User, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
  const [savingProfile, setSavingProfile] = useState(false);

  // New address state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState<Address>({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await authService.updateProfile({ name, phone });
      updateUser(updated);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.fullName || !newAddr.addressLine1 || !newAddr.pincode) {
      toast.error('Please fill required address fields');
      return;
    }

    const updatedAddresses = [...addresses, newAddr];
    try {
      const updated = await authService.updateProfile({ addresses: updatedAddresses });
      updateUser(updated);
      setAddresses(updated.addresses || updatedAddresses);
      setIsAddingAddress(false);
      setNewAddr({ fullName: '', phone: '', addressLine1: '', city: '', state: '', pincode: '' });
      toast.success('Address added');
    } catch {
      toast.error('Failed to add address');
    }
  };

  const handleDeleteAddress = async (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    try {
      const res = await authService.updateProfile({ addresses: updated });
      updateUser(res);
      setAddresses(res.addresses || updated);
      toast.success('Address removed');
    } catch {
      toast.error('Failed to remove address');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your account information and saved addresses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center space-y-4">
          <Avatar name={user?.name} src={user?.avatar} size="xl" />
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 capitalize">
              {user?.role} Account
            </span>
          </div>
        </div>

        {/* Profile info form */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900 pb-2 border-b border-slate-100">
            Account Details
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
            />
            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              helperText="Email cannot be changed"
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
            />
            <Button type="submit" variant="primary" size="sm" isLoading={savingProfile}>
              Save Profile Changes
            </Button>
          </form>
        </div>
      </div>

      {/* Saved Addresses Management */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600" />
              Saved Addresses
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage your delivery addresses for seamless checkout</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingAddress(!isAddingAddress)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            {isAddingAddress ? 'Cancel' : 'Add New'}
          </Button>
        </div>

        {isAddingAddress && (
          <form onSubmit={handleAddAddress} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-700">New Address Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name"
                placeholder="Receiver's name"
                value={newAddr.fullName}
                onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                required
              />
              <Input
                label="Phone"
                placeholder="10-digit mobile"
                value={newAddr.phone}
                onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                required
              />
            </div>
            <Input
              label="Address Line"
              placeholder="House, Street, Area"
              value={newAddr.addressLine1}
              onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
              required
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="City"
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                required
              />
              <Input
                label="State"
                value={newAddr.state}
                onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                required
              />
              <Input
                label="Pincode"
                value={newAddr.pincode}
                onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                required
              />
            </div>
            <Button type="submit" size="sm" variant="primary">
              Save Address
            </Button>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 relative group">
              <div className="flex justify-between items-start">
                <p className="font-semibold text-sm text-slate-800">{addr.fullName}</p>
                <button
                  type="button"
                  onClick={() => handleDeleteAddress(idx)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  aria-label="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">{addr.phone}</p>
              <p className="text-xs text-slate-600 mt-2">
                {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}
              </p>
            </div>
          ))}
          {addresses.length === 0 && !isAddingAddress && (
            <p className="text-xs text-slate-400 italic">No saved addresses yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
