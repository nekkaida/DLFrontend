import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LeagueInfo {
  name: string;
  season?: string;
  division?: string;
  sportType: 'PICKLEBALL' | 'TENNIS' | 'PADEL';
}

interface CreateMatchModalProps {
  visible: boolean;
  onClose: () => void;
  leagueInfo: LeagueInfo;
  onCreateMatch: (matchData: MatchFormData) => void;
}

export interface MatchFormData {
  date: string;
  time: string;
  duration: number;
  numberOfPlayers: string;
  location: string;
  fee: 'FREE' | 'SPLIT';
  description: string;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  visible,
  onClose,
  leagueInfo,
  onCreateMatch,
}) => {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState<MatchFormData>({
    date: '',
    time: '',
    duration: 2,
    numberOfPlayers: '',
    location: '',
    fee: 'FREE',
    description: '',
  });

  // Get sport-specific colors
  const getSportColors = () => {
    switch (leagueInfo.sportType) {
      case 'PICKLEBALL':
        return { background: '#863A73', badge: '#A855F7', label: 'Pickleball' };
      case 'TENNIS':
        return { background: '#65B741', badge: '#22C55E', label: 'Tennis' };
      case 'PADEL':
        return { background: '#3B82F6', badge: '#60A5FA', label: 'Padel' };
      default:
        return { background: '#863A73', badge: '#A855F7', label: 'League' };
    }
  };

  const sportColors = getSportColors();

  const handleCreateMatch = () => {
    // Validate required fields
    if (!formData.date || !formData.time || !formData.location || !formData.numberOfPlayers) {
      // TODO: Show error toast
      return;
    }

    onCreateMatch(formData);
    // Reset form
    setFormData({
      date: '',
      time: '',
      duration: 2,
      numberOfPlayers: '',
      location: '',
      fee: 'FREE',
      description: '',
    });
  };

  const handleClose = () => {
    // Reset form on close
    setFormData({
      date: '',
      time: '',
      duration: 2,
      numberOfPlayers: '',
      location: '',
      fee: 'FREE',
      description: '',
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create a Match</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* League Info Banner */}
          <View style={[styles.leagueBanner, { backgroundColor: sportColors.background }]}>
            <View style={styles.leagueBadgeContainer}>
              <View style={[styles.leagueBadge, { borderColor: sportColors.badge }]}>
                <Text style={[styles.leagueBadgeText, { color: sportColors.badge }]}>
                  {sportColors.label}
                </Text>
              </View>
            </View>
            <Text style={styles.leagueName}>{leagueInfo.name}</Text>
            {leagueInfo.season && (
              <Text style={styles.leagueSeason}>
                {leagueInfo.season}
                {leagueInfo.division && ` - ${leagueInfo.division}`}
              </Text>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Date Input */}
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Date</Text>
                <Ionicons name="calendar-outline" size={16} color="#F97316" style={styles.labelIcon} />
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={formData.date}
                  onChangeText={(text) => setFormData({ ...formData, date: text })}
                  placeholder="Select"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Time Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Time</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="time-outline" size={20} color="#F97316" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.time}
                  onChangeText={(text) => setFormData({ ...formData, time: text })}
                  placeholder="Select"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Duration Slider */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Duration</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={5}
                  step={0.5}
                  value={formData.duration}
                  onValueChange={(value: number) => setFormData({ ...formData, duration: value })}
                  minimumTrackTintColor={sportColors.background}
                  maximumTrackTintColor="#D1D5DB"
                  thumbTintColor={sportColors.background}
                />
                <Text style={[styles.durationText, { color: sportColors.background }]}>{formData.duration} hour(s)</Text>
              </View>
            </View>

            {/* Number of Players */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Number of players</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="people-outline" size={20} color="#F97316" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.numberOfPlayers}
                  onChangeText={(text) => setFormData({ ...formData, numberOfPlayers: text })}
                  placeholder="Select"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Location Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color="#F97316" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                  placeholder="Select"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Fee Toggle */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Fee</Text>
              <View style={styles.feeToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.feeButton,
                    formData.fee === 'FREE' && styles.feeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, fee: 'FREE' })}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.feeButtonText,
                      formData.fee === 'FREE' && styles.feeButtonTextActive,
                    ]}
                  >
                    FREE
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.feeButton,
                    formData.fee === 'SPLIT' && [styles.feeButtonActive, { backgroundColor: '#F97316' }],
                  ]}
                  onPress={() => setFormData({ ...formData, fee: 'SPLIT' })}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.feeButtonText,
                      formData.fee === 'SPLIT' && styles.feeButtonTextActive,
                    ]}
                  >
                    SPLIT
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Add match details..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Create Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: sportColors.background }]}
            onPress={handleCreateMatch}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>Create Match</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerPlaceholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  leagueBanner: {
    padding: 20,
    alignItems: 'center',
  },
  leagueBadgeContainer: {
    marginBottom: 8,
  },
  leagueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  leagueBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  leagueName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  leagueSeason: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelIcon: {
    marginLeft: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 12,
  },
  sliderContainer: {
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  durationText: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  feeToggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  feeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeButtonActive: {
    backgroundColor: '#D1D5DB',
  },
  feeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  feeButtonTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
    maxHeight: 150,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
