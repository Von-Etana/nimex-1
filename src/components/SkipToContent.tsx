import React from 'react';

/**
 * Skip-to-content link for keyboard users.
 * Place this as the first focusable element inside the <body>.
 */
export const SkipToContent: React.FC<{ targetId?: string }> = ({ targetId = 'main-content' }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-green-700 focus:text-white focus:rounded-lg focus:font-medium"
    >
      Skip to main content
    </a>
  );
};
