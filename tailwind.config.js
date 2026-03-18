/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ==============================================
           UNIFIED BRAND COLOR SYSTEM (2026-03-18)
           Single source of truth for the entire app.
           ============================================== */

        // Brand — Clay/Terracotta (primary brand identity)
        // Used for: logo, primary CTAs, brand accents, hero elements
        brand: {
          DEFAULT: '#E86B4B', // clay-400 — the hero brand color
          light: '#F5BAA0',   // clay-200
          dark: '#C24B2A',    // clay-600
          50:  '#FDF1EC',
          100: '#FADDCF',
          200: '#F5BAA0',
          300: '#EF9171',
          400: '#E86B4B',
          500: '#D4553A',
          600: '#C24B2A',
          700: '#A33E22',
          800: '#85321C',
          900: '#6B2916',
        },

        // CTA — Blue (interactive elements, links, form focus)
        // Used for: buttons, links, focus rings, interactive states
        cta: {
          DEFAULT: '#1d4fd7', // primary-600
          light: '#3464f4',   // primary-500
          dark: '#1840b8',    // primary-700
          50: '#eef4ff',
          100: '#d9e7ff',
          200: '#bbcfff',
          300: '#8eaffe',
          400: '#5a86fc',
          500: '#3464f4',
          600: '#1d4fd7',
          700: '#1840b8',
          800: '#1a369a',
          900: '#1b3179',
          950: '#13214a',
        },

        // Status colors — semantic, self-explanatory
        success: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          DEFAULT: '#e8960a',
          50: '#fefaec',
          100: '#fcf0c9',
          200: '#f9de8c',
          300: '#f5c94f',
          400: '#f2b523',
          500: '#e8960a',
          600: '#c97308',
          700: '#a8530b',
          800: '#894110',
          900: '#713610',
        },
        error: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },

        // Neutral — Sand warm neutrals (backgrounds, cards, borders)
        neutral: {
          50:  '#FDFAF7',
          100: '#F9F4EE',
          200: '#F4EFE8',
          300: '#EDE8E1',
          400: '#E5DDD4',
          500: '#D5C9BE',
          600: '#B8A99A',
          700: '#9A8879',
          800: '#7D6A5C',
          900: '#614F43',
        },

        /* ==============================================
           DEPRECATED — Legacy color palettes.
           Kept to avoid breaking existing components.
           Migrate to brand/cta/success/warning/error/neutral.
           Target removal: 2026-Q2
           ============================================== */

        /** @deprecated Use `brand` instead */
        clay: {
          50:  '#FDF1EC',
          100: '#FADDCF',
          200: '#F5BAA0',
          300: '#EF9171',
          400: '#E86B4B',
          500: '#D4553A',
          600: '#C24B2A',
          700: '#A33E22',
          800: '#85321C',
          900: '#6B2916',
        },
        /** @deprecated Use `cta` instead */
        primary: {
          50: '#eef4ff',
          100: '#d9e7ff',
          200: '#bbcfff',
          300: '#8eaffe',
          400: '#5a86fc',
          500: '#3464f4',
          600: '#1d4fd7',
          700: '#1840b8',
          800: '#1a369a',
          900: '#1b3179',
          950: '#13214a',
        },
        /** @deprecated Use `warning` instead */
        secondary: {
          50: '#fefaec',
          100: '#fcf0c9',
          200: '#f9de8c',
          300: '#f5c94f',
          400: '#f2b523',
          500: '#e8960a',
          600: '#c97308',
          700: '#a8530b',
          800: '#894110',
          900: '#713610',
          950: '#421b05',
        },
        /** @deprecated Use `neutral` instead */
        sand: {
          50:  '#FDFAF7',
          100: '#F9F4EE',
          200: '#F4EFE8',
          300: '#EDE8E1',
          400: '#E5DDD4',
          500: '#D5C9BE',
          600: '#B8A99A',
          700: '#9A8879',
          800: '#7D6A5C',
          900: '#614F43',
        },
        /** @deprecated Use `success` instead */
        accent: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#022C22',
        },
      },
      /* ==============================================
         CSS VARIABLE INTEGRATION (2026-03-18)
         Maps --space-*, --radius-*, --shadow-* CSS vars
         from globals.css into Tailwind utilities.
         Use: gap-ds-4, p-ds-8, rounded-ds-lg, shadow-ds-md
         ============================================== */
      spacing: {
        'ds-1': 'var(--space-1)',   // 0.25rem
        'ds-2': 'var(--space-2)',   // 0.5rem
        'ds-3': 'var(--space-3)',   // 0.75rem
        'ds-4': 'var(--space-4)',   // 1rem
        'ds-5': 'var(--space-5)',   // 1.25rem
        'ds-6': 'var(--space-6)',   // 1.5rem
        'ds-8': 'var(--space-8)',   // 2rem
        'ds-10': 'var(--space-10)', // 2.5rem
        'ds-12': 'var(--space-12)', // 3rem
        'ds-16': 'var(--space-16)', // 4rem
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['var(--font-heading)', 'Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      letterSpacing: {
        'tighter': '-0.04em',
        'display': '-0.02em',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(29, 79, 215, 0.3)',
        'glow-lg': '0 0 40px rgba(29, 79, 215, 0.4)',
        'glow-amber': '0 0 30px rgba(232, 150, 10, 0.15)',
        'glow-gold': '0 0 30px rgba(232, 150, 10, 0.4)',
        'glow-blue': '0 0 30px rgba(52, 100, 244, 0.15)',
        'glow-emerald': '0 0 30px rgba(16, 185, 129, 0.15)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.08)',
        'premium': '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 12px 24px -8px rgba(0, 0, 0, 0.1)',
        'premium-lg': '0 25px 60px -15px rgba(0, 0, 0, 0.15)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        'glow-clay': '0 0 30px rgba(232, 107, 75, 0.3)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'card-hover': '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #3464f4 0%, #1d4fd7 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #e8960a 0%, #c97308 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
        'gradient-premium': 'linear-gradient(135deg, #e8960a 0%, #f2b523 50%, #e8960a 100%)',
        'gradient-premium-gold': 'linear-gradient(135deg, #c97308 0%, #e8960a 25%, #f2b523 50%, #e8960a 75%, #c97308 100%)',
        'gradient-premium-blue': 'linear-gradient(135deg, #1a369a 0%, #1d4fd7 50%, #3464f4 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'gradient-shine': 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%)',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-pattern': 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-down': 'fadeInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s ease-out',
        'scale-in-bounce': 'scaleInBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient-x': 'gradient-x 8s ease infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleInBounce: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '70%': { transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(232, 150, 10, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(232, 150, 10, 0.6)' },
        },
        'gradient-x': {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
        },
        counter: {
          from: { '--num': '0' },
          to: { '--num': 'var(--target)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        'ds-sm': 'var(--radius-sm)',   // 0.25rem
        'ds-md': 'var(--radius-md)',   // 0.5rem
        'ds-lg': 'var(--radius-lg)',   // 0.75rem
        'ds-xl': 'var(--radius-xl)',   // 1rem
        'ds-2xl': 'var(--radius-2xl)', // 1.5rem
      },
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-sm': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
      },
    },
  },
  plugins: [],
}
