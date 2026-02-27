/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Implement the modular scale for typography.
    // Base size is 14px, other sizes are derived from it.
    fontSize: {
      'xs': 'var(--font-size-xs)',   // 10px
      'sm': 'var(--font-size-sm)',   // 13px
      'base': 'var(--font-size-base)', // 14px (Base)
      'lg': 'var(--font-size-lg)',   // 17.5px (Base * 1.25)
      'xl': 'var(--font-size-xl)',   // 21.875px (LG * 1.25)
      '2xl': 'var(--font-size-2xl)', // 27.34px (XL * 1.25)
    },
    extend: {
      // Map the CSS variables to Tailwind's color system.
      // This allows for semantic class names like `bg-main`, `text-primary`.
      colors: {
        // Backgrounds
        main: 'var(--bg-main)',
        sidebar: 'var(--bg-sidebar)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        muted: 'var(--bg-muted)',
        glass: 'var(--bg-glass)',
        'glass-deep': 'var(--bg-glass-deep)',
        dropdown: 'var(--bg-dropdown)',
        tooltip: 'var(--bg-tooltip)',
        input: 'var(--bg-input)',
        console: 'var(--bg-console)',
        editor: 'var(--bg-editor)',

        // Text
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        white: 'var(--text-white)',
        button: 'var(--text-button)',
        'tooltip-text': 'var(--text-tooltip)', // Renamed to avoid conflict
        'input-text': 'var(--text-input)',       // Renamed to avoid conflict
        'editor-code': 'var(--text-editor-code)',

        // Status & Accent Colors
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        info: 'var(--text-info)',
        success: 'var(--text-success)',
        warning: 'var(--text-warning)',
        error: 'var(--text-error)',
        purple: 'var(--text-purple)',
        orange: 'var(--text-orange)',
        cyan: 'var(--text-cyan)',

        // Borders
        DEFAULT: 'var(--border-color)', // Allows using just `border-border`
        muted: 'var(--border-muted)',
        tooltip: 'var(--border-tooltip)',
      },
      // Sidebar hover color
      sidebarHover: 'var(--sidebar-hover)',
    },
  },
  // Disable DaisyUI theming to use our custom CSS variable system exclusively.
  plugins: [require("daisyui")],
  daisyui: {
    themes: false, // Prevent DaisyUI from injecting its own themes and variables.
    logs: false, // Silence DaisyUI logs in the console.
  },
}
