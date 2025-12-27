import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Cancellation reason options
const CANCELLATION_REASONS = [
  { value: 'PERSONAL_EMERGENCY', label: 'Personal Emergency' },
  { value: 'INJURY', label: 'Injury' },
  { value: 'ILLNESS', label: 'Illness' },
  { value: 'WEATHER', label: 'Bad Weather' },
  { value: 'SCHEDULING_CONFLICT', label: 'Scheduling Conflict' },
  { value: 'WORK_COMMITMENT', label: 'Work Commitment' },
  { value: 'FAMILY_EMERGENCY', label: 'Family Emergency' },
  { value: 'OTHER', label: 'Other' },
] as const;

type CancellationReason = typeof CANCELLATION_REASONS[number]['value'];

interface CancelMatchSheetProps {
  matchId: string;
  matchDate: string; // Date string like "Dec 04, 2025"
  matchTime: string; // Time string like "1:30 PM"
  onClose: () => void;
  onCancel: (data: { reason: CancellationReason; comment?: string }) => Promise<void>;
}

export const CancelMatchSheet: React.FC<CancelMatchSheetProps> = ({
  matchId,
  matchDate,
  matchTime,
  onClose,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState<CancellationReason | null>(null);
  const [comment, setComment] = useState('');
  const [isLateCancellation, setIsLateCancellation] = useState(false);
  const [hoursUntilMatch, setHoursUntilMatch] = useState<number | null>(null);

  // Calculate if this is a late cancellation (less than 4 hours before match)
  useEffect(() => {
    try {
      // Parse date using manual parsing for "Dec 04, 2025" format
      const datePartsMatch = matchDate.match(/(\w+)\s+(\d+),\s+(\d+)/);
      if (!datePartsMatch) return;

      const [, monthStr, day, year] = datePartsMatch;
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      const month = monthMap[monthStr];
      if (month === undefined) return;

      // Parse time using manual parsing for "1:30 PM" format
      const timeMatch = matchTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) return;

      const [, hourStr, minuteStr, period] = timeMatch;
      let hours = parseInt(hourStr);
      const minutes = parseInt(minuteStr);

      // Convert to 24-hour format
      if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }

      // Create match start time
      const matchStartTime = new Date(parseInt(year), month, parseInt(day), hours, minutes);
      const now = new Date();

      // Calculate hours until match
      const diffMs = matchStartTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      setHoursUntilMatch(Math.max(0, Math.round(diffHours * 10) / 10));
      setIsLateCancellation(diffHours < 4 && diffHours > 0);
    } catch (error) {
      console.error('Error calculating time until match:', error);
    }
  }, [matchDate, matchTime]);

  const handleCancel = async () => {
    if (!selectedReason) {
      Alert.alert('Select a Reason', 'Please select a reason for cancellation');
      return;
    }

    // If late cancellation, show additional warning
    if (isLateCancellation) {
      Alert.alert(
        'Late Cancellation Warning',
        'Cancelling within 4 hours of the match may result in a penalty. Are you sure you want to proceed?',
        [
          { text: 'Go Back', style: 'cancel' },
          {
            text: 'Cancel Match',
            style: 'destructive',
            onPress: async () => {
              await submitCancellation();
            },
          },
        ]
      );
    } else {
      await submitCancellation();
    }
  };

  const submitCancellation = async () => {
    try {
      setLoading(true);
      await onCancel({
        reason: selectedReason!,
        comment: comment.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error cancelling match:', error);
      Alert.alert('Error', 'Failed to cancel match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Cancel Match</Text>
          <Text style={styles.headerSubtitle}>
            Please select a reason for cancellation
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView showsVerticalScrollIndicator={false}>
        {/* Late Cancellation Warning Banner */}
        {isLateCancellation && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={24} color="#DC2626" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Late Cancellation Warning</Text>
              <Text style={styles.warningText}>
                This match is in less than 4 hours ({hoursUntilMatch?.toFixed(1)} hours).
                Late cancellations may result in penalties including:
              </Text>
              <View style={styles.penaltyList}>
                <Text style={styles.penaltyItem}>- Warning for first offense</Text>
                <Text style={styles.penaltyItem}>- Points deduction for repeat offenses</Text>
                <Text style={styles.penaltyItem}>- Possible suspension from future matches</Text>
              </View>
            </View>
          </View>
        )}

        {/* Info Banner for early cancellation */}
        {!isLateCancellation && hoursUntilMatch !== null && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              You're cancelling {hoursUntilMatch?.toFixed(1)} hours before the match.
              Cancellations made more than 4 hours in advance do not incur penalties.
            </Text>
          </View>
        )}

        {/* Reason Selection */}
        <View style={styles.reasonSection}>
          <Text style={styles.sectionTitle}>Reason for Cancellation</Text>
          <View style={styles.reasonGrid}>
            {CANCELLATION_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonButton,
                  selectedReason === reason.value && styles.reasonButtonSelected,
                ]}
                onPress={() => setSelectedReason(reason.value)}
              >
                <Text
                  style={[
                    styles.reasonButtonText,
                    selectedReason === reason.value && styles.reasonButtonTextSelected,
                  ]}
                >
                  {reason.label}
                </Text>
                {selectedReason === reason.value && (
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Additional Comments (Optional)</Text>
          <TextInput
            style={styles.commentInput}
            multiline
            numberOfLines={3}
            placeholder="Provide any additional details about your cancellation..."
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
          />
        </View>

        {/* Impact Preview */}
        <View style={styles.impactSection}>
          <Text style={styles.sectionTitle}>What Happens Next</Text>
          <View style={styles.impactItem}>
            <Ionicons name="people-outline" size={20} color="#6B7280" />
            <Text style={styles.impactText}>
              All participants will be notified of the cancellation
            </Text>
          </View>
          <View style={styles.impactItem}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text style={styles.impactText}>
              The match will be removed from all schedules
            </Text>
          </View>
          {isLateCancellation && (
            <View style={styles.impactItem}>
              <Ionicons name="shield-outline" size={20} color="#DC2626" />
              <Text style={[styles.impactText, { color: '#DC2626' }]}>
                An admin will review this late cancellation
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.keepMatchButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.keepMatchButtonText}>Keep Match</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.cancelMatchButton,
              isLateCancellation && styles.cancelMatchButtonDanger,
              (!selectedReason || loading) && styles.buttonDisabled,
            ]}
            onPress={handleCancel}
            disabled={!selectedReason || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                <Text style={styles.cancelMatchButtonText}>
                  {isLateCancellation ? 'Cancel Anyway' : 'Cancel Match'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
    marginTop: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  penaltyList: {
    marginTop: 8,
    marginLeft: 4,
  },
  penaltyItem: {
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  reasonSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reasonButtonSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  reasonButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  reasonButtonTextSelected: {
    color: '#FFFFFF',
  },
  commentSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  impactSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  impactText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  keepMatchButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  keepMatchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  cancelMatchButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelMatchButtonDanger: {
    backgroundColor: '#DC2626',
  },
  cancelMatchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
