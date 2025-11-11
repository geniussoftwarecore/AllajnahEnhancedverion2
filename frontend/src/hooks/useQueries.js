import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export const useDashboardStats = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!user,
  });
};

export const useRecentComplaints = (limit = 5) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['complaints', 'recent', user?.id, limit],
    queryFn: async () => {
      const response = await api.get(`/complaints?limit=${limit}`);
      return response.data.complaints || [];
    },
    staleTime: 1 * 60 * 1000,
    enabled: !!user,
  });
};

export const useSubscription = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['subscription', 'me', user?.id],
    queryFn: async () => {
      const response = await api.get('/subscriptions/me');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !!user,
  });
};

export const useAnalytics = (filters = {}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['analytics', user?.id, filters],
    queryFn: async () => {
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const response = await api.get('/admin/analytics', { params });
      return response.data;
    },
    staleTime: 3 * 60 * 1000,
    enabled: !!user,
  });
};

export const useComplaints = (filters = {}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['complaints', user?.id, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await api.get(`/complaints?${params.toString()}`);
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
    enabled: !!user,
  });
};

export const useUsers = (filters = {}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['users', user?.id, filters],
    queryFn: async () => {
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.is_active !== '') params.is_active = filters.is_active === 'true';
      if (filters.search) params.search = filters.search;
      const response = await api.get('/admin/users', { params });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!user,
  });
};

export const useEscalatedComplaints = (limit = 10) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['complaints', 'escalated', user?.id, limit],
    queryFn: async () => {
      const response = await api.get(`/complaints?limit=${limit}&status=ESCALATED`);
      return response.data.complaints || [];
    },
    staleTime: 1 * 60 * 1000,
    enabled: !!user,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

export const usePayments = (statusFilter = 'all') => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['payments', user?.id, statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/payments', { params });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!user,
  });
};

export const useMerchantRequests = (statusFilter = 'all') => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['merchantRequests', user?.id, statusFilter],
    queryFn: async () => {
      const response = await api.get('/admin/merchant-requests', {
        params: { status_filter: statusFilter }
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!user,
  });
};

export const useAuditLogs = (filters = {}) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['auditLogs', user?.id, filters],
    queryFn: async () => {
      const params = {};
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.action) params.action = filters.action;
      if (filters.target_type) params.target_type = filters.target_type;
      params.limit = filters.limit || 50;
      params.offset = filters.offset || 0;
      const response = await api.get('/admin/audit-logs', { params });
      return response.data;
    },
    staleTime: 3 * 60 * 1000,
    enabled: !!user,
  });
};

export const useQuickReplies = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['quickReplies', user?.id],
    queryFn: async () => {
      const response = await api.get('/quick-replies');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });
};

export const useComplaintMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (complaintData) => {
      const response = await api.post('/complaints', complaintData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};
