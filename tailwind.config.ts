import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#f43f5e", // rose-500
        },
        secondary: {
          DEFAULT: "#1e293b", // slate-800
        },
      },
    },
  },
  plugins: [],
};
export default config;
