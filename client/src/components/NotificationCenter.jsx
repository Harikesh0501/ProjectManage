import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'framer-motion';
import { X, Bell, Circle } from 'lucide-react';
import API_URL from '../config';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(res.data);

      // Count unread
      const unread = res.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(`${API_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setNotifications(notifications.map(n =>
        n._id === notificationId ? { ...n, isRead: true } : n
      ));

      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch(`${API_URL}/api/notifications/mark-all/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${API_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      meeting_created: '📹',
      meeting_joined: '👥',
      meeting_started: '▶️',
      feedback_received: '💬',
      task_assigned: '✅',
      milestone_reviewed: '🎯'
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colors = {
      meeting_created: 'bg-blue-50 border-blue-200',
      meeting_joined: 'bg-green-50 border-green-200',
      meeting_started: 'bg-yellow-50 border-yellow-200',
      feedback_received: 'bg-purple-50 border-purple-200',
      task_assigned: 'bg-orange-50 border-orange-200',
      milestone_reviewed: 'bg-pink-50 border-pink-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell size={20} />
            <div>
              <h2 className="font-bold">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-blue-100">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        {notifications.length > 0 && unreadCount > 0 && (
          <div className="px-4 py-2 border-b border-gray-200">
            <Button
              onClick={handleMarkAllAsRead}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              Mark all as read
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 border-l-4 ${getNotificationColor(notification.type)} cursor-pointer hover:bg-opacity-75 transition-all relative`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                >
                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="absolute right-2 top-2">
                      <Circle size={8} fill="currentColor" className="text-blue-600" />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-900">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification._id);
                    }}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 p-4 text-center text-xs text-gray-500">
            Notifications older than 30 days will be automatically deleted
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default NotificationCenter;
