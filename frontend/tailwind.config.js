/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Primary "ink" tone — deep warm charcoal, replaces the old
        // all-purple brand color. Keeps the `plum` key so every existing
        // class (bg-plum, text-plum-dark, border-plum…) keeps working.
        plum: {
          DEFAULT: "#26241F",
          dark: "#16150F",
          light: "#524F45",
        },
        // Muted, premium gold — the single accent color used for CTAs,
        // ratings and highlights.
        gold: {
          DEFAULT: "#B08A3E",
          light: "#E1C989",
          foil: "#EFDCA5",
        },
        // Subtle purple accent — used sparingly (badges, small highlights)
        // instead of as the base palette.
        accent: {
          DEFAULT: "#6E5A96",
          light: "#B8A9D6",
        },
        rose: {
          DEFAULT: "#B4735A",
          light: "#D9AC96",
        },
        teal: {
          DEFAULT: "#3E6B66",
          light: "#93B8B2",
        },
        cream: "#FBF9F5",
        panel: "#F4F1EA",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Cambria", "Georgia", "serif"],
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["Inter", "Calibri", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 16px -6px rgba(22, 21, 15, 0.10)",
        cardHover: "0 12px 28px -10px rgba(22, 21, 15, 0.18)",
        glow: "0 0 32px -10px rgba(176, 138, 62, 0.45)",
      },
      backgroundImage: {
        "radial-fade": "radial-gradient(circle at center, var(--tw-gradient-stops))",
        "mesh-hero-neutral":
          "linear-gradient(180deg, rgba(22,21,15,0.55) 0%, rgba(22,21,15,0.35) 45%, rgba(22,21,15,0.85) 100%)",
        "mesh-panel":
          "radial-gradient(at 15% 15%, rgba(110,90,150,0.05) 0px, transparent 50%), radial-gradient(at 85% 85%, rgba(176,138,62,0.06) 0px, transparent 50%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-500px 0" },
          "100%": { backgroundPosition: "500px 0" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "fade-crossfade": {
          "0%, 100%": { opacity: 0 },
          "50%": { opacity: 1 },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "gradient-x": "gradient-x 8s ease infinite",
      },
      backgroundSize: {
        "300%": "300% 300%",
      },
    },
  },
  plugins: [],
};
