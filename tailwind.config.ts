import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";
import { addDynamicIconSelectors } from "@iconify/tailwind";

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
        ev: {
          ink: "#0d212c",
          forest: "#0a1e14",
          mint: "#f7faf9",
          lime: "#a3e635",
          emerald: "#10b981",
          sand: "#f5f3ee",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        satoshi: ["Satoshi", "sans-serif"],
        inter: ["var(--font-sans)", "Inter", "sans-serif"],
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
        light: {
          colors: {
            background: "#F9F9FB",
            foreground: "#0F172A",
            content1: "#FFFFFF",
            content2: "#F1F5F9",
            content3: "#E2E8F0",
            content4: "#CBD5E1",
            default: {
              DEFAULT: "#F1F5F9",
              foreground: "#0F172A",
            },
            primary: {
              DEFAULT: "#0c3b2f",
              foreground: "#f9f9fb",
            },
            secondary: {
              DEFAULT: "#4A90E2",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#16A34A",
              foreground: "#FFFFFF",
            },
            warning: {
              DEFAULT: "#F59E0B",
              foreground: "#000000",
            },
            danger: {
              DEFAULT: "#DC2626",
              foreground: "#FFFFFF",
            },
          },
        },
        dark: {
          colors: {
            background: "#0F172A",
            foreground: "#F8FAFC",
            content1: "#1E293B",
            content2: "#334155",
            content3: "#475569",
            content4: "#64748B",
            default: {
              DEFAULT: "#1E293B",
              foreground: "#F8FAFC",
            },
            primary: {
              DEFAULT: "#3B82F6",
              foreground: "#F8FAFC",
            },
            secondary: {
              DEFAULT: "#60A5FA",
              foreground: "#F8FAFC",
            },
            success: {
              DEFAULT: "#22C55E",
              foreground: "#000000",
            },
            warning: {
              DEFAULT: "#FCD34D",
              foreground: "#000000",
            },
            danger: {
              DEFAULT: "#EF4444",
              foreground: "#FFFFFF",
            },
          },
        },
      },
    }),
    addDynamicIconSelectors(),
  ],
};
export default config;
