/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [ 
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        extend: {
          colors: {
            theme: {
              50: 'var(--theme-50)',
              100: 'var(--theme-100)',
              200: 'var(--theme-200)',
              300: 'var(--theme-300)',
              400: 'var(--theme-400)',
              500: 'var(--theme-500)',
              600: 'var(--theme-600)',
              700: 'var(--theme-700)',
              800: 'var(--theme-800)',
              900: 'var(--theme-900)',
              950: 'var(--theme-950)',
              primary: 'var(--theme-primary)',
              'primary-hover': 'var(--theme-primary-hover)',
              'primary-foreground': 'var(--theme-primary-foreground)',
              success: 'var(--theme-success)',
              'success-light': 'var(--theme-success-light)',
              warning: 'var(--theme-warning)',
              'warning-light': 'var(--theme-warning-light)',
              danger: 'var(--theme-danger)',
              'danger-light': 'var(--theme-danger-light)',
              'danger-hover': 'var(--theme-danger-hover)',
              'danger-foreground': 'var(--theme-danger-foreground)',
              neutral: {
                50: 'var(--theme-neutral-50)',
                100: 'var(--theme-neutral-100)',
                200: 'var(--theme-neutral-200)',
                300: 'var(--theme-neutral-300)',
                400: 'var(--theme-neutral-400)',
                500: 'var(--theme-neutral-500)',
                600: 'var(--theme-neutral-600)',
                700: 'var(--theme-neutral-700)',
                800: 'var(--theme-neutral-800)',
                900: 'var(--theme-neutral-900)',
                950: 'var(--theme-neutral-950)',
              },
              primary: 'var(--theme-primary)',
              'primary-hover': 'var(--theme-primary-hover)',
              'primary-foreground': 'var(--theme-primary-foreground)',
              success: {
                50: 'var(--theme-success-50)',
                100: 'var(--theme-success-100)',
                500: 'var(--theme-success-500)',
                700: 'var(--theme-success-700)',
              },
              warning: {
                50: 'var(--theme-warning-50)',
                100: 'var(--theme-warning-100)',
                500: 'var(--theme-warning-500)',
                700: 'var(--theme-warning-700)',
              },
              danger: {
                50: 'var(--theme-danger-50)',
                100: 'var(--theme-danger-100)',
                500: 'var(--theme-danger-500)',
                700: 'var(--theme-danger-700)',
              },
              info: {
                50: 'var(--theme-info-50)',
                100: 'var(--theme-info-100)',
                500: 'var(--theme-info-500)',
                700: 'var(--theme-info-700)',
              },
              purple: {
                50: 'var(--theme-purple-50)',
                100: 'var(--theme-purple-100)',
                500: 'var(--theme-purple-500)',
                700: 'var(--theme-purple-700)',
              }
            },
          },
        },
      },
    },
    plugins: [],
  };
  