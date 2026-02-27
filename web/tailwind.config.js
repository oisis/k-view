/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontSize: {
      'xs': 'var(--font-size-xs)',
      'sm': 'var(--font-size-sm)',
      'base': 'var(--font-size-base)',
      'lg': 'var(--font-size-lg)',
      'xl': 'var(--font-size-xl)',
      '2xl': 'var(--font-size-2xl)',
    },
    extend: {
      colors: {
        // Backgrounds
        main: 'rgb(var(--color-bg-main) / <alpha-value>)',
        sidebar: 'rgb(var(--color-bg-sidebar) / <alpha-value>)',
        card: 'rgb(var(--color-bg-card) / <alpha-value>)',
        'card-hover': 'rgb(var(--color-bg-card-hover) / <alpha-value>)',
        'bg-muted': 'rgb(var(--color-bg-muted) / <alpha-value>)',
        glass: 'rgb(var(--color-bg-glass) / <alpha-value>)',
        'glass-deep': 'rgb(var(--color-bg-glass-deep) / <alpha-value>)',
        dropdown: 'rgb(var(--color-bg-dropdown) / <alpha-value>)',
        tooltip: 'rgb(var(--color-bg-tooltip) / <alpha-value>)',
        input: 'rgb(var(--color-bg-input) / <alpha-value>)',
        console: 'rgb(var(--color-bg-console) / <alpha-value>)',
        editor: 'rgb(var(--color-bg-editor) / <alpha-value>)',

        // Text
        primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        white: 'rgb(var(--color-text-white) / <alpha-value>)',
        button: 'rgb(var(--color-text-button) / <alpha-value>)',
        'tooltip-text': 'rgb(var(--color-text-tooltip) / <alpha-value>)',
        'input-text': 'rgb(var(--color-text-input) / <alpha-value>)',
        'editor-code': 'rgb(var(--color-text-editor-code) / <alpha-value>)',

        // Status & Accent Colors
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--color-accent-hover) / <alpha-value>)',
        info: 'rgb(var(--color-text-info) / <alpha-value>)',
        success: 'rgb(var(--color-text-success) / <alpha-value>)',
        warning: 'rgb(var(--color-text-warning) / <alpha-value>)',
        error: 'rgb(var(--color-text-error) / <alpha-value>)',
        purple: 'rgb(var(--color-text-purple) / <alpha-value>)',
        orange: 'rgb(var(--color-text-orange) / <alpha-value>)',
        cyan: 'rgb(var(--color-text-cyan) / <alpha-value>)',

        // Borders
        border: 'rgb(var(--color-border-color) / <alpha-value>)',
        'border-muted': 'rgb(var(--color-border-muted) / <alpha-value>)',
        'border-tooltip': 'rgb(var(--color-border-tooltip) / <alpha-value>)',
      },
      sidebarHover: 'rgb(var(--color-bg-card-hover) / <alpha-value>)',
    },
  },
  plugins: [],
}
