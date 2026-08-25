// Tailwind runtime configuration.
// Maps Tailwind color/font utility names onto the CSS custom properties
// defined in css/styles.css, so classes like `bg-accentSoft` or
// `text-muted` follow the light/dark theme tokens automatically.
tailwind.config = {
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        border: 'var(--border)',
        ink: 'var(--text)',
        muted: 'var(--text-muted)',
        accent: 'var(--accent)',
        accentSoft: 'var(--accent-soft)',
        good: 'var(--good)',
        goodSoft: 'var(--good-soft)',
        warn: 'var(--warning)',
        warnSoft: 'var(--warning-soft)',
        bad: 'var(--critical)',
        badSoft: 'var(--critical-soft)',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    }
  }
};
