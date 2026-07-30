import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CircleCheck, CircleAlert, LoaderCircle, ArrowLeft, Mail } from 'lucide-react';

type ConfirmState = 'processing' | 'success' | 'error';

export const EmailConfirmationPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ConfirmState>('processing');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    const handleConfirmation = async () => {
      // Priority 1: token_hash + type (magic link / OTP flow)
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type') as 'signup' | 'recovery' | 'invite' | 'email_change' | undefined;

      // Priority 2: hash fragment access_token (PKCE oauth flow)
      const hash = window.location.hash.slice(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const errorDesc = hashParams.get('error_description');

      if (!supabase?.auth) {
        if (!cancelled) {
          setErrorMsg(t('email_confirm.wait_verify'));
          setState('error');
        }
        return;
      }

      try {
        // Case A: error in hash fragment (e.g. user cancelled OAuth)
        if (errorDesc) {
          if (!cancelled) {
            setErrorMsg(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
            setState('error');
          }
          return;
        }

        // Case B: token_hash present — verify OTP
        if (tokenHash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });

          if (error) {
            if (!cancelled) {
              setErrorMsg(error.message || t('email_confirm.failed'));
              setState('error');
            }
            return;
          }

          if (data?.user) {
            if (!cancelled) {
              toast.success(t('email_confirm.success_toast'));
              setState('success');
            }
          } else {
            if (!cancelled) {
              setErrorMsg(t('email_confirm.failed'));
              setState('error');
            }
          }
          return;
        }

        // Case C: access_token in hash fragment (PKCE flow)
        if (accessToken) {
          // The session is already set by Supabase's onAuthStateChange listener
          // We just need to check if the session is valid
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            if (!cancelled) {
              setErrorMsg(sessionError.message || t('email_confirm.failed'));
              setState('error');
            }
            return;
          }
          if (sessionData?.session) {
            if (!cancelled) {
              toast.success(t('email_confirm.success_toast'));
              setState('success');
            }
          } else {
            if (!cancelled) {
              setErrorMsg(t('email_confirm.failed'));
              setState('error');
            }
          }
          return;
        }

        // Case D: no token at all — show error
        if (!cancelled) {
          setErrorMsg(t('email_confirm.failed'));
          setState('error');
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err.message || t('auth.something_wrong'));
          setState('error');
        }
      }
    };

    handleConfirmation();

    return () => { cancelled = true; };
  }, [searchParams, navigate, t]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.img
            src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/b79e0029-b83f-40c6-a326-b173816b95ca/taskmate-logo-eb2e6a20-1783559082014.webp"
            alt="TaskMate"
            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg shadow-emerald-100"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 30 }}
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
            {t('email_confirm.title')}
          </motion.p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8">
            {state === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <LoaderCircle className="w-10 h-10 text-emerald-500" />
                </motion.div>
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    {t('email_confirm.confirming')}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {t('email_confirm.wait_verify')}
                  </p>
                </div>
              </motion.div>
            )}

            {state === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CircleCheck className="w-8 h-8 text-emerald-600" />
                  </div>
                </motion.div>
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    {t('email_confirm.confirmed')}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {t('email_confirm.verified')}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="mt-2 w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all font-semibold text-white rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('email_confirm.go_to_signin')}
                </button>
              </motion.div>
            )}

            {state === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                >
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <CircleAlert className="w-8 h-8 text-red-500" />
                  </div>
                </motion.div>
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    {t('email_confirm.failed')}
                  </p>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    {errorMsg}
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full mt-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all font-semibold text-white rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('email_confirm.back_to_signin')}
                  </button>
                  <button
                    onClick={() => {
                      setState('processing');
                      setErrorMsg('');
                      window.location.reload();
                    }}
                    className="w-full h-11 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all font-medium text-slate-700 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {t('email_confirm.try_again')}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <motion.p
          className="text-center text-xs text-slate-400 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {t('email_confirm.need_help')}
        </motion.p>
      </motion.div>
    </div>
  );
};