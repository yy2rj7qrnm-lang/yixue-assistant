import React, { createContext, useContext, useState, ReactNode } from 'react';
import theme from '../../styles/theme';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

interface AppContextType {
  theme: typeof theme;
  notifications: Notification[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  removeNotification: (id: string) => void;
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentRoute, setCurrentRoute] = useState<string>('Home');

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string
  ) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, notification]);

    // 3秒后自动移除
    setTimeout(() => {
      removeNotification(notification.id);
    }, 3000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        notifications,
        showNotification,
        removeNotification,
        currentRoute,
        setCurrentRoute,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
