import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { filterModalStyles as styles } from './styles';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  uniqueSports: string[];
  uniqueDivisions: string[];
  uniqueSeasons: string[];
  selectedSport: string | null;
  selectedDivision: string | null;
  selectedSeason: string | null;
  onSelectSport: (sport: string | null) => void;
  onSelectDivision: (division: string | null) => void;
  onSelectSeason: (season: string | null) => void;
  onClearAll: () => void;
}

export function FilterModal({
  visible,
  onClose,
  uniqueSports,
  uniqueDivisions,
  uniqueSeasons,
  selectedSport,
  selectedDivision,
  selectedSeason,
  onSelectSport,
  onSelectDivision,
  onSelectSeason,
  onClearAll,
}: FilterModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Matches</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Sport Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sport</Text>
              <View style={styles.filterOptions}>
                {uniqueSports.map((sportName) => (
                  <TouchableOpacity
                    key={sportName}
                    style={[
                      styles.filterOption,
                      selectedSport === sportName && styles.filterOptionActive
                    ]}
                    onPress={() => onSelectSport(selectedSport === sportName ? null : sportName)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedSport === sportName && styles.filterOptionTextActive
                    ]}>
                      {sportName}
                    </Text>
                    {selectedSport === sportName && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Division Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Division</Text>
              <View style={styles.filterOptions}>
                {uniqueDivisions.map((division) => (
                  <TouchableOpacity
                    key={division}
                    style={[
                      styles.filterOption,
                      selectedDivision === division && styles.filterOptionActive
                    ]}
                    onPress={() => onSelectDivision(selectedDivision === division ? null : division)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedDivision === division && styles.filterOptionTextActive
                    ]}>
                      {division}
                    </Text>
                    {selectedDivision === division && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Season Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Season</Text>
              <View style={styles.filterOptions}>
                {uniqueSeasons.map((season) => (
                  <TouchableOpacity
                    key={season}
                    style={[
                      styles.filterOption,
                      selectedSeason === season && styles.filterOptionActive
                    ]}
                    onPress={() => onSelectSeason(selectedSeason === season ? null : season)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedSeason === season && styles.filterOptionTextActive
                    ]}>
                      {season}
                    </Text>
                    {selectedSeason === season && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={onClearAll}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={onClose}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
