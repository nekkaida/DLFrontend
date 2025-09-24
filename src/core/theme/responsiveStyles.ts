import { StyleSheet } from 'react-native';
import { typography } from './typography';
import { spacing, dashboardSpacing, safeSpacing } from './spacing';
import { getComponentSizes, getLayoutConfig, getScreenDimensions } from '../utils/responsive';

// Get responsive values
const componentSizes = getComponentSizes();
const layoutConfig = getLayoutConfig();
const { isTablet } = getScreenDimensions();

// Common responsive styles that can be reused across components
export const responsiveStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  safeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: safeSpacing.top,
  },

  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: dashboardSpacing.scrollContent.paddingHorizontal,
    paddingBottom: dashboardSpacing.scrollContent.paddingBottom,
  },

  contentContainer: {
    flex: 1,
    zIndex: 1,
  },

  // Header styles
  headerSection: {
    paddingHorizontal: dashboardSpacing.header.padding.horizontal,
    paddingTop: dashboardSpacing.header.padding.top,
    paddingBottom: dashboardSpacing.header.padding.bottom,
  },

  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  // Logo styles
  logoText: {
    ...typography.dashboard.logo,
    color: '#FE9F4D',
  },

  // Profile picture styles
  profilePicture: {
    width: componentSizes.avatar.small,
    height: componentSizes.avatar.small,
    borderRadius: componentSizes.avatar.small / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  profileImage: {
    width: componentSizes.avatar.small,
    height: componentSizes.avatar.small,
    borderRadius: componentSizes.avatar.small / 2,
  },

  // Section title styles
  sectionTitle: {
    ...typography.dashboard.sectionTitle,
    color: '#333333',
    marginBottom: spacing.md,
  },

  sportSelectionText: {
    ...typography.dashboard.sectionTitle,
    color: '#1A1C1E',
  },

  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: componentSizes.card.borderRadius,
    padding: componentSizes.card.padding,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  sportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: componentSizes.card.borderRadius,
    padding: dashboardSpacing.sportCard.padding,
    marginBottom: dashboardSpacing.sportCard.margin,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: componentSizes.card.borderRadius,
    padding: dashboardSpacing.newsCard.padding,
    marginBottom: dashboardSpacing.newsCard.margin,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Sport card specific styles
  sportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dashboardSpacing.sportCard.buttonMargin,
  },

  sportIconContainer: {
    marginRight: dashboardSpacing.sportCard.iconMargin,
  },

  sportIcon: {
    width: componentSizes.icon.large + 12, // Extra size for sport icons
    height: componentSizes.icon.large + 12,
    borderRadius: (componentSizes.icon.large + 12) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sportIconText: {
    fontSize: componentSizes.icon.medium,
  },

  sportInfo: {
    flex: 1,
  },

  sportName: {
    ...typography.dashboard.sportName,
  },

  // Player count styles
  playerCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  playerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: spacing.sm,
  },

  playerCountText: {
    ...typography.dashboard.cardTitle,
    color: '#6B7280',
  },

  // Button styles
  sportButton: {
    borderRadius: 12,
    paddingVertical: componentSizes.button.medium / 3,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },

  sportButtonText: {
    ...typography.dashboard.buttonText,
    color: '#FFFFFF',
  },

  // News card styles
  newsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dashboardSpacing.newsCard.headerMargin,
  },

  newsIconContainer: {
    marginRight: dashboardSpacing.newsCard.iconMargin,
  },

  newsIconText: {
    fontSize: componentSizes.icon.medium,
  },

  newsInfo: {
    flex: 1,
  },

  newsTitle: {
    ...typography.dashboard.sectionTitle,
    fontSize: typography.dashboard.sectionTitle.fontSize * 0.9, // Slightly smaller
    color: '#1A1C1E',
    marginBottom: 4,
  },

  newsSubtitle: {
    ...typography.dashboard.cardTitle,
    color: '#6B7280',
  },

  newsTime: {
    alignItems: 'flex-end',
  },

  newsTimeText: {
    ...typography.caption.medium,
    color: '#9CA3AF',
  },

  newsPlaceholder: {
    ...typography.dashboard.cardTitle,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },

  // Section spacing
  section: {
    marginBottom: dashboardSpacing.section.marginBottom,
  },

  sportSelectionHeader: {
    marginBottom: spacing.lg,
  },

  sportCardsContainer: {
    marginBottom: spacing.lg,
    // Add responsive grid for tablets
    ...(isTablet && {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    }),
  },

  // Tablet-specific sport card
  ...(isTablet && {
    sportCardTablet: {
      width: `${(100 - 4) / layoutConfig.sportCardColumns}%`, // Account for gaps
      marginBottom: dashboardSpacing.sportCard.margin,
    },
  }),

  // Background gradient
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%', // Percentage-based height
  },
});

// Export additional responsive helper styles
export const responsiveHelpers = {
  // Flex helpers
  flex: {
    row: { flexDirection: 'row' as const },
    column: { flexDirection: 'column' as const },
    center: { justifyContent: 'center' as const, alignItems: 'center' as const },
    spaceBetween: { justifyContent: 'space-between' as const },
    alignCenter: { alignItems: 'center' as const },
  },

  // Spacing helpers
  margin: {
    xs: { margin: spacing.xs },
    sm: { margin: spacing.sm },
    md: { margin: spacing.md },
    lg: { margin: spacing.lg },
    xl: { margin: spacing.xl },
    bottom: {
      xs: { marginBottom: spacing.xs },
      sm: { marginBottom: spacing.sm },
      md: { marginBottom: spacing.md },
      lg: { marginBottom: spacing.lg },
      xl: { marginBottom: spacing.xl },
    },
    top: {
      xs: { marginTop: spacing.xs },
      sm: { marginTop: spacing.sm },
      md: { marginTop: spacing.md },
      lg: { marginTop: spacing.lg },
      xl: { marginTop: spacing.xl },
    },
  },

  padding: {
    xs: { padding: spacing.xs },
    sm: { padding: spacing.sm },
    md: { padding: spacing.md },
    lg: { padding: spacing.lg },
    xl: { padding: spacing.xl },
    horizontal: {
      xs: { paddingHorizontal: spacing.xs },
      sm: { paddingHorizontal: spacing.sm },
      md: { paddingHorizontal: spacing.md },
      lg: { paddingHorizontal: spacing.lg },
      xl: { paddingHorizontal: spacing.xl },
    },
    vertical: {
      xs: { paddingVertical: spacing.xs },
      sm: { paddingVertical: spacing.sm },
      md: { paddingVertical: spacing.md },
      lg: { paddingVertical: spacing.lg },
      xl: { paddingVertical: spacing.xl },
    },
  },

  // Shadow helpers
  shadow: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    heavy: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};