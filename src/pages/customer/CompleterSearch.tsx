import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ChoreCategory, User } from '../../types';
import { motion } from 'framer-motion';

const MOCK_COMPLETERS: User[] = [
  {
    id: 'c1',
    name: 'Musa Ibrahim',
    phone: '08022334455',
    role: 'completer',
    language: 'ha',
    photo: 'https://storage.googleapis.com/dala-prod-public-storage/generated-images/b79e0029-b83f-40c6-a326-b173816b95ca/task-completer-profile-1-95c6d465-1783559082613.webp',
    bio: 'Professional cleaner and market errand runner with 5 years experience serving OAU Campus and Ile-Ife.',
    address: 'Ile-Ife (OAU Campus)',
    services: ['wash_clothes_hand', 'clean_house', 'go_to_market'],
    rating: 4.8,
    reviewCount: 124,
    walletBalance: 5000,
    pendingBalance: 0,
    bonusPoints: 1200,
  },
  {
    id: 'c2',
    name: 'Amina Adebayo',
    phone: '08033445566',
    role: 'completer',
    language: 'yo',
    photo: 'https://storage.googleapis.com/dala-prod-public-storage/generated-images/b79e0029-b83f-40c6-a326-b173816b95ca/task-completer-profile-2-bd32e176-1783559081823.webp',
    bio: 'Expert home chef and laundry specialist. I handle machine and hand wash.',
    address: 'OAU Gate, Ile-Ife',
    services: ['wash_clothes_machine', 'cook_meal', 'wash_plates'],
    rating: 4.9,
    reviewCount: 89,
    walletBalance: 8500,
    pendingBalance: 0,
    bonusPoints: 900,
  }
];

export const CompleterSearch: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedChores = (location.state?.selectedChores || []) as ChoreCategory[];

  const filteredCompleters = MOCK_COMPLETERS.filter(c => 
    selectedChores.length === 0 || 
    c.services?.some(s => selectedChores.includes(s))
  );

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
        <h2 className="text-xl font-bold">Task Completers</h2>
      </div>

      {filteredCompleters.map((completer, index) => (
        <motion.div
          key={completer.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col space-y-3"
        >
          <div className="flex items-start space-x-4">
            <img 
              src={completer.photo} 
              alt={completer.name} 
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">{completer.name}</h3>
              <div className="flex items-center text-yellow-500 text-sm">
                <Star size={14} fill="currentColor" />
                <span className="ml-1 font-semibold">{completer.rating}</span>
                <span className="text-slate-400 ml-1">({completer.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center text-slate-500 text-xs mt-1">
                <MapPin size={12} className="mr-1" />
                {completer.address}
              </div>
            </div>
          </div>
          
          <p className="text-sm text-slate-600 line-clamp-2">
            {completer.bio}
          </p>

          <div className="flex flex-wrap gap-1">
            {completer.services?.map(s => (
              <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px]">
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>

          <Button 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => navigate(`/customer/chat/${completer.id}`, { state: { selectedChores } })}
          >
            Chat & Negotiate
          </Button>
        </motion.div>
      ))}

      {filteredCompleters.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">No Task Completers found for these chores.</p>
        </div>
      )}
    </div>
  );
};