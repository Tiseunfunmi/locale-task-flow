import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Wallet, ArrowUpRight, Clock, CirclePlus } from 'lucide-react';
import { motion } from 'framer-motion';

const NIGERIAN_BANKS = [
  "Access Bank", "GTBank", "Zenith Bank", "UBA", "First Bank", 
  "Fidelity Bank", "Union Bank", "Sterling Bank", "Wema Bank", 
  "Polaris Bank", "Stanbic IBTC", "Ecobank", "FCMB", "Keystone Bank", 
  "Opay", "Kuda", "Palmpay", "Moniepoint"
];

export const WalletPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, setUser } = useAppContext();
  const [isLinking, setIsLinking] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const handleLinkBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountNumber.length !== 10) {
      toast.error(t('wallet.invalid_nuban'));
      return;
    }
    
    if (user) {
      setUser({
        ...user,
        bankDetails: {
          bankName,
          accountNumber,
          accountName: user.name.toUpperCase()
        }
      });
      setIsLinking(false);
      toast.success(t('wallet.bank_linked'));
    }
  };

  const handleWithdraw = () => {
    if (!user?.bankDetails) {
      toast.error(t('wallet.link_bank_first'));
      return;
    }
    if (user.walletBalance <= 0) {
      toast.error(t('wallet.insufficient_balance'));
      return;
    }
    
    const amount = user.walletBalance;
    setUser({ ...user, walletBalance: 0 });
    toast.success(t('wallet.withdrawal_initiated', { amount: `₦${amount.toLocaleString()}` }));
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-6">
      <h2 className="text-xl font-bold">{t('wallet.my_wallet')}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">{t('wallet.available_short')}</p>
          <p className="text-xl font-bold text-slate-900">₦{user?.walletBalance.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">{t('wallet.pending_short')}</p>
          <p className="text-xl font-bold text-slate-400">₦{user?.pendingBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-yellow-400 p-2 rounded-lg text-white">
            <CirclePlus size={20} />
          </div>
          <div>
            <p className="text-xs text-yellow-800 font-medium">{t('wallet.bonus')}</p>
            <p className="text-lg font-bold text-yellow-900">{user?.bonusPoints}</p>
          </div>
        </div>
        <p className="text-xs text-yellow-700">{t('wallet.points_rate')}</p>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-slate-800">{t('wallet.bank_account')}</h3>
        {user?.bankDetails ? (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-900">{user.bankDetails.bankName}</p>
              <p className="text-sm text-slate-500">{user.bankDetails.accountNumber}</p>
              <p className="text-xs text-slate-400 mt-1">{user.bankDetails.accountName}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsLinking(true)}>{t('wallet.change')}</Button>
          </div>
        ) : (
          <Button 
            className="w-full h-24 border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:border-slate-300 rounded-2xl"
            onClick={() => setIsLinking(true)}
          >
            <CirclePlus className="mr-2" /> {t('wallet.link_bank')}
          </Button>
        )}
      </div>

      <Button 
        className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 shadow-lg"
        onClick={handleWithdraw}
        disabled={!user?.walletBalance}
      >
        {t('wallet.withdraw')}
      </Button>

      {isLinking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-sm p-6 rounded-2xl space-y-4"
          >
            <h3 className="text-lg font-bold">{t('wallet.link_bank')}</h3>
            <form onSubmit={handleLinkBank} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('wallet.select_bank')}</Label>
                <Select onValueChange={setBankName} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('wallet.placeholder_bank')} />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_BANKS.map(bank => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('wallet.account_number')}</Label>
                <Input 
                  placeholder={t('wallet.placeholder_digits')} 
                  maxLength={10} 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsLinking(false)}>
                  {t('actions.cancel')}
                </Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  {t('wallet.link_account')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};