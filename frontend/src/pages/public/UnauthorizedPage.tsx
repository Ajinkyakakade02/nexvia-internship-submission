import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, Home } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900">Access Denied</h1>
      <p className="text-slate-500 text-sm max-w-md mt-2 mb-8">
        You do not have the required permissions to access this page. Please sign in with an authorized account.
      </p>
      <Link to="/">
        <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
          Return Home
        </Button>
      </Link>
    </div>
  );
};
export default UnauthorizedPage;
