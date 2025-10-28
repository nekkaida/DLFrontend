import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import DropdownIcon from '@/assets/icons/dropdown-icon.svg';
import PickleballIcon from '@/assets/icons/logo-pickleball.svg';
import TennisIcon from '@/assets/images/033-TENNIS 1.svg';
import PadelIcon from '@/assets/images/036-PADEL 1.svg';

interface SportSwitcherProps {
  currentSport: 'pickleball' | 'tennis' | 'padel';
  availableSports: string[];
  onSportChange: (sport: 'pickleball' | 'tennis' | 'padel') => void;
}

const sportData = [
  { 
    label: 'Pickleball', 
    value: 'pickleball' as const,
    color: '#A04DFE',
    icon: PickleballIcon
  },
  { 
    label: 'Tennis', 
    value: 'tennis' as const,
    color: '#A2E047',
    icon: TennisIcon
  },
  { 
    label: 'Padel', 
    value: 'padel' as const,
    color: '#4DABFE',
    icon: PadelIcon
  },
];

export const SportSwitcher: React.FC<SportSwitcherProps> = ({
  currentSport,
  availableSports,
  onSportChange
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter sports based on what user has selected
  const filteredSports = sportData.filter(sport => 
    availableSports.includes(sport.value)
  );

  const currentSportData = sportData.find(sport => sport.value === currentSport);
  const CurrentIcon = currentSportData?.icon;

  const handleSportChange = (sport: typeof sportData[0]) => {
    setIsDropdownOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSportChange(sport.value);
  };

  if (filteredSports.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.switcherButton}
        activeOpacity={0.7}
        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        {CurrentIcon && (
          <CurrentIcon 
            width={28} 
            height={28} 
            style={styles.sportIcon}
          />
        )}
        <Text style={[styles.sportName, { color: currentSportData?.color }]}>
          {currentSportData?.label.toLowerCase()}
        </Text>
        <DropdownIcon width={20} height={20} />
      </TouchableOpacity>
      
      {/* Dropdown positioned relative to switcher */}
      {isDropdownOpen && (
        <View style={styles.dropdownMenu}>
          <View style={styles.dropdownCard}>
            {filteredSports.map((sport, index) => {
              const IconComponent = sport.icon;
              const isSelected = sport.value === currentSport;
              
              return (
                <React.Fragment key={sport.value}>
                  <TouchableOpacity
                    style={styles.dropdownRow}
                    onPress={() => handleSportChange(sport)}
                  >
                    <IconComponent width={20} height={20} />
                    <Text style={[styles.dropdownLabelText, { color: sport.color }]}>
                      {sport.label.toLowerCase()}
                    </Text>
                    {isSelected && (
                      <Text style={[styles.dropdownCheck, { color: sport.color }]}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                  {index < filteredSports.length - 1 && <View style={styles.dropdownDivider} />}
                </React.Fragment>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
  },
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 28,
    minHeight: 56,
    minWidth: 160,
  },
  sportIcon: {
    marginRight: 12,
  },
  sportName: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 24,
    marginRight: 12,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: -50,
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 1000,
  },
  dropdownCard: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dropdownLabelText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  dropdownCheck: {
    fontSize: 14,
    fontWeight: '700',
  },
});
