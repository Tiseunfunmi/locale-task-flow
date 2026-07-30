import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Language, UserRole } from '../../types';
import { toast } from 'sonner';
import { CircleUser, Shield, Languages, CheckCircle, Clock, AlertTriangle, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, setUser, updateLanguage } = useAppContext();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      if (!supabase?.auth) return;
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data } = await supabase
        .from('verifications')
        .select('status')
        .eq('user_id', authUser.id)
        .maybeSingle();
      if (data) setVerificationStatus(data.status);
    };
    loadStatus();
  }, []);

  const handleRoleSwitch = (role: UserRole) => {
    if (!user) return;
    setUser({ ...user, role });
    toast.success(`Switched to ${role} dashboard`);
    navigate(role === 'customer' ? '/customer' : role === 'completer' ? '/completer' : '/admin');
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ha', name: 'Hausa (Harshen Hausa)' },
    { code: 'ig', name: 'Igbo (Asụsụ Igbo)' },
    { code: 'yo', name: 'Yoruba (Èdè Yorùbá)' },
  ];

  const getStatusBadge = () => {
    if (!verificationStatus) {
      return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', label: t('profile.not_verified') };
    }
    switch (verificationStatus) {
      case 'approved':
        return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', label: t('profile.approved') };
      case 'rejected':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', label: t('profile.rejected') };
      default:
        return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: t('profile.pending') };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div className="flex flex-col items-center py-6 space-y-3">
        <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-sm overflow-hidden flex items-center justify-center">
          {user?.photo ? (
            <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <CircleUser size={64} className="text-slate-400" />
          )}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <p className="text-sm text-slate-500">{user?.phone}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Verification Status Card */}
        <div
          onClick={() => navigate(`/${user?.role || 'customer'}/profile/complete`)}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Medal size={20} className="text-slate-400" />
              <Label className="font-semibold">{t('profile.verification')}</Label>
            </div>
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.color}`}>
              <StatusIcon size={12} />
              <span>{statusBadge.label}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">{t('profile.verify_desc')}</p>
          <div className="flex items-center space-x-2 text-emerald-600 text-xs font-medium">
            <span>{t('profile.complete_profile')}</span>
            <span>→</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Languages size={20} className="text-slate-400" />
              <Label className="font-semibold">App Language</Label>
            </div>
            <Select 
              value={user?.language} 
              onValueChange={(val) => updateLanguage(val as Language)}
            >
              <SelectTrigger className="w-32 border-none bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <Label className="font-semibold px-1">Switch Perspective</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant={user?.role === 'customer' ? 'default' : 'outline'}
              className={user?.role === 'customer' ? 'bg-green-600' : ''}
              onClick={() => handleRoleSwitch('customer')}
            >
              Customer
            </Button>
            <Button 
              variant={user?.role === 'completer' ? 'default' : 'outline'}
              className={user?.role === 'completer' ? 'bg-green-600' : ''}
              onClick={() => handleRoleSwitch('completer')}
            >
              Task Completer
            </Button>
          </div>
          <Button 
            variant="ghost" 
            className="w-full text-slate-400 text-xs mt-2"
            onClick={() => handleRoleSwitch('admin')}
          >
            <Shield size={12} className="mr-1" /> Admin Panel
          </Button>
        </div>
      </div>
    </div>
  );
};