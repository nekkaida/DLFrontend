import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface JoinMatchModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (asPartner: boolean) => void;
  matchType: 'SINGLES' | 'DOUBLES';
  loading?: boolean;
  matchDetails: {
    date: string;
    time: string;
    location: string;
    sportType: string;
  };
  partnerInfo?: {
    hasPartner: boolean;
    partnerName?: string;
    partnerImage?: string;
  };
}

export const JoinMatchModal: React.FC<JoinMatchModalProps> = ({
  visible,
  onClose,
  onConfirm,
  matchType,
  loading = false,
  matchDetails,
  partnerInfo,
}) => {
  const handleConfirm = () => {
    // For doubles, always false since they join as opponents with their partner
    // For singles, always false (join as opponent)
    onConfirm(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Join Match</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Match Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Match Details</Text>
            
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color="#6B7280" />
              <Text style={styles.detailText}>{matchDetails.date}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text style={styles.detailText}>{matchDetails.time}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color="#6B7280" />
              <Text style={styles.detailText}>{matchDetails.location}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="trophy-outline" size={18} color="#6B7280" />
              <Text style={styles.detailText}>{matchDetails.sportType}</Text>
            </View>
          </View>

          {/* Doubles - Show Partner Info or Error */}
          {matchType === 'DOUBLES' && (
            <>
              {partnerInfo?.hasPartner ? (
                <View style={styles.partnerSection}>
                  <Text style={styles.sectionTitle}>Your Team</Text>
                  <View style={styles.infoSection}>
                    <Ionicons name="people" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                      You and <Text style={styles.partnerName}>{partnerInfo.partnerName}</Text> will join as opponents
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.errorSection}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={styles.errorText}>
                    You need an active partner to join doubles matches. Please form a partnership first.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Singles Info */}
          {matchType === 'SINGLES' && (
            <View style={styles.infoSection}>
              <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                You will join this singles match as an opponent
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton, 
                loading && styles.confirmButtonDisabled,
                (matchType === 'DOUBLES' && !partnerInfo?.hasPartner) && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={loading || (matchType === 'DOUBLES' && !partnerInfo?.hasPartner)}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Join</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  partnerSection: {
    marginBottom: 20,
  },
  partnerName: {
    fontWeight: '600',
    color: '#1E40AF',
  },
  errorSection: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
