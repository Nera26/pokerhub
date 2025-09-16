import React from 'react';

export default function Card({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`bg-card-bg text-text-primary border border-dark rounded-2xl card-shadow ${className}`}
    />
  );
}

export function CardTitle({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...props} className={`text-xl font-bold ${className}`} />;
}

export function CardContent({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`p-6 ${className}`} />;
}
