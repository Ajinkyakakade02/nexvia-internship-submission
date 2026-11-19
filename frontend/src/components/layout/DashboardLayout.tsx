import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar, SidebarItem } from './Sidebar';

export interface DashboardLayoutProps {
  title: string;
  items: SidebarItem[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ title, items }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar title={title} items={items} className="hidden md:block" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
