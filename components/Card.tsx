
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, className = '', subtitle }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
