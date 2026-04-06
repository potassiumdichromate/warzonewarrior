import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const gameButtonVariants = cva(
  'inline-flex items-center justify-center font-russo uppercase tracking-wider transition-all duration-200 relative overflow-hidden',
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-b from-primary to-sunset-red',
          'text-primary-foreground font-bold',
          'border-2 border-primary/60',
          'shadow-lg shadow-primary/30',
          'hover:shadow-xl hover:shadow-primary/50 hover:brightness-110',
          'hover:scale-105',
          'active:scale-95',
        ],
        military: [
          'bg-gradient-to-b from-military to-military-dark',
          'text-accent-foreground font-bold',
          'border-2 border-military/50',
          'shadow-lg shadow-military/30',
          'hover:shadow-xl hover:shadow-military/50',
          'hover:scale-105',
          'active:scale-95',
        ],
        metal: [
          'bg-metal',
          'text-foreground font-bold',
          'border-2 border-metal-light/40',
          'shadow-lg',
          'hover:brightness-110',
          'hover:scale-105',
          'active:scale-95',
        ],
        gold: [
          'text-primary-foreground font-black',
          'border-2 border-gold/70',
          'shadow-lg shadow-gold/40',
          'hover:shadow-xl hover:shadow-gold/60 hover:brightness-110',
          'hover:scale-105',
          'active:scale-95',
        ],
        outline: [
          'bg-transparent',
          'text-foreground font-bold',
          'border-2 border-foreground/30',
          'hover:border-primary',
          'hover:text-primary',
          'hover:scale-105',
        ],
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-md',
        md: 'h-11 px-6 text-base rounded-lg',
        lg: 'h-14 px-8 text-lg rounded-lg',
        xl: 'h-16 px-10 text-xl rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface GameButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gameButtonVariants> {}

const GameButton = React.forwardRef<HTMLButtonElement, GameButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    const isGold = variant === 'gold';
    return (
      <button
        className={cn(gameButtonVariants({ variant, size, className }))}
        ref={ref}
        style={
          isGold
            ? {
                background:
                  'linear-gradient(180deg, hsl(45, 100%, 65%) 0%, hsl(38, 90%, 42%) 60%, hsl(30, 80%, 30%) 100%)',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                boxShadow:
                  'inset 0 2px 0 hsl(50 100% 80% / 0.4), inset 0 -2px 0 hsl(30 80% 20% / 0.6), 0 4px 16px hsl(42 100% 50% / 0.3)',
              }
            : undefined
        }
        {...props}
      >
        {children}
      </button>
    );
  },
);
GameButton.displayName = 'GameButton';

export { GameButton, gameButtonVariants };
