type LogLevel = 'info' | 'error' | 'warn';

interface Logger {
  info: (message: string, ...args: any[]) => void;
  error: (message: string, error?: any) => void;
  warn: (message: string, ...args: any[]) => void;
}

const sanitizeError = (error: any): string => {
  if (!error) return 'Unknown error';

  // For Supabase errors, return message if available
  if (error.message) return error.message;

  // For generic errors
  if (typeof error === 'string') return error;

  // Fallback
  return 'An error occurred';
};

const createLogger = (): Logger => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const log = (level: LogLevel, message: string, ...args: any[]) => {
    // In production, we might want to suppress info logs but keep errors
    if (!isDevelopment && level !== 'error') return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'info':
        console.log(formattedMessage, ...args);
        break;
      case 'error':
        console.error(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
    }
  };

  return {
    info: (message: string, ...args: any[]) => log('info', message, ...args),
    error: (message: string, error?: any, context?: any) => {
      const sanitizedMessage = sanitizeError(error);
      const fullMessage = context ? `${message}: ${sanitizedMessage}` : message;
      log('error', fullMessage, error, context);
    },
    warn: (message: string, ...args: any[]) => log('warn', message, ...args),
  };
};

export const logger = createLogger();