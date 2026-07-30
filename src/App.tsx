import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { supabase } from './integrations/supabase/client';
import { MobileLayout } from './components/MobileLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { EmailConfirmationPage } from './pages/auth/EmailConfirmationPage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CompleterSearch } from './pages/customer/CompleterSearch';
import { ChatPage } from './pages/customer/ChatPage';
import { CustomerTasks } from './pages/customer/CustomerTasks';
import { ProfilePage } from './pages/customer/ProfilePage';
import { CompleteProfilePage } from './pages/customer/CompleteProfilePage';
import { CompleterDashboard } from './pages/completer/CompleterDashboard';
import { WalletPage } from './pages/completer/WalletPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import './i18n';

const LoadingScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <LoaderCircle className="w-8 h-8 text-emerald-500" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-slate-400 font-medium"
      >
        Loading TaskMate...
      </motion.p>
    </motion.div>
  </div>
);

const SessionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser } = useAppContext();
  const [sessionState, setSessionState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const isSigningOut = useRef(false);

  useEffect(() => {
    if (!supabase?.auth) { setSessionState('unauthenticated'); return; }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        setUser({
          id: session.user.id,
          phone: meta.phone || '',
          name: meta.full_name || session.user.email?.split('@')[0] || 'User',
          role: meta.role || 'customer',
          language: 'en',
          walletBalance: 0,
          pendingBalance: 0,
          bonusPoints: 0,
          rating: 0,
          reviewCount: 0,
        });
        setSessionState('authenticated');
      } else {
        setUser(null);
        setSessionState('unauthenticated');
      }
    });

    // Auth state change listener - skip INITIAL_SESSION to avoid duplicate handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Skip INITIAL_SESSION - already handled by getSession() above
      if (event === 'INITIAL_SESSION') return;

      // Guard against reacting to our own sign-out to prevent re-render loops
      if (event === 'SIGNED_OUT') {
        isSigningOut.current = true;
        setUser(null);
        setSessionState('unauthenticated');
        setTimeout(() => { isSigningOut.current = false; }, 500);
        return;
      }

      // Only handle SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED
      if (session?.user && !isSigningOut.current) {
        const meta = session.user.user_metadata || {};
        setUser({
          id: session.user.id,
          phone: meta.phone || '',
          name: meta.full_name || session.user.email?.split('@')[0] || 'User',
          role: meta.role || 'customer',
          language: 'en',
          walletBalance: 0,
          pendingBalance: 0,
          bonusPoints: 0,
          rating: 0,
          reviewCount: 0,
        });
        setSessionState('authenticated');
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [setUser]);

  if (sessionState === 'loading') {
    return <LoadingScreen />;
  }

  if (sessionState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: string }> = ({ children, allowedRole }) => {
  const { user } = useAppContext();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole && user.role !== 'admin') {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <MobileLayout>{children}</MobileLayout>;
};

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public routes — accessible without authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/confirm" element={<EmailConfirmationPage />} />

          {/* Protected routes — wrapped in SessionGuard */}
          <Route path="/*" element={
            <SessionGuard>
              <Routes>
                {/* Customer Routes */}
                <Route path="/customer" element={<ProtectedRoute allowedRole="customer"><CustomerDashboard /></ProtectedRoute>} />
                <Route path="/customer/search" element={<ProtectedRoute allowedRole="customer"><CompleterSearch /></ProtectedRoute>} />
                <Route path="/customer/chat/:id" element={<ProtectedRoute allowedRole="customer"><ChatPage /></ProtectedRoute>} />
                <Route path="/customer/tasks" element={<ProtectedRoute allowedRole="customer"><CustomerTasks /></ProtectedRoute>} />
                <Route path="/customer/chats" element={<ProtectedRoute allowedRole="customer"><div className="p-4">Recent Chats List (Mock)</div></ProtectedRoute>} />
                <Route path="/customer/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                {/* Completer Routes */}
                <Route path="/completer" element={<ProtectedRoute allowedRole="completer"><CompleterDashboard /></ProtectedRoute>} />
                <Route path="/completer/wallet" element={<ProtectedRoute allowedRole="completer"><WalletPage /></ProtectedRoute>} />
                <Route path="/completer/chats" element={<ProtectedRoute allowedRole="completer"><div className="p-4">Incoming Chat Requests (Mock)</div></ProtectedRoute>} />
                <Route path="/completer/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/completer/profile/complete" element={<ProtectedRoute><CompleteProfilePage /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                <Route path="/" element={<Navigate to="/customer" replace />} />
              </Routes>
            </SessionGuard>
          } />
        </Routes>
        <Toaster position="top-center" richColors />
      </Router>
    </AppProvider>
  );
}

export default App;