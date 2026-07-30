import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Task, Language, Message } from '../types';
import { supabase } from '../integrations/supabase/client';
import i18n from '../i18n';

interface AppContextType {
  user: User | null;
  tasks: Task[];
  messages: Message[];
  setUser: (user: User | null) => void;
  updateLanguage: (lang: Language) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addMessage: (msg: Message) => void;
  completeTask: (taskId: string, rating: number) => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('taskmate_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('taskmate_messages');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('taskmate_user', JSON.stringify(user));
      i18n.changeLanguage(user.language);
    } else {
      localStorage.removeItem('taskmate_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('taskmate_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('taskmate_messages', JSON.stringify(messages));
  }, [messages]);

  const setUser = useCallback((newUser: User | null) => setUserState(newUser), []);

  const updateLanguage = useCallback((lang: Language) => {
    setUserState(prev => prev ? { ...prev, language: lang } : prev);
    i18n.changeLanguage(lang);
  }, []);

  const addTask = useCallback((task: Task) => setTasks(prev => [...prev, task]), []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  }, []);

  const addMessage = useCallback((msg: Message) => setMessages(prev => [...prev, msg]), []);

  const completeTask = useCallback((taskId: string, rating: number) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task || task.status === 'completed') return prev;
      return prev.map(t => t.id === taskId ? { ...t, status: 'completed' as const, rating } : t);
    });
    console.log(`Task ${taskId} completed with rating ${rating}`);
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase?.auth?.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setUserState(null);
    setTasks([]);
    setMessages([]);
    localStorage.removeItem('taskmate_user');
    localStorage.removeItem('taskmate_tasks');
    localStorage.removeItem('taskmate_messages');
  }, []);

  return (
    <AppContext.Provider value={{ 
      user, tasks, messages, 
      setUser, updateLanguage, addTask, updateTask, addMessage, completeTask, logout 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};