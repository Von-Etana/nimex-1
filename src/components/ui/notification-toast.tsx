import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface NotificationToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  visible: boolean;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  message,
  visible,
  onClose
}) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: AlertCircle
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  const Icon = icons[type];

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm text-white ${colors[type]}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Close notification"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};