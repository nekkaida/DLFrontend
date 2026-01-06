// src/features/feed/theme.ts

export const feedTheme = {
  colors: {
    background: '#FDFDFD',
    cardBackground: '#FEFEFE',
    primary: '#FEA04D',        // DEUCE orange
    accent: '#A04DFE',         // Purple (league/winner highlights)
    textPrimary: '#1D1D1F',
    textSecondary: '#86868B',
    textTertiary: '#AEAEB2',
    border: '#E5E5EA',
    likePink: '#FF3B5C',
    shareGreen: '#34C759',
  },
  typography: {
    feedTitle: {
      fontSize: 26,
      fontWeight: '600' as const,
      letterSpacing: -0.52,
    },
    authorName: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
    },
    authorUsername: {
      fontSize: 10,
      fontWeight: '400' as const,
      color: '#86868B',
    },
    timestamp: {
      fontSize: 8,
      fontWeight: '400' as const,
      color: '#86868B',
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    socialCount: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
    filterText: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
  },
  spacing: {
    screenPadding: 15,
    cardPadding: 12,
    avatarSize: 44,
    avatarBorderRadius: 22,
    cardBorderRadius: 16,
    sectionGap: 16,
    itemGap: 8,
  },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
  },
};
