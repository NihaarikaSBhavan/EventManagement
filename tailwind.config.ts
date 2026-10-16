import type { Config } from 'tailwindcss';

const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        subtle: token('subtle'),
        muted: token('muted'),
        line: token('line'),
        'line-strong': token('line-strong'),
        fg: token('fg'),
        'fg-muted': token('fg-muted'),
        'fg-subtle': token('fg-subtle'),
        primary: token('primary'),
        'primary-hover': token('primary-hover'),
        'primary-fg': token('primary-fg'),
        'primary-soft': token('primary-soft'),
        success: token('success'),
        'success-soft': token('success-soft'),
        warning: token('warning'),
        'warning-soft': token('warning-soft'),
        danger: token('danger'),
        'danger-soft': token('danger-soft'),
        chart: { 1: token('chart-1'), 2: token('chart-2'), 3: token('chart-3'), 4: token('chart-4') },
      },
      fontSize: { '2xs': ['0.6875rem', { lineHeight: '1rem' }] },
      borderRadius: { DEFAULT: '0.5rem' },
      boxShadow: { overlay: '0 16px 48px -12px rgb(0 0 0 / 0.28), 0 0 0 1px rgb(0 0 0 / 0.04)' },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'dialog-in': { from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.98)' }, to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' } },
      },
      animation: { 'fade-in': 'fade-in 120ms ease-out', 'dialog-in': 'dialog-in 160ms cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
  plugins: [],
} satisfies Config;
