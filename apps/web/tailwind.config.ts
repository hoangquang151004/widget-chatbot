import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "error": "#ba1a1a",
        "primary-container": "#4f46e5",
        "surface-container-highest": "#e4e1e6",
        "on-surface": "#1b1b1e",
        "on-secondary-fixed-variant": "#46464e",
        "on-primary-fixed": "#0f0069",
        "on-primary-fixed-variant": "#3323cc",
        "surface-container-high": "#eae7eb",
        "tertiary-container": "#a44100",
        "surface-bright": "#fbf8fc",
        "primary-fixed": "#e2dfff",
        "background": "#fbf8fc",
        "on-tertiary-fixed": "#351000",
        "tertiary": "#7e3000",
        "surface-dim": "#dcd9dd",
        "outline": "#777587",
        "primary": "#3525cd",
        "on-primary": "#ffffff",
        "inverse-surface": "#303033",
        "on-error-container": "#93000a",
        "surface": "#fbf8fc",
        "surface-container-lowest": "#ffffff",
        "secondary": "#5d5e66",
        "on-secondary-fixed": "#1a1b22",
        "secondary-fixed-dim": "#c6c5cf",
        "tertiary-fixed": "#ffdbcc",
        "inverse-primary": "#c3c0ff",
        "surface-tint": "#4d44e3",
        "on-primary-container": "#dad7ff",
        "secondary-fixed": "#e3e1ec",
        "on-secondary-container": "#63646c",
        "on-error": "#ffffff",
        "inverse-on-surface": "#f3f0f4",
        "outline-variant": "#c7c4d8",
        "surface-container": "#f0edf1",
        "on-tertiary-container": "#ffd2be",
        "on-surface-variant": "#464555",
        "on-background": "#1b1b1e",
        "error-container": "#ffdad6",
        "on-secondary": "#ffffff",
        "primary-fixed-dim": "#c3c0ff",
        "tertiary-fixed-dim": "#ffb695",
        "on-tertiary": "#ffffff",
        "secondary-container": "#e3e1ec",
        "on-tertiary-fixed-variant": "#7b2f00",
        "surface-variant": "#e4e1e6",
        "surface-container-low": "#f6f2f7"
      },
      fontFamily: {
        "headline": ["Inter", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};

export default config;
