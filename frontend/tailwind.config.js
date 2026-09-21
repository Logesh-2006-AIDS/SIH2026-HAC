/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink, #080a08)",
        panel: "var(--panel, #101311)",
        "panel-elevated": "var(--panel-elevated, #161b17)",
        parchment: "var(--parchment, #f1ebdd)",
        muted: "var(--muted, #8a948c)",
        gold: {
          DEFAULT: "var(--gold, #d9aa3d)",
          dim: "var(--gold-dim, #8c6717)",
        },
        signal: "var(--signal, #d62828)",
        ok: "var(--ok, #5e9f68)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        stats: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
