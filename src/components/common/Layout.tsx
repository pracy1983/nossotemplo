import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="flex">
        {showSidebar && user?.isAdmin && <Sidebar />}
        <main className={`flex-1 ${showSidebar && user?.isAdmin ? 'ml-64' : ''}`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;