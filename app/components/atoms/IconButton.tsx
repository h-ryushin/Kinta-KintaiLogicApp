import React from 'react';

export const IconButton = ({ children, onClick, className = "" }: { children: React.ReactNode, onClick: () => void, className?: string }) => (
  <button onClick={onClick} className={`p-2 transition-all active:scale-90 ${className}`}>
    {children}
  </button>
);
