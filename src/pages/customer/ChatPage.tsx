import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Send, CircleCheck } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Message, Task } from '../../types';

export const ChatPage: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, messages, addMessage, addTask } = useAppContext();
  const [inputText, setInputText] = useState('');
  const { t } = useTranslation();
  const [priceAgreed, setPriceAgreed] = useState(false);
  const selectedChores = location.state?.selectedChores || [];

  const chatMessages = messages.filter(m => 
    (m.senderId === user?.id && m.receiverId === id) ||
    (m.senderId === id && m.receiverId === user?.id)
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.id,
      receiverId: id!,
      text: inputText,
      timestamp: new Date().toISOString()
    };

    addMessage(newMessage);
    setInputText('');

    // Mock response
    setTimeout(() => {
      const response: Message = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: id!,
        receiverId: user.id,
        text: t('chat.i_can_do', { amount: '₦3,500' }),
        timestamp: new Date().toISOString()
      };
      addMessage(response);
      setPriceAgreed(true);
    }, 1500);
  };

  const handleBook = () => {
    if (!user || !id) return;
    
    const newTask: Task = {
      id: 't' + Math.random().toString(36).substr(2, 5),
      customerId: user.id,
      completerId: id,
      chores: selectedChores,
      status: 'pending',
      price: 3500,
      createdAt: new Date().toISOString()
    };
    
    addTask(newTask);
    toast.success(t('task.task_booked'));
    navigate('/customer/tasks');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-md mx-auto bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              msg.senderId === user?.id 
                ? 'bg-green-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 rounded-tl-none shadow-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {priceAgreed && (
          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-center space-y-3">
            <p className="text-sm font-medium text-yellow-800">{t('chat.price_agreed', { amount: '₦3,500' })}</p>
            <Button onClick={handleBook} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
              {t('chat.confirm_pay')}
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSend} className="flex space-x-2">
          <Input 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('chat.type_message')}
            className="flex-1"
          />
          <Button type="submit" size="icon" className="bg-green-600 hover:bg-green-700">
            <Send size={20} />
          </Button>
        </form>
      </div>
    </div>
  );
};