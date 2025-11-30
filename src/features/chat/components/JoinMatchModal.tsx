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
}

export const JoinMatchModal: React.FC<JoinMatchModalProps> = ({
  visible,
  onClose,
  onConfirm,
  matchType,
  loading = false,
  matchDetails,
}) => {
  const [selectedRole, setSelectedRole] = useState<'opponent' | 'partner'>('opponent');

  const handleConfirm = () => {
    const asPartner = selectedRole === 'partner';
    onConfirm(asPartner);
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

          {/* Role Selection for Doubles */}
          {matchType === 'DOUBLES' && (
            <View style={styles.roleSection}>
              <Text style={styles.sectionTitle}>Join as</Text>
              
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'opponent' && styles.roleOptionSelected,
                ]}
                onPress={() => setSelectedRole('opponent')}
              >
                <View style={styles.roleContent}>
                  <View style={[
                    styles.radioOuter,
                    selectedRole === 'opponent' && styles.radioOuterSelected,
                  ]}>
                    {selectedRole === 'opponent' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Opponent</Text>
                    <Text style={styles.roleDescription}>Join the opposing team</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'partner' && styles.roleOptionSelected,
                ]}
                onPress={() => setSelectedRole('partner')}
              >
                <View style={styles.roleContent}>
                  <View style={[
                    styles.radioOuter,
                    selectedRole === 'partner' && styles.radioOuterSelected,
                  ]}>
                    {selectedRole === 'partner' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Partner</Text>
                    <Text style={styles.roleDescription}>Join as the creator's partner</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
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
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={loading}
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
  roleSection: {
    marginBottom: 20,
  },
  roleOption: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  roleOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: '#3B82F6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: 13,
    color: '#6B7280',
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
