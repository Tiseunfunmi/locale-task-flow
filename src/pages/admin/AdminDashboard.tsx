import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ClipboardList, TriangleAlert, TrendingUp,
  BadgeCheck, ShieldCheck, ShieldX, Clock, Eye,
  UserCheck, UserX, FileText, MapPin, Hash,
  Search, LoaderCircle, Filter, ChevronDown, ChevronUp,
  CircleCheck, CircleX, X, CalendarDays
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type VerificationStatus = 'pending' | 'approved' | 'rejected';

interface Verification {
  id: string;
  user_id: string;
  status: VerificationStatus;
  photo_url: string;
  address: string;
  nin: string;
  dob: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  profiles?: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } },
};

const statusBadge = (status: VerificationStatus) => {
  const map: Record<VerificationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
    pending: { label: 'Pending', variant: 'secondary', icon: Clock },
    approved: { label: 'Approved', variant: 'default', icon: CircleCheck },
    rejected: { label: 'Rejected', variant: 'destructive', icon: CircleX },
  };
  const { label, variant, icon: Icon } = map[status];
  return (
    <Badge variant={variant} className="gap-1.5 capitalize">
      <Icon size={14} /> {label}
    </Badge>
  );
};

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { tasks } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'all'>('all');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('verifications')
        .select('*, profiles!user_id(full_name, email, phone)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Note: search filtering is done client-side via filteredVerifications below
      // PostgREST .or() does not support filtering on embedded resources (profiles.*)

      const { data, error } = await query;
      if (error) throw error;
      setVerifications(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load verifications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (activeTab === 'verifications') {
      fetchVerifications();
    }
  }, [activeTab, fetchVerifications]);

  const handleAction = async (verificationId: string, action: 'approved' | 'rejected') => {
    setActionLoading(verificationId);
    try {
      const { error } = await supabase
        .from('verifications')
        .update({ status: action, reviewed_at: new Date().toISOString() })
        .eq('id', verificationId);

      if (error) throw error;

      toast.success(`Verification ${action} successfully`);
      fetchVerifications();
      if (selectedVerification?.id === verificationId) {
        setSelectedVerification(prev => prev ? { ...prev, status: action } : null);
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action} verification`);
    } finally {
      setActionLoading(null);
    }
  };

  const stats = [
    { title: t('admin.total_users'), value: '1,248', icon: Users, color: 'text-blue-600' },
    { title: t('admin.active_jobs'), value: tasks.length.toString(), icon: ClipboardList, color: 'text-green-600' },
    { title: t('admin.open_disputes'), value: '3', icon: TriangleAlert, color: 'text-red-600' },
    { title: t('admin.total_volume'), value: '₦4.2M', icon: TrendingUp, color: 'text-purple-600' },
  ];

  const verificationStats = [
    {
      title: 'Total Requests',
      value: verifications.length,
      icon: FileText,
      color: 'text-slate-600',
    },
    {
      title: 'Pending',
      value: verifications.filter(v => v.status === 'pending').length,
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      title: 'Approved',
      value: verifications.filter(v => v.status === 'approved').length,
      icon: BadgeCheck,
      color: 'text-emerald-600',
    },
    {
      title: 'Rejected',
      value: verifications.filter(v => v.status === 'rejected').length,
      icon: ShieldX,
      color: 'text-red-600',
    },
  ];

  const filteredVerifications = verifications.filter(v => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = v.profiles?.full_name?.toLowerCase() || '';
      const email = v.profiles?.email?.toLowerCase() || '';
      const nin = v.nin?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || nin.includes(q);
    }
    return true;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your platform from one place</p>
          </div>
          <TabsList className="bg-slate-100 p-1 self-start">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="verifications" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Verifications
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-8 mt-0">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat) => (
              <motion.div key={stat.title} variants={itemVariants}>
                <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-slate-500">{stat.title}</CardTitle>
                    <stat.icon className={stat.color} size={20} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Recent Transactions</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.task_id')}</TableHead>
                  <TableHead>{t('admin.customer_col')}</TableHead>
                  <TableHead>{t('admin.completer_col')}</TableHead>
                  <TableHead>{t('admin.amount')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead>{t('admin.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-mono text-xs">{task.id}</TableCell>
                    <TableCell>User_{task.customerId.slice(0, 4)}</TableCell>
                    <TableCell>Comp_{task.completerId.slice(0, 4)}</TableCell>
                    <TableCell className="font-semibold">₦{task.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                        {task.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      {t('admin.no_transactions')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </motion.div>
        </TabsContent>

        <TabsContent value="verifications" className="space-y-6 mt-0">
          {/* Verification Stats */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {verificationStats.map((stat) => (
              <motion.div key={stat.title} variants={itemVariants}>
                <Card className="border-slate-100 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
                    <CardTitle className="text-xs font-medium text-slate-500">{stat.title}</CardTitle>
                    <stat.icon className={stat.color} size={18} />
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search by name, email, or NIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-slate-200"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="border-slate-200"
              >
                <Filter size={16} />
              </Button>
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="border-slate-200"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
                className="border-slate-200"
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('approved')}
                className="border-slate-200"
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('rejected')}
                className="border-slate-200"
              >
                Rejected
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <LoaderCircle className="animate-spin text-slate-400" size={32} />
              </div>
            ) : filteredVerifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <ShieldCheck size={48} className="mb-3 text-slate-300" />
                <p className="text-lg font-medium text-slate-500">No verifications found</p>
                <p className="text-sm mt-1">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No verification requests yet'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">NIN</TableHead>
                    <TableHead className="hidden lg:table-cell">Address</TableHead>
                    <TableHead className="hidden md:table-cell">Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredVerifications.map((v) => (
                      <motion.tr
                        key={v.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-slate-200">
                              <AvatarImage src={v.photo_url} alt={v.profiles?.full_name || 'User'} />
                              <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                                {(v.profiles?.full_name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{v.profiles?.full_name || 'Unknown User'}</p>
                              <p className="text-xs text-slate-500">{v.profiles?.email || ''}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="font-mono text-xs text-slate-600">{v.nin}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-slate-600 max-w-[160px] inline-block truncate">{v.address}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs text-slate-500">{formatDate(v.created_at)}</span>
                        </TableCell>
                        <TableCell>{statusBadge(v.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedVerification(v);
                                setDetailOpen(true);
                              }}
                            >
                              <Eye size={16} className="text-slate-500" />
                            </Button>
                            {v.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600"
                                  onClick={() => handleAction(v.id, 'approved')}
                                  disabled={actionLoading === v.id}
                                >
                                  {actionLoading === v.id ? (
                                    <LoaderCircle size={16} className="animate-spin" />
                                  ) : (
                                    <UserCheck size={16} />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => handleAction(v.id, 'rejected')}
                                  disabled={actionLoading === v.id}
                                >
                                  {actionLoading === v.id ? (
                                    <LoaderCircle size={16} className="animate-spin" />
                                  ) : (
                                    <UserX size={16} />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedVerification && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-200">
                    <AvatarImage src={selectedVerification.photo_url} alt={selectedVerification.profiles?.full_name} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-sm font-medium">
                      {(selectedVerification.profiles?.full_name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base">{selectedVerification.profiles?.full_name || 'Unknown User'}</p>
                    <p className="text-sm font-normal text-slate-500">{selectedVerification.profiles?.email}</p>
                  </div>
                </DialogTitle>
                <DialogDescription className="sr-only">Verification details for {selectedVerification.profiles?.full_name}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-600">Status</span>
                  {statusBadge(selectedVerification.status)}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Hash size={12} /> NIN
                    </div>
                    <p className="text-sm font-mono font-medium">{selectedVerification.nin}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={12} /> Address
                    </div>
                    <p className="text-sm font-medium">{selectedVerification.address}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays size={12} /> Date of Birth
                    </div>
                    <p className="text-sm font-medium">{selectedVerification.dob}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={12} /> Submitted
                    </div>
                    <p className="text-sm font-medium">{formatDate(selectedVerification.created_at)}</p>
                  </div>
                </div>

                {/* Photo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <FileText size={12} /> Verification Photo
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={selectedVerification.photo_url}
                      alt="Verification document"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>

                {/* Actions */}
                {selectedVerification.status === 'pending' && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                      onClick={() => handleAction(selectedVerification.id, 'approved')}
                      disabled={actionLoading === selectedVerification.id}
                    >
                      {actionLoading === selectedVerification.id ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <CircleCheck size={16} />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-2"
                      onClick={() => handleAction(selectedVerification.id, 'rejected')}
                      disabled={actionLoading === selectedVerification.id}
                    >
                      {actionLoading === selectedVerification.id ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <CircleX size={16} />
                      )}
                      Reject
                    </Button>
                  </div>
                )}
                {selectedVerification.status !== 'pending' && (
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-500 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-slate-400" />
                    This verification was <strong className="text-slate-700 mx-1">{selectedVerification.status}</strong> on {formatDate(selectedVerification.reviewed_at)}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};