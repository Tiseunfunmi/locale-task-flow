import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft,
  Camera,
  Upload,
  Fingerprint,
  MapPin,
  Calendar,
  CheckCircle,
  Shield,
  AlertTriangle,
  Clock,
  X,
} from 'lucide-react';

type VerificationStatus = 'pending' | 'approved' | 'rejected' | null;

interface FormData {
  photo: File | null;
  photoPreview: string | null;
  address: string;
  nin: string;
  dob: string;
}

interface ExistingVerification {
  photo_url: string | null;
  address: string | null;
  nin: string | null;
  dob: string | null;
  status: string;
}

const STEP_ICONS = [
  { icon: Camera, label: 'Photo' },
  { icon: MapPin, label: 'Address' },
  { icon: Fingerprint, label: 'NIN' },
  { icon: Calendar, label: 'DOB' },
];

export const CompleteProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingVerification, setExistingVerification] = useState<ExistingVerification | null>(null);
  const [formData, setFormData] = useState<FormData>({
    photo: null,
    photoPreview: null,
    address: '',
    nin: '',
    dob: '',
  });

  // Load existing verification on mount
  React.useEffect(() => {
    const loadVerification = async () => {
      if (!supabase?.auth) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error('Failed to load verification:', error);
        return;
      }
      if (data) {
        setExistingVerification(data);
        setFormData({
          photo: null,
          photoPreview: data.photo_url || null,
          address: data.address || '',
          nin: data.nin || '',
          dob: data.dob || '',
        });
      }
    };
    loadVerification();
  }, []);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData((prev) => ({
        ...prev,
        photo: file,
        photoPreview: ev.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null, photoPreview: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!formData.photoPreview && !formData.address && !formData.nin && !formData.dob) {
      toast.error(t('profile.fill_all_fields'));
      return;
    }

    setSubmitting(true);
    try {
      if (!supabase?.auth) {
        toast.error(t('profile.error_desc'));
        setSubmitting(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload photo if new
      let photoUrl = existingVerification?.photo_url || null;
      if (formData.photo) {
        const fileExt = formData.photo.name.split('.').pop();
        const filePath = `profile-photos/${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, formData.photo);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);
        photoUrl = urlData.publicUrl;
      }

      // Upsert verification
      const payload = {
        user_id: user.id,
        photo_url: photoUrl,
        address: formData.address,
        nin: formData.nin,
        dob: formData.dob || null,
        status: 'pending',
      };

      if (existingVerification) {
        const { error: updateError } = await supabase
          .from('verifications')
          .update(payload)
          .eq('user_id', user.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('verifications')
          .insert(payload);
        if (insertError) throw insertError;
      }

      setSubmitted(true);
      toast.success(t('profile.success_title'), {
        description: t('profile.success_desc'),
      });
    } catch (err: any) {
      toast.error(err.message || t('profile.error_desc'));
    } finally {
      setSubmitting(false);
    }
  };

  const verificationStatus = existingVerification?.status as VerificationStatus;

  if (submitted) {
    return (
      <div className="p-4 max-w-md mx-auto min-h-[100dvh] flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{t('profile.success_title')}</h2>
          <p className="text-slate-500">{t('profile.success_desc')}</p>
          <Button onClick={() => navigate(-1)} className="mt-4 bg-emerald-500 hover:bg-emerald-600">
            {t('actions.back') || 'Go Back'}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto min-h-[100dvh]">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('profile.complete_profile')}</h1>
          <p className="text-sm text-slate-400">{t('profile.verify_desc')}</p>
        </div>
      </div>

      {/* Status banner */}
      {existingVerification && (
        <div className={`mb-6 p-3 rounded-xl flex items-center space-x-3 ${
          verificationStatus === 'approved' ? 'bg-emerald-50 text-emerald-700' :
          verificationStatus === 'rejected' ? 'bg-red-50 text-red-700' :
          'bg-amber-50 text-amber-700'
        }`}>
          {verificationStatus === 'approved' ? <CheckCircle size={18} /> :
           verificationStatus === 'rejected' ? <AlertTriangle size={18} /> :
           <Clock size={18} />}
          <span className="text-sm font-medium">
            {verificationStatus === 'approved' ? t('profile.approved') :
             verificationStatus === 'rejected' ? t('profile.rejected') :
             t('profile.pending')}
          </span>
          {verificationStatus === 'rejected' && (
            <span className="text-xs ml-1">{t('profile.verify_identity')}</span>
          )}
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEP_ICONS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === i;
          const isDone = step > i;
          return (
            <button
              key={s.label}
              onClick={() => setStep(i)}
              className={`flex flex-col items-center space-y-1 transition-all ${
                isActive ? 'scale-110' : isDone ? 'opacity-70' : 'opacity-40'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isDone ? 'bg-emerald-500 text-white' :
                isActive ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-300' :
                'bg-slate-100 text-slate-400'
              }`}>
                {isDone ? <CheckCircle size={18} /> : <Icon size={18} />}
              </div>
              <span className={`text-[10px] font-medium ${
                isActive ? 'text-emerald-600' : 'text-slate-400'
              }`}>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stepper dots */}
      <div className="flex justify-center space-x-1 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === step ? 'w-6 bg-emerald-500' :
              i < step ? 'bg-emerald-300' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* Form content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          {/* Step 0: Photo */}
          {step === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Camera size={20} className="text-emerald-500" />
                <h3 className="font-semibold text-slate-700">{t('profile.upload_photo')}</h3>
              </div>
              <p className="text-sm text-slate-400">{t('profile.upload_guide')}</p>

              <div className="flex flex-col items-center space-y-4">
                {/* Photo preview */}
                {formData.photoPreview ? (
                  <div className="relative">
                    <img
                      src={formData.photoPreview}
                      alt="Profile preview"
                      className="w-40 h-40 rounded-2xl object-cover border-2 border-slate-200"
                    />
                    <button
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-40 h-40 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
                  >
                    <Upload size={32} className="text-slate-300 mb-2" />
                    <span className="text-sm text-slate-400">{t('profile.take_photo')}</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
                {formData.photoPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} className="mr-1" />
                    {t('profile.change_photo')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Address */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin size={20} className="text-emerald-500" />
                <h3 className="font-semibold text-slate-700">{t('profile.address')}</h3>
              </div>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder={t('profile.address_placeholder')}
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Step 2: NIN */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Fingerprint size={20} className="text-emerald-500" />
                <h3 className="font-semibold text-slate-700">{t('profile.nin')}</h3>
              </div>
              <input
                type="text"
                value={formData.nin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setFormData((prev) => ({ ...prev, nin: val }));
                }}
                placeholder={t('profile.nin_placeholder')}
                maxLength={11}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 flex items-center space-x-1">
                <Shield size={10} className="text-emerald-400" />
                <span>{t('profile.verify_benefit')}</span>
              </p>
            </div>
          )}

          {/* Step 3: DOB */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar size={20} className="text-emerald-500" />
                <h3 className="font-semibold text-slate-700">{t('profile.dob')}</h3>
              </div>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData((prev) => ({ ...prev, dob: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent"
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex space-x-3 mt-8">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="flex-1 border-slate-200"
          >
            {t('actions.back') || 'Back'}
          </Button>
        )}
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {t('actions.continue') || 'Continue'}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {submitting ? (
              <span className="flex items-center space-x-2">
                <Clock size={16} className="animate-spin" />
                <span>{t('profile.submitting')}</span>
              </span>
            ) : (
              t('profile.submit')
            )}
          </Button>
        )}
      </div>

      {/* Why verify? section */}
      <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/60 border border-emerald-100/60">
        <div className="flex items-center space-x-2 mb-2">
          <Shield size={16} className="text-emerald-500" />
          <h4 className="font-semibold text-sm text-emerald-700">{t('profile.why_verify')}</h4>
        </div>
        <p className="text-xs text-emerald-600/80 leading-relaxed">
          {t('profile.why_verify_desc')}
        </p>
      </div>
    </div>
  );
};