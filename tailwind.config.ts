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
        geo: {
          bg: "#0f1117",
          surface: "#1a1d27",
          surface2: "#232735",
          border: "#2d3142",
          text: "#e8e9ed",
          text2: "#9a9db0",
          accent: "#6c63ff",
          green: "#34d399",
          yellow: "#fbbf24",
          orange: "#fb923c",
          red: "#f87171",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
