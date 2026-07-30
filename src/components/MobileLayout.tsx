import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { House, MessageSquare, Wallet, User, Shield, LogOut } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { cn } from '../lib/utils';

export const MobileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();

  if (!user) return <>{children}</>;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = user.role === 'admin' ? [
    { icon: Shield, label: 'Admin', path: '/admin' },
    { icon: User, label: 'Profile', path: '/admin/profile' },
  ] : user.role === 'customer' ? [
    { icon: House, label: 'Home', path: '/customer' },
    { icon: MessageSquare, label: 'Chats', path: '/customer/chats' },
    { icon: Wallet, label: 'Tasks', path: '/customer/tasks' },
    { icon: User, label: 'Profile', path: '/customer/profile' },
  ] : [
    { icon: House, label: 'Home', path: '/completer' },
    { icon: MessageSquare, label: 'Chats', path: '/completer/chats' },
    { icon: Wallet, label: 'Wallet', path: '/completer/wallet' },
    { icon: User, label: 'Profile', path: '/completer/profile' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 w-full bg-white border-b px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-600">TaskMate</h1>
        <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
          <LogOut size={20} />
        </button>
      </header>
      
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t px-2 py-1">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center p-2 text-xs transition-colors",
                isActive ? "text-green-600 font-semibold" : "text-slate-500"
              )}
            >
              <item.icon size={24} />
              <span className="mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};