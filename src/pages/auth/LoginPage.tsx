import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, LoaderCircle, ArrowRight, Check } from 'lucide-react';
import type { UserRole } from '../../types';

type AuthMode = 'signin' | 'signup';
type RoleChoice = 'customer' | 'completer';

const springTransition = { type: 'spring', stiffness: 400, damping: 30 };
const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<RoleChoice>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setUser } = useAppContext();
  const navigate = useNavigate();

  const isSignUp = mode === 'signup';

  const toggleMode = () => {
    setMode(isSignUp ? 'signin' : 'signup');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('auth.fill_all_fields'));
      return;
    }

    setLoading(true);
    try {
      if (!supabase?.auth) { toast.error(t('auth.auth_unavailable')); return; }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || t('auth.sign_in_failed'));
        return;
      }

      if (data.user) {
        const meta = data.user.user_metadata || {};
        const userRole: UserRole = meta.role || 'customer';

        setUser({
          id: data.user.id,
          phone: meta.phone || '',
          name: meta.full_name || data.user.email?.split('@')[0] || 'User',
          role: userRole,
          language: 'en',
          walletBalance: 0,
          pendingBalance: 0,
          bonusPoints: 0,
          rating: 0,
          reviewCount: 0,
        });

        toast.success(t('auth.welcome_back'));
        navigate(userRole === 'completer' ? '/completer' : '/customer');
      }
    } catch (err: any) {
      console.error('Sign-in error details:', err);
      toast.error(err.message || t('auth.something_wrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error(t('auth.fill_all_fields'));
      return;
    }
    if (password.length < 6) {
      toast.error(t('auth.password_min'));
      return;
    }

    setLoading(true);
    try {
      if (!supabase?.auth) { toast.error(t('auth.auth_unavailable')); return; }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (error) {
        toast.error(error.message || t('auth.sign_up_failed'));
        return;
      }

      if (data.user) {
        if (data.session) {
          const userRole: UserRole = role;
          setUser({
            id: data.user.id,
            phone: '',
            name: fullName,
            role: userRole,
            language: 'en',
            walletBalance: 0,
            pendingBalance: 0,
            bonusPoints: 0,
            rating: 0,
            reviewCount: 0,
          });

          toast.success(t('auth.account_created'));
          navigate(userRole === 'completer' ? '/completer' : '/customer');
        } else {
          toast.success(t('auth.check_email'));
          setMode('signin');
        }
      }
    } catch (err: any) {
      console.error('Sign-up error details:', err);
      toast.error(err.message || t('auth.something_wrong'));
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: { value: RoleChoice; label: string; desc: string }[] = [
    { value: 'customer', label: t('customer'), desc: t('auth.customer_desc') },
    { value: 'completer', label: t('completer'), desc: t('auth.completer_desc') },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <motion.img
            src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/b79e0029-b83f-40c6-a326-b173816b95ca/taskmate-logo-eb2e6a20-1783559082014.webp"
            alt="TaskMate"
            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg shadow-emerald-100"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, ...springTransition }}
          />
          <motion.h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            TaskMate
          </motion.h1>
          <motion.p
            className="text-slate-500 text-sm mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {t('auth.tagline')}
          </motion.p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Mode Toggle */}
          <div className="flex p-1.5 m-4 bg-slate-100 rounded-xl relative">
            <motion.div
              className="absolute top-1.5 bottom-1.5 bg-white rounded-lg shadow-sm"
              style={{ width: 'calc(50% - 6px)' }}
              animate={{ left: isSignUp ? 'calc(50% + 0px)' : '6px' }}
              transition={springTransition}
            />
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`relative z-10 flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                !isSignUp ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {t('auth.sign_in')}
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`relative z-10 flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isSignUp ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {t('auth.sign_up')}
            </button>
          </div>

          {/* Form */}
          <div className="px-6 pb-6">
            <AnimatePresence mode="wait">
              {!isSignUp ? (
                <motion.form
                  key="signin"
                  {...fadeSlide}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSignIn}
                  className="space-y-4"
                >
                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-xs font-medium text-slate-600">
                      {t('auth.email')}
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder={t('auth.placeholder_email')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-400 focus:ring-emerald-100 transition-all"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password" className="text-xs font-medium text-slate-600">
                      {t('auth.password')}
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('auth.placeholder_password')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-400 focus:ring-emerald-100 transition-all"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all font-semibold text-white shadow-lg shadow-emerald-200"
                  >
                    {loading ? (
                      <LoaderCircle className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        {t('auth.sign_in')} <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  {...fadeSlide}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSignUp}
                  className="space-y-4"
                >
                  {/* Full Name */}
                  <motion.div
                    className="space-y-1.5"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.05, duration: 0.2 }}
                  >
                    <Label htmlFor="signup-name" className="text-xs font-medium text-slate-600">
                      {t('auth.full_name')}
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder={t('auth.placeholder_name')}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-400 focus:ring-emerald-100 transition-all"
                        autoComplete="name"
                      />
                    </div>
                  </motion.div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs font-medium text-slate-600">
                      {t('auth.email')}
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t('auth.placeholder_email')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-400 focus:ring-emerald-100 transition-all"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs font-medium text-slate-600">
                      {t('auth.password')}
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('auth.placeholder_password_min')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-400 focus:ring-emerald-100 transition-all"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600">{t('auth.i_want_to')}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {roleOptions.map((opt) => {
                        const selected = role === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setRole(opt.value)}
                            className={`relative flex flex-col items-start p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                              selected
                                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <motion.div
                              className="absolute top-2 right-2"
                              initial={false}
                              animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
                              transition={springTransition}
                            >
                              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </div>
                            </motion.div>
                            <span
                              className={`text-sm font-semibold ${
                                selected ? 'text-emerald-700' : 'text-slate-700'
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                              {opt.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all font-semibold text-white shadow-lg shadow-emerald-200"
                  >
                    {loading ? (
                      <LoaderCircle className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        {t('auth.create_account')} <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Toggle link */}
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-slate-500 hover:text-emerald-600 transition-colors"
              >
                {isSignUp ? (
                  <>
                    {t('auth.already_account')}{' '}
                    <span className="font-semibold text-emerald-600">{t('auth.sign_in_link')}</span>
                  </>
                ) : (
                  <>
                    {t('auth.no_account')}{' '}
                    <span className="font-semibold text-emerald-600">{t('auth.sign_up_link')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          className="text-center text-xs text-slate-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {t('auth.terms')}
        </motion.p>
      </motion.div>
    </div>
  );
};