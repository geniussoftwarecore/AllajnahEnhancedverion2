import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import api from '../api/axios';
import { toast } from 'react-toastify';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'notification') {
      setNotifications(prev => [data.data, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      const notif = data.data;
      const message = localStorage.getItem('language') === 'ar' 
        ? notif.message_ar 
        : notif.message_en;
      
      toast.info(message, {
        position: 'top-left',
        autoClose: 5000,
        rtl: localStorage.getItem('language') === 'ar'
      });
    }
  }, []);

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  const fetchNotifications = useCallback(async (skip = 0, limit = 20) => {
    try {
      const response = await api.get('/notifications', {
        params: { skip, limit }
      });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread_count);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};
