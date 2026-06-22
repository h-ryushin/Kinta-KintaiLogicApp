import React from 'react';

interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContainer: React.FC<CardContainerProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-[1.5rem] p-5 border border-slate-200 shadow-sm transition-all ${className}`}>
    {children}
  </div>
);