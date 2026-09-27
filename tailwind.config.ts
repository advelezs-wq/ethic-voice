import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";
import { addDynamicIconSelectors } from "@iconify/tailwind";

const BRAND_NEUTRAL = {
  50: "#F7F6F2",
  100: "#EFEEE8",
  200: "#E3E1D9",
  300: "#CDD0C9",
  400: "#8FA2A5",
  500: "#6B7E81",
  600: "#5A6D70",
  700: "#3D5357",
  800: "#243A3F",
  900: "#12292E",
  950: "#0B1D21",
};

const BRAND_GREEN = {
  50: "#F3F8EC",
  100: "#E6F1D6",
  200: "#CFE6B0",
  300: "#B2D985",
  400: "#98D050",
  500: "#7DB83A",
  600: "#5E9427",
  700: "#44731A",
  800: "#365B16",
  900: "#2B4913",
  950: "#172A0A",
};

// Información: el pizarra del logo (#244850 = 700).
const BRAND_TEAL = {
  50: "#EEF3F3",
  100: "#DCE7E8",
  200: "#B9CFD1",
  300: "#8FB0B4",
  400: "#5E8990",
  500: "#3B6770",
  600: "#2D5660",
  700: "#244850",
  800: "#1B3940",
  900: "#132B30",
  950: "#0B1D21",
};

// Acento categórico secundario, apagado para convivir con pizarra y lima.
const BRAND_PLUM = {
  50: "#F4F1F7",
  100: "#E7E1EE",
  200: "#CFC3DD",
  300: "#B0A0C6",
  400: "#9281AE",
  500: "#7A6FA8",
  600: "#655992",
  700: "#514876",
  800: "#3D375A",
  900: "#2A263E",
  950: "#1A1727",
};

// Advertencia: ámbar de marca (#E09A2B = 500).
const BRAND_AMBER = {
  50: "#FDF6EA",
  100: "#FAEBD0",
  200: "#F4D49D",
  300: "#EDBC69",
  400: "#E6A843",
  500: "#E09A2B",
  600: "#B97B1C",
  700: "#8C5C15",
  800: "#5E3E0E",
  900: "#3F2A0A",
  950: "#231605",
};

// Riesgo / error: coral de marca (#DB4F3A = 500).
const BRAND_CORAL = {
  50: "#FCEEEB",
  100: "#F8DAD4",
  200: "#F0B2A6",
  300: "#E88977",
  400: "#E06A54",
  500: "#DB4F3A",
  600: "#B23A28",
  700: "#862B1D",
  800: "#5A1D13",
  900: "#3D140D",
  950: "#210A06",
};

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        convrt: {
          "dark-blue": "#222233",
          purple: "#6936F5",
          "purple-hover": "#5828E0",
          "purple-light": "#9B87F5",
          white: "#FFFFFF",
          "light-gray": "#F5F7FA",
          ignored: "#EA384C",
          influential: "#6936F5",
        },
        // Escalas base re-ancladas a la marca (BRAND.md § Color). Todo el
        // dashboard usa slate/gray/emerald/green/lime de Tailwind; en vez de
        // reescribir cientos de clases, las escalas mismas pasan a ser de marca:
        // neutrales cálidos→pizarra (papel → tinta) y verdes lima→musgo del logo.
        slate: BRAND_NEUTRAL,
        gray: BRAND_NEUTRAL,
        zinc: BRAND_NEUTRAL,
        emerald: BRAND_GREEN,
        green: BRAND_GREEN,
        lime: BRAND_GREEN,
        teal: BRAND_TEAL,
        sky: BRAND_TEAL,
        blue: BRAND_TEAL,
        cyan: BRAND_TEAL,
        indigo: BRAND_PLUM,
        violet: BRAND_PLUM,
        purple: BRAND_PLUM,
        fuchsia: BRAND_PLUM,
        pink: BRAND_CORAL,
        amber: BRAND_AMBER,
        orange: BRAND_AMBER,
        yellow: BRAND_AMBER,
        red: BRAND_CORAL,
        rose: BRAND_CORAL,
        // Paleta de marca EthicVoice — derivada del logotipo (ver BRAND.md).
        // slate #244850 y signal #98D050 son los dos colores exactos del logo.
        ev: {
          night: "#0B1D21",
          deep: "#12292E",
          ink: "#16323A",
          slate: "#244850",
          mute: "#5A6D70",
          haze: "#8FA2A5",
          signal: "#98D050",
          "signal-soft": "#C6E89A",
          "signal-wash": "#EEF6E2",
          moss: "#44731A",
          paper: "#F4F3EE",
          bone: "#EAE8E0",
          line: "#DCDAD1",
          coral: "#DB4F3A",
          amber: "#E09A2B",
          // Alias heredados (usados por componentes anteriores al rebrand)
          forest: "#0B1D21",
          mint: "#F4F3EE",
          lime: "#98D050",
          emerald: "#44731A",
          sand: "#F4F3EE",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // Geist en todo el producto (marketing y dashboard). Inter queda como respaldo.
        sans: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        satoshi: ["Satoshi", "sans-serif"],
        inter: ["var(--font-sans)", "Inter", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        wordmark: ["var(--font-wordmark)", "var(--font-display)", "sans-serif"],
      },
      transitionTimingFunction: {
        "ev-out": "cubic-bezier(0.23, 1, 0.32, 1)",
        "ev-in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        wave: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
          "100%": { transform: "translateY(0)" },
        },
        floating: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        gradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        parallax: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-20px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-15px) scale(1.02)" },
        },
        reveal: {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slowSpin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.5s ease-in-out",
        wave: "wave 3s ease-in-out infinite",
        floating: "floating 3s ease-in-out infinite",
        pulse: "pulse 2s ease-in-out infinite",
        gradient: "gradient 5s ease infinite alternate",
        scaleIn: "scaleIn 0.3s ease-out",
        parallax: "parallax 10s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
        reveal: "reveal 1s ease-out forwards",
        slowSpin: "slowSpin 20s linear infinite",
        marquee: "marquee 38s linear infinite",
      },
    },
  },
  plugins: [
    heroui({
      prefix: "heroui",
      addCommonColors: false,
      defaultTheme: "light",
      defaultExtendTheme: "light",
      themes: {
        // EthicVoice brand theme — mirrors the landing page (LandingV4): ink/lime/emerald,
        // not per-organization customizable. See src/modules/landig-page/components/decor.tsx
        // and tailwind.config.ts's `ev` color tokens for the same palette.
        // Tema de marca (BRAND.md): papel + tinta, primario en tinta (como los
        // CTAs sobrios del sitio), secundario en el lima del logo.
        light: {
          layout: {
            radius: { small: "8px", medium: "12px", large: "16px" },
            borderWidth: { small: "1px", medium: "1px", large: "1px" },
          },
          colors: {
            background: "#F4F3EE",
            foreground: "#0B1D21",
            divider: "#E3E1D9",
            focus: "#98D050",
            content1: "#FFFFFF",
            content2: "#F7F6F2",
            content3: "#EFEEE8",
            content4: "#E3E1D9",
            default: {
              ...BRAND_NEUTRAL,
              50: "#F7F6F2",
              100: "#EFEEE8",
              200: "#E3E1D9",
              DEFAULT: "#EFEEE8",
              foreground: "#0B1D21",
            },
            primary: {
              50: "#EEF2F1",
              100: "#DCE5E4",
              200: "#B9CACB",
              300: "#8FA2A5",
              400: "#5A6D70",
              500: "#244850",
              600: "#16323A",
              700: "#12292E",
              800: "#0B1D21",
              900: "#071316",
              DEFAULT: "#0B1D21",
              foreground: "#FFFFFF",
            },
            secondary: {
              ...BRAND_GREEN,
              DEFAULT: "#98D050",
              foreground: "#0B1D21",
            },
            success: {
              ...BRAND_GREEN,
              DEFAULT: "#5E9427",
              foreground: "#FFFFFF",
            },
            warning: {
              50: "#FDF6EA",
              100: "#FAEBD0",
              200: "#F4D49D",
              300: "#EDBC69",
              400: "#E6A843",
              500: "#E09A2B",
              600: "#B97B1C",
              700: "#8C5C15",
              800: "#5E3E0E",
              900: "#321F06",
              DEFAULT: "#E09A2B",
              foreground: "#0B1D21",
            },
            danger: {
              50: "#FCEEEB",
              100: "#F8DAD4",
              200: "#F0B2A6",
              300: "#E88977",
              400: "#E06A54",
              500: "#DB4F3A",
              600: "#B23A28",
              700: "#862B1D",
              800: "#5A1D13",
              900: "#2E0F0A",
              DEFAULT: "#DB4F3A",
              foreground: "#FFFFFF",
            },
          },
        },
        dark: {
          colors: {
            background: "#0B1D21",
            foreground: "#F4F3EE",
            divider: "#244850",
            focus: "#98D050",
            content1: "#12292E",
            content2: "#16323A",
            content3: "#1E3D44",
            content4: "#244850",
            default: {
              50: "#12292E",
              100: "#16323A",
              200: "#1E3D44",
              300: "#244850",
              400: "#3D5357",
              500: "#5A6D70",
              600: "#8FA2A5",
              700: "#CDD0C9",
              800: "#E3E1D9",
              900: "#F4F3EE",
              DEFAULT: "#16323A",
              foreground: "#F4F3EE",
            },
            primary: {
              ...BRAND_GREEN,
              DEFAULT: "#98D050",
              foreground: "#0B1D21",
            },
            secondary: {
              ...BRAND_GREEN,
              DEFAULT: "#B2D985",
              foreground: "#0B1D21",
            },
            success: { DEFAULT: "#98D050", foreground: "#0B1D21" },
            warning: { DEFAULT: "#E6A843", foreground: "#0B1D21" },
            danger: { DEFAULT: "#E06A54", foreground: "#FFFFFF" },
          },
        },
      },
    }),
    addDynamicIconSelectors(),
  ],
};
export default config;
