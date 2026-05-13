/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        canvas: "#f8fafc",
        primary: "#6366f1",
        success: "#16a34a",
        warning: "#eab308",
        danger: "#dc2626",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out",
      },
      backgroundImage: {
        hero: "radial-gradient(circle at top left, rgba(99,102,241,0.20), transparent 40%), linear-gradient(135deg, #ffffff 0%, #eef2ff 55%, #e2e8f0 100%)",
      },
    },
  },
  plugins: [],
};
