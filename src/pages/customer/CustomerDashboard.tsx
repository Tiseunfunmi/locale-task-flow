import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { ChoreCategory } from '../../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CHORE_OPTIONS: { id: ChoreCategory; icon: string }[] = [
  { id: 'wash_clothes_hand', icon: '🧺' },
  { id: 'wash_clothes_machine', icon: '🧺' },
  { id: 'wash_plates', icon: '🍽️' },
  { id: 'clean_house', icon: '🧹' },
  { id: 'go_to_market', icon: '🛒' },
  { id: 'cook_meal', icon: '🍳' },
];

export const CustomerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAppContext();
  const [selectedChores, setSelectedChores] = useState<ChoreCategory[]>([]);
  const navigate = useNavigate();

  const toggleChore = (chore: ChoreCategory) => {
    setSelectedChores(prev => 
      prev.includes(chore) 
        ? prev.filter(c => c !== chore) 
        : [...prev, chore]
    );
  };

  const handleFindCompleters = () => {
    if (selectedChores.length === 0) return;
    navigate('/customer/search', { state: { selectedChores } });
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h2 className="text-2xl font-bold text-slate-900">
          {t('welcome', { name: user?.name.split(' ')[0] })}
        </h2>
        <p className="text-slate-500">{t('home.subtitle')}</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-3">
        {CHORE_OPTIONS.map((chore, index) => (
          <motion.div
            key={chore.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
              selectedChores.includes(chore.id) 
                ? 'border-green-600 bg-green-50' 
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
            onClick={() => toggleChore(chore.id)}
          >
            <span className="text-2xl">{chore.icon}</span>
            <div className="flex-1">
              <Label className="font-semibold text-slate-800 cursor-pointer">
                {t(`chores.${chore.id}`)}
              </Label>
            </div>
            <Checkbox 
              checked={selectedChores.includes(chore.id)} 
              onCheckedChange={() => toggleChore(chore.id)}
              className="border-2"
            />
          </motion.div>
        ))}
      </div>

      <Button 
        className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 shadow-lg"
        disabled={selectedChores.length === 0}
        onClick={handleFindCompleters}
      >
        {t('home.find_completers')}
      </Button>
    </div>
  );
};