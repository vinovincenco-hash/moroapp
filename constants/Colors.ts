/**
 * AmpX Design System
 * Dark Theme: Black dominant, Gold highlights, Silver accents
 */

export const Colors = {
  // Background (Dark Theme)
  bg: '#0A0E27',
  bgCard: '#1a1a2e',
  bgInput: '#16213e',
  bgHover: 'rgba(212, 175, 55, 0.05)',

  // White (text on dark)
  white: '#ffffff',
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  // Silver (Metallic accents)
  silver100: '#E8E8E8',
  silver200: '#D1D5DB',
  silver300: '#C0C0C0',
  silver400: '#9CA3AF',
  silver500: '#808080',
  silver600: '#6B7280',
  silver700: '#4B5563',

  // Black
  black: '#0A0E27',
  blackSoft: '#1a1a2e',
  anthracite800: '#16213e',
  anthracite700: '#1f2937',

  // Gold (Primary Brand)
  goldLight: '#E8D5A8',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  goldMetallic: '#c5a572',

  // Borders
  border: '#374151',
  borderLight: '#4B5563',
  borderGold: 'rgba(212, 175, 55, 0.3)',

  // Functional
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.1)',
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.1)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.1)',
  info: '#3B82F6',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDeep: 'rgba(0, 0, 0, 0.5)',
  shadowGold: 'rgba(212, 175, 55, 0.25)',
}

export const Gradients = {
  dark: ['#0A0E27', '#1a1a2e'],
  gold: ['#D4AF37', '#E8D5A8'],
  goldDark: ['#B8860B', '#D4AF37'],
  metal: ['#E8E8E8', '#C0C0C0', '#808080'],
}

export const Shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  deep: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
}
