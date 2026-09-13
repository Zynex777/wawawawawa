import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F5F1",
        ink: "#1B1D2A",
        line: "#E1DED3",
        muted: "#8A8778",
        cobalt: "#2C4FE6",
        coral: "#FF5A36",
        success: "#1F9D63",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "Roboto",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
