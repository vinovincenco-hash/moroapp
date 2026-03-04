/**
 * MoroApp Design System
 * Analog zu MoroWeb: Weiß/Silber dominant, Schwarz Akzente, Gold Highlights
 */

export const Colors = {
  // White/Silver (Dominant)
  white: '#ffffff',
  silver100: '#f8f9fa',
  silver200: '#e9ecef',
  silver300: '#dee2e6',
  silver400: '#ced4da',
  silver500: '#adb5bd',
  silver600: '#888e94',
  silver700: '#6c757d',

  // Black (Accents)
  black: '#000000',
  blackSoft: '#1a1a1a',
  anthracite800: '#2d2d2d',
  anthracite700: '#3a3a3a',

  // Gold (Highlights)
  goldLight: '#ffd700',
  gold: '#d4af37',
  goldDark: '#b8972b',
  goldMetallic: '#c5a572',

  // Functional
  error: '#dc3545',
  errorLight: '#f8d7da',
  success: '#28a745',
  successLight: '#d4edda',
  warning: '#ffc107',
  warningLight: '#fff3cd',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.12)',
  shadowDeep: 'rgba(0, 0, 0, 0.16)',
}

export const Gradients = {
  whiteSilver: ['#ffffff', '#f8f9fa', '#e9ecef'],
  silver: ['#f8f9fa', '#e9ecef', '#dee2e6'],
  gold: ['#ffd700', '#d4af37', '#b8972b'],
  blackAccent: ['#2d2d2d', '#1a1a1a'],
}

export const Shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  deep: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  gold: {
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
}
