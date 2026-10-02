import React, { useEffect, useCallback } from 'react';

/**
 * useUnsavedChangesGuard
 * Prompts user with browser native dialog on page unload/refresh when isDirty is true.
 * Provides custom confirmation helper for internal navigation triggers.
 */
export const useUnsavedChangesGuard = (isDirty: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const confirmNavigation = useCallback(
    (onConfirm: () => void) => {
      if (!isDirty) {
        onConfirm();
        return;
      }

      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this page? Unsaved edits will be lost.'
      );
      if (confirmed) {
        onConfirm();
      }
    },
    [isDirty]
  );

  return { confirmNavigation };
};
