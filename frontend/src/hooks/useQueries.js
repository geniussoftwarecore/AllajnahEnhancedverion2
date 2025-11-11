import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useRecentComplaints = (limit = 5) => {
  return useQuery({
    queryKey: ['complaints', 'recent', limit],
    queryFn: async () => {
      const response = await api.get(`/complaints?limit=${limit}`);
      return response.data.complaints || [];
    },
    staleTime: 1 * 60 * 1000,
  });
};

export const useSubscription = () => {
  return useQuery({
    queryKey: ['subscription', 'me'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/me');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};

export const useAnalytics = (filters = {}) => {
  return useQuery({
    queryKey: ['analytics', filters],
    queryFn: async () => {
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const response = await api.get('/admin/analytics', { params });
      return response.data;
    },
    staleTime: 3 * 60 * 1000,
    enabled: true,
  });
};

export const useComplaints = (filters = {}) => {
  return useQuery({
    queryKey: ['complaints', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await api.get(`/complaints?${params.toString()}`);
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
  });
};

export const useUsers = (filters = {}) => {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.is_active !== '') params.is_active = filters.is_active === 'true';
      if (filters.search) params.search = filters.search;
      const response = await api.get('/admin/users', { params });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
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
