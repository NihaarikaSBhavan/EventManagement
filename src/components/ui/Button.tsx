import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const variants = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover border-transparent',
  secondary: 'bg-surface text-fg border-line-strong hover:bg-subtle',
  ghost: 'bg-transparent text-fg-muted border-transparent hover:bg-muted hover:text-fg',
  success: 'bg-success text-white border-transparent hover:brightness-110 dark:text-canvas',
  danger: 'bg-surface text-danger border-line-strong hover:bg-danger-soft',
  link: 'bg-transparent border-transparent px-0 text-primary hover:underline underline-offset-4 h-auto',
} as const;

const sizes = {
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  md: 'h-8 px-3 text-[13px] gap-2 rounded-md',
  lg: 'h-10 px-4 text-sm gap-2 rounded-lg',
  icon: 'h-8 w-8 rounded-md',
  'icon-sm': 'h-7 w-7 rounded-md',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap border font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-3.5 [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
