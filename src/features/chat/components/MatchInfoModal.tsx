import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MatchInfoModalProps {
  visible: boolean;
  onClose: () => void;
  matchData: {
    numberOfPlayers: string;
    sportType: string;
    location: string;
    date: string;
    time: string;
    duration: number;
    fee: string;
    courtBooked?: boolean;
    notes?: string;
  };
  creatorName: string;
  formattedDate: string;
  formattedTime: string;
  formattedEndTime: string;
}

export const MatchInfoModal: React.FC<MatchInfoModalProps> = ({
  visible,
  onClose,
  matchData,
  creatorName,
  formattedDate,
  formattedTime,
  formattedEndTime,
}) => {
  const getSportColors = () => {
    switch (matchData.sportType) {
      case 'PICKLEBALL':
        return { badge: '#A855F7', label: 'Pickleball' };
      case 'TENNIS':
        return { badge: '#22C55E', label: 'Tennis' };
      case 'PADEL':
        return { badge: '#60A5FA', label: 'Padel' };
      default:
        return { badge: '#A855F7', label: 'League' };
    }
  };

  const sportColors = getSportColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Match Information</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Match Type Badge */}
            <View style={styles.badgeContainer}>
              <View style={[styles.typeBadge, { backgroundColor: '#F3F4F6' }]}>
                <Text style={styles.typeBadgeText}>
                  {matchData.numberOfPlayers === '2' ? 'Singles' : 'Doubles'} Match
                </Text>
              </View>
              <View style={[styles.sportBadge, { borderColor: sportColors.badge }]}>
                <Text style={[styles.sportBadgeText, { color: sportColors.badge }]}>
                  {sportColors.label}
                </Text>
              </View>
            </View>

            {/* Creator */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Created By</Text>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{creatorName}</Text>
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date & Time</Text>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{formattedDate}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>
                  {formattedTime} – {formattedEndTime}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="hourglass-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{matchData.duration} hour{matchData.duration > 1 ? 's' : ''}</Text>
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{matchData.location || 'TBD'}</Text>
              </View>
            </View>

            {/* Court Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Court Status</Text>
              <View style={[
                styles.statusBadge,
                matchData.courtBooked ? styles.statusBadgeBooked : styles.statusBadgeNotBooked
              ]}>
                <Ionicons 
                  name={matchData.courtBooked ? "checkmark-circle" : "close-circle"} 
                  size={18} 
                  color={matchData.courtBooked ? "#16A34A" : "#DC2626"} 
                />
                <Text style={[
                  styles.statusText,
                  matchData.courtBooked ? styles.statusTextBooked : styles.statusTextNotBooked
                ]}>
                  Court {matchData.courtBooked ? 'booked' : 'not booked'}
                </Text>
              </View>
            </View>

            {/* Cost */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cost</Text>
              <View style={styles.infoRow}>
                <Text style={styles.costIcon}>$</Text>
                <Text style={styles.infoText}>
                  {matchData.fee === 'FREE' ? 'Free' : 'Cost Split Between Players'}
                </Text>
              </View>
            </View>

            {/* Notes */}
            {matchData.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{matchData.notes}</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeFooterButton} onPress={onClose}>
            <Text style={styles.closeFooterButtonText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  content: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  sportBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  sportBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 10,
  },
  costIcon: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    width: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeBooked: {
    backgroundColor: '#F0FDF4',
  },
  statusBadgeNotBooked: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusTextBooked: {
    color: '#16A34A',
  },
  statusTextNotBooked: {
    color: '#DC2626',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  closeFooterButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  closeFooterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});
