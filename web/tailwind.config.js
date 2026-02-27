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
      '3xl': 'var(--font-size-3xl)',
      '4xl': 'var(--font-size-4xl)',
      '5xl': 'var(--font-size-5xl)',
    },
    extend: {
      colors: {
        // Backgrounds with unified default opacities
        main: ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-bg-main) / 0.45)' 
          : `rgb(var(--color-bg-main) / ${opacityValue})`,
        
        sidebar: ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-bg-sidebar) / 0.85)' 
          : `rgb(var(--color-bg-sidebar) / ${opacityValue})`,
        
        card: ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-bg-card) / 0.65)' 
          : `rgb(var(--color-bg-card) / ${opacityValue})`,
        
        'card-hover': ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-bg-card-hover) / 0.85)' 
          : `rgb(var(--color-bg-card-hover) / ${opacityValue})`,
        
        'bg-muted': ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-bg-muted) / 0.25)' 
          : `rgb(var(--color-bg-muted) / ${opacityValue})`,
        
        glass: ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-bg-glass) / 0.35)' 
          : `rgb(var(--color-bg-glass) / ${opacityValue})`,
        
        'glass-deep': ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-bg-glass-deep) / 0.75)' 
          : `rgb(var(--color-bg-glass-deep) / ${opacityValue})`,
        
        dropdown: ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-bg-dropdown) / 0.95)' 
          : `rgb(var(--color-bg-dropdown) / ${opacityValue})`,
        
        tooltip: ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-bg-tooltip) / 0.98)' 
          : `rgb(var(--color-bg-tooltip) / ${opacityValue})`,
        
        input: ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-bg-input) / 0.6)' 
          : `rgb(var(--color-bg-input) / ${opacityValue})`,
        
        console: ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-bg-console) / 0.95)' 
          : `rgb(var(--color-bg-console) / ${opacityValue})`,
        
        editor: ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-bg-editor) / 0.85)' 
          : `rgb(var(--color-bg-editor) / ${opacityValue})`,

        // Text (Usually opaque)
        primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        white: 'rgb(var(--color-text-white) / <alpha-value>)',
        button: 'rgb(var(--color-text-button) / <alpha-value>)',
        'tooltip-text': 'rgb(var(--color-text-tooltip) / <alpha-value>)',
        'input-text': 'rgb(var(--color-text-input) / <alpha-value>)',
        'editor-code': 'rgb(var(--color-text-editor-code) / <alpha-value>)',

        // Status Colors
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--color-accent-hover) / <alpha-value>)',
        info: 'rgb(var(--color-text-info) / <alpha-value>)',
        success: 'rgb(var(--color-text-success) / <alpha-value>)',
        warning: 'rgb(var(--color-text-warning) / <alpha-value>)',
        error: 'rgb(var(--color-text-error) / <alpha-value>)',
        purple: 'rgb(var(--color-text-purple) / <alpha-value>)',
        orange: 'rgb(var(--color-text-orange) / <alpha-value>)',
        cyan: 'rgb(var(--color-text-cyan) / <alpha-value>)',

        // Borders with unified default opacity
        border: ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-border-color) / 0.5)' 
          : `rgb(var(--color-border-color) / ${opacityValue})`,
        
        'border-muted': ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-border-muted) / 0.3)' 
          : `rgb(var(--color-border-muted) / ${opacityValue})`,
        
        'border-tooltip': ({ opacityValue }) => opacityValue === undefined 
          ? 'rgb(var(--color-border-tooltip) / 0.6)' 
          : `rgb(var(--color-border-tooltip) / ${opacityValue})`,
      },
      sidebarHover: 'rgb(var(--color-bg-card-hover) / 0.2)',
    },
  },
  plugins: [],
}
