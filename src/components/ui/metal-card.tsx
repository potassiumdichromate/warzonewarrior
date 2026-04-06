import * as React from 'react';
import { cn } from '@/lib/utils';

interface MetalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const MetalCard = React.forwardRef<HTMLDivElement, MetalCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative rounded-lg overflow-hidden', className)} {...props}>
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'linear-gradient(180deg, hsl(30, 15%, 28%) 0%, hsl(20, 20%, 12%) 100%)',
            boxShadow:
              'inset 0 2px 0 hsl(30 12% 40% / 0.4), inset 0 -2px 0 hsl(0 0% 0% / 0.6), 0 8px 32px hsl(0 0% 0% / 0.7)',
          }}
        />
        <div
          className="absolute inset-[4px] rounded-md"
          style={{
            background: 'linear-gradient(180deg, hsl(20, 25%, 12%) 0%, hsl(20, 30%, 8%) 100%)',
            boxShadow: 'inset 0 2px 8px hsl(0 0% 0% / 0.5)',
          }}
        />
        <div
          className="absolute top-0 left-4 right-4 h-[3px]"
          style={{
            background:
              'repeating-linear-gradient(-45deg, hsl(42, 100%, 50%), hsl(42, 100%, 50%) 3px, hsl(0, 0%, 10%) 3px, hsl(0, 0%, 10%) 6px)',
          }}
        />
        <div
          className="absolute bottom-0 left-4 right-4 h-[3px]"
          style={{
            background:
              'repeating-linear-gradient(-45deg, hsl(42, 100%, 50%), hsl(42, 100%, 50%) 3px, hsl(0, 0%, 10%) 3px, hsl(0, 0%, 10%) 6px)',
          }}
        />
        <div className="absolute top-2 left-2 rivet z-20" />
        <div className="absolute top-2 right-2 rivet z-20" />
        <div className="absolute bottom-2 left-2 rivet z-20" />
        <div className="absolute bottom-2 right-2 rivet z-20" />
        <div className="absolute top-3 left-1/4 indicator-light-red z-20" />
        <div className="absolute top-3 right-1/4 indicator-light-red z-20" />
        <div className="relative z-10 p-6">{children}</div>
      </div>
    );
  },
);
MetalCard.displayName = 'MetalCard';

export { MetalCard };
