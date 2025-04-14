import React from 'react';
import { twMerge } from 'tailwind-merge';

export const TitleText = ({ children }: { children: React.ReactNode }) => {
  return <h1 className="text-4xl font-bold mb-4">{children}</h1>;
};

export const SubtitleText = ({ children }: { children: React.ReactNode }) => {
  return <h2 className="text-2xl font-bold mb-4">{children}</h2>;
};

export const Panel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={twMerge(className, 'bg-gray-900 p-4 rounded-lg')}>
      {children}
    </div>
  );
};
