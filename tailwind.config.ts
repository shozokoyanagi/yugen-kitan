import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f4fbf7",
          100: "#dff3e8",
          600: "#2f8f63",
          700: "#24724f",
        },
        coral: {
          50: "#fff5f1",
          500: "#ec755d",
          700: "#b84d3e",
        },
        ink: "#27312e",
      },
      boxShadow: {
        soft: "0 14px 35px rgba(37, 55, 47, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
