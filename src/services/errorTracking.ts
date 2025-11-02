/**
 * Error tracking and monitoring service for NIMEX application
 * Provides centralized error handling, logging, and performance monitoring
 */

import React from 'react';

interface ErrorContext {
  userId?: string;
  userRole?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

class ErrorTrackingService {
  private isEnabled: boolean;
  private errors: Array<{ error: Error; context: ErrorContext; timestamp: number }> = [];
  private performanceMetrics: PerformanceMetric[] = [];

  constructor() {
    this.isEnabled = import.meta.env.PROD; // Only enable in production
  }

  /**
   * Captures and logs an error with context information
   * @param error - The error object to track
   * @param context - Additional context about where/when the error occurred
   */
  captureError(error: Error, context: ErrorContext = {}): void {
    const errorEntry = {
      error,
      context,
      timestamp: Date.now()
    };

    this.errors.push(errorEntry);

    // Log to console in development
    if (!this.isEnabled) {
      console.error('Error captured:', {
        message: error.message,
        stack: error.stack,
        context
      });
    }

    // In production, you would send to error tracking service
    if (this.isEnabled) {
      this.sendToErrorTrackingService(errorEntry);
    }

    // Keep only last 100 errors to prevent memory leaks
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  /**
   * Captures a performance metric
   * @param name - Name of the metric (e.g., 'api_response_time', 'component_render_time')
   * @param value - Numeric value of the metric
   * @param context - Additional context about the metric
   */
  captureMetric(name: string, value: number, context: Record<string, any> = {}): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context
    };

    this.performanceMetrics.push(metric);

    // Log to console in development
    if (!this.isEnabled) {
      console.log(`Performance metric: ${name} = ${value}`, context);
    }

    // Keep only last 1000 metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  /**
   * Measures execution time of a function
   * @param fn - Function to measure
   * @param name - Name for the performance metric
   * @param context - Additional context
   * @returns Result of the function execution
   */
  async measureExecutionTime<T>(
    fn: () => Promise<T> | T,
    name: string,
    context: Record<string, any> = {}
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const endTime = performance.now();
      this.captureMetric(name, endTime - startTime, context);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.captureMetric(`${name}_error`, endTime - startTime, { ...context, error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Gets recent errors for debugging
   * @param limit - Maximum number of errors to return
   * @returns Array of recent errors
   */
  getRecentErrors(limit: number = 10): Array<{ error: Error; context: ErrorContext; timestamp: number }> {
    return this.errors.slice(-limit);
  }

  /**
   * Gets recent performance metrics
   * @param limit - Maximum number of metrics to return
   * @returns Array of recent performance metrics
   */
  getRecentMetrics(limit: number = 10): PerformanceMetric[] {
    return this.performanceMetrics.slice(-limit);
  }

  /**
   * Clears all stored errors and metrics (useful for testing)
   */
  clear(): void {
    this.errors = [];
    this.performanceMetrics = [];
  }

  /**
   * Sends error to external error tracking service
   * @param errorEntry - Error entry to send
   * @private
   */
  private sendToErrorTrackingService(errorEntry: any): void {
    // In a real implementation, you would send to services like:
    // - Sentry
    // - LogRocket
    // - Bugsnag
    // - Rollbar
    // - DataDog

    // Example implementation:
    /*
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorEntry)
    }).catch(err => console.error('Failed to send error to tracking service:', err));
    */

    // For now, just log that we would send it
    console.log('Would send error to tracking service:', errorEntry);
  }
}

// Create singleton instance
export const errorTracking = new ErrorTrackingService();

// React Error Boundary integration
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorTracking.captureError(error, {
      component: 'ErrorBoundary',
      metadata: {
        errorInfo,
        componentStack: errorInfo.componentStack
      }
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return React.createElement(FallbackComponent, {
          error: this.state.error,
          resetError: () => this.setState({ hasError: false, error: null })
        });
      }

      return React.createElement('div', {
        className: 'min-h-screen bg-white flex items-center justify-center p-6'
      }, React.createElement('div', {
        className: 'max-w-md w-full text-center'
      }, [
        React.createElement('div', { className: 'mb-6', key: 'content' }, [
          React.createElement('div', {
            className: 'w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4',
            key: 'icon'
          }, React.createElement('svg', {
            className: 'w-10 h-10 text-red-600',
            fill: 'none',
            viewBox: '0 0 24 24',
            stroke: 'currentColor'
          }, React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
          }))),
          React.createElement('h1', {
            className: 'font-heading font-bold text-2xl text-neutral-900 mb-2',
            key: 'title'
          }, 'Something went wrong'),
          React.createElement('p', {
            className: 'font-sans text-neutral-600 mb-4',
            key: 'message'
          }, 'An unexpected error occurred. Our team has been notified.')
        ]),
        React.createElement('button', {
          onClick: () => this.setState({ hasError: false, error: null }),
          className: 'w-full h-12 bg-primary-500 hover:bg-primary-600 text-white font-sans font-semibold rounded-lg transition-colors',
          key: 'button'
        }, 'Try Again')
      ]));
    }

    return this.props.children;
  }
}

// Performance monitoring hooks
export const usePerformanceTracking = () => {
  const measureAsync = React.useCallback(async <T,>(
    fn: () => Promise<T>,
    name: string,
    context: Record<string, any> = {}
  ): Promise<T> => {
    return errorTracking.measureExecutionTime(fn, name, context);
  }, []);

  const measureSync = React.useCallback(<T,>(
    fn: () => T,
    name: string,
    context: Record<string, any> = {}
  ): T => {
    const startTime = performance.now();
    try {
      const result = fn();
      const endTime = performance.now();
      errorTracking.captureMetric(name, endTime - startTime, context);
      return result;
    } catch (error) {
      const endTime = performance.now();
      errorTracking.captureMetric(`${name}_error`, endTime - startTime, { ...context, error: (error as Error).message });
      throw error;
    }
  }, []);

  return { measureAsync, measureSync };
};

// Global error handler
window.addEventListener('error', (event) => {
  errorTracking.captureError(event.error, {
    component: 'GlobalErrorHandler',
    metadata: {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorTracking.captureError(new Error(event.reason), {
    component: 'UnhandledPromiseRejection',
    metadata: {
      reason: event.reason
    }
  });
});