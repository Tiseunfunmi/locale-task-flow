import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { Task } from '../../types';
import { CircleCheck, Clock, CircleAlert, Star } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomerTasks: React.FC = () => {
  const { t } = useTranslation();
  const { user, tasks, updateTask, completeTask } = useAppContext();
  const [ratingTask, setRatingTask] = useState<Task | null>(null);
  const [selectedRating, setSelectedRating] = useState(5);

  const customerTasks = tasks.filter(t => t.customerId === user?.id);

  const handleComplete = (task: Task) => {
    const releaseTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    updateTask(task.id, { 
      status: 'awaiting_release', 
      completedAt: new Date().toISOString(),
      releaseTime 
    });
    setRatingTask(task);
    toast.success(t('task.task_complete'));
  };

  const submitRating = () => {
    if (!ratingTask) return;
    completeTask(ratingTask.id, selectedRating);
    setRatingTask(null);
    toast.success(t('task.thanks_review'));
  };

  const getStatusIcon = (status: Task['status']) => {
    switch(status) {
      case 'completed': return <CircleCheck className="text-green-500" size={16} />;
      case 'awaiting_release': return <Clock className="text-yellow-500" size={16} />;
      default: return <Clock className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold mb-4">{t('task.my_tasks')}</h2>
      
      {customerTasks.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {t('task.no_tasks')}
        </div>
      ) : (
        customerTasks.map(task => (
          <div key={task.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  {format(new Date(task.createdAt), 'MMM d, yyyy')}
                </p>
                <h3 className="font-bold text-slate-900">
                  {task.chores.map(c => c.replace(/_/g, ' ')).join(', ')}
                </h3>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">₦{task.price.toLocaleString()}</p>
                <div className="flex items-center justify-end text-xs space-x-1 mt-1">
                  {getStatusIcon(task.status)}
                  <span className="capitalize">{task.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>

            {task.status === 'pending' && (
              <Button 
                variant="outline" 
                className="w-full border-green-600 text-green-600 hover:bg-green-50"
                onClick={() => handleComplete(task)}
              >
                {t('task.mark_complete')}
              </Button>
            )}

            {task.status === 'awaiting_release' && (
              <div className="flex flex-col space-y-2">
                <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded-lg flex items-center">
                  <CircleAlert size={14} className="mr-2" />
                  {t('task.escrow_release')}
                </div>
                <Button variant="ghost" size="sm" className="text-red-500 text-xs">
                  {t('task.report_issue')}
                </Button>
              </div>
            )}
          </div>
        ))
      )}

      <AnimatePresence>
        {ratingTask && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-sm p-6 rounded-2xl space-y-4 text-center"
            >
              <h3 className="text-lg font-bold">{t('task.rate_completer')}</h3>
              <p className="text-sm text-slate-500">{t('task.rate_service')}</p>
              
              <div className="flex justify-center space-x-2 py-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    size={32}
                    fill={star <= selectedRating ? '#eab308' : 'none'}
                    className={star <= selectedRating ? 'text-yellow-500' : 'text-slate-300 cursor-pointer'}
                    onClick={() => setSelectedRating(star)}
                  />
                ))}
              </div>

              <Button className="w-full bg-green-600 hover:bg-green-700" onClick={submitRating}>
                {t('task.submit_review')}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};