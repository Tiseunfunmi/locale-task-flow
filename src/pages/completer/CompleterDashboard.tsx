import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { ChoreCategory } from '../../types';
import { motion } from 'framer-motion';

const CHORE_OPTIONS: { id: ChoreCategory; icon: string }[] = [
  { id: 'wash_clothes_hand', icon: '🧺' },
  { id: 'wash_clothes_machine', icon: '🧺' },
  { id: 'wash_plates', icon: '🍽️' },
  { id: 'clean_house', icon: '🧹' },
  { id: 'go_to_market', icon: '🛒' },
  { id: 'cook_meal', icon: '🍳' },
];

export const CompleterDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAppContext();

  const toggleService = (service: ChoreCategory) => {
    if (!user) return;
    const currentServices = user.services || [];
    const newServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    
    setUser({ ...user, services: newServices });
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">
          {t('welcome', { name: user?.name.split(' ')[0] })}
        </h2>
        <p className="text-slate-500">{t('completer_dashboard.subtitle')}</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h3 className="font-semibold text-slate-800 border-b pb-2">{t('completer_dashboard.active_services')}</h3>
        <div className="space-y-4">
          {CHORE_OPTIONS.map((option) => (
            <div key={option.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-xl">{option.icon}</span>
                <Label htmlFor={option.id} className="text-sm font-medium text-slate-700">
                  {t(`chores.${option.id}`)}
                </Label>
              </div>
              <Switch 
                id={option.id}
                checked={user?.services?.includes(option.id)}
                onCheckedChange={() => toggleService(option.id)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-green-600 p-6 rounded-2xl shadow-lg text-white space-y-2">
        <h4 className="text-green-100 text-xs font-bold uppercase tracking-wider">{t('completer_dashboard.todays_earnings')}</h4>
        <p className="text-3xl font-bold">₦{user?.walletBalance.toLocaleString()}</p>
        <p className="text-xs text-green-100">+{user?.bonusPoints} {t('completer_dashboard.bonus_earned')}</p>
      </div>
    </div>
  );
};