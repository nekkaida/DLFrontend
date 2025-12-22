import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
export const isSmallScreen = width < 375;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    marginTop: -20,
    paddingTop: 20,
    zIndex: 1,
  },
  // Header styles
  header: {
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    position: 'relative',
    zIndex: 10,
  },
  headerTopRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#863A73',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  // Chip styles
  chipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: isSmallScreen ? 16 : 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  // List styles
  listContent: {
    padding: isSmallScreen ? 16 : 20,
    paddingBottom: 100,
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export const matchCardStyles = StyleSheet.create({
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: isSmallScreen ? 16 : 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 4,
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  playerColumn: {
    alignItems: 'center',
    gap: 4,
  },
  playerAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  playerImageLarge: {
    width: '100%',
    height: '100%',
  },
  defaultPlayerAvatarLarge: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8B4BC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPlayerTextLarge: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  playerNameText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1C1E',
    maxWidth: 60,
    textAlign: 'center',
  },
  emptySlotColumn: {
    alignItems: 'center',
    gap: 4,
  },
  emptySlotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  emptySlotCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  emptySlotText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  leagueBadgeCard: {
    backgroundColor: '#FEA04D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  leagueBadgeCardText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  cardInfoSection: {
    gap: 8,
  },
  matchTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 4,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardInfoText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  feeIcon: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 16,
    textAlign: 'center',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cardStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cardStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryStatusText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});

export const invitationCardStyles = StyleSheet.create({
  invitationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inviterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  inviterAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  defaultInviterAvatar: {
    backgroundColor: '#FEA04D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviterInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  inviterTextContainer: {
    flex: 1,
  },
  inviterNameSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1C1E',
  },
  invitationSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  sportBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sportBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  invitationBody: {
    gap: 6,
  },
  matchTypeSmall: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 2,
  },
  divisionInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FEA04D',
    marginBottom: 6,
  },
  invitationDetails: {
    gap: 4,
  },
  infoRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoTextSmall: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
  },
  expiryWarningText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '500',
  },
  invitationActionsCompact: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  declineButtonCompact: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  declineButtonTextCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  acceptButtonCompact: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEA04D',
  },
  acceptButtonTextCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export const filterModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  filterOptionActive: {
    backgroundColor: '#863A73',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#863A73',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
