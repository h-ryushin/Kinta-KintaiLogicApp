import React from 'react';

interface CapsLabelProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export const CapsLabel: React.FC<CapsLabelProps> = ({ 
  children, 
  color = "text-slate-400", 
  className = "" 
}) => (
  <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${color} ${className}`}>
    {children}
  </p>
);