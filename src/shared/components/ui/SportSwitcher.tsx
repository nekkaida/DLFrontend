import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, Pressable, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import DropdownIcon from '@/assets/icons/dropdown-icon.svg';
import PickleballIcon from '@/assets/icons/logo-pickleball.svg';
import TennisIcon from '@/assets/icons/logo-tennis.svg';
import PadelIcon from '@/assets/icons/logo-padel.svg';

interface SportSwitcherProps {
  currentSport: 'pickleball' | 'tennis' | 'padel';
  availableSports: string[];
  onSportChange: (sport: 'pickleball' | 'tennis' | 'padel') => void;
}

const sportData = [
  { 
    label: 'pickleball', 
    value: 'pickleball' as const,
    color: '#A04DFE',
    icon: PickleballIcon
  },
  { 
    label: 'tennis', 
    value: 'tennis' as const,
    color: '#A2E047',
    icon: TennisIcon
  },
  { 
    label: 'padel', 
    value: 'padel' as const,
    color: '#4DABFE',
    icon: PadelIcon
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SportSwitcher: React.FC<SportSwitcherProps> = ({
  currentSport,
  availableSports,
  onSportChange
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<View>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  // Filter sports based on what user has selected
  const filteredSports = sportData.filter(sport => 
    availableSports.includes(sport.value)
  );

  const currentSportData = sportData.find(sport => sport.value === currentSport);
  const CurrentIcon = currentSportData?.icon;

  const handleToggleDropdown = () => {
    if (buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setButtonLayout({ x, y, width, height });
        setIsDropdownOpen(true);
        
        // Animate dropdown appearance
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const handleCloseDropdown = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsDropdownOpen(false);
    });
  };

  const handleSportChange = (sport: typeof sportData[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleCloseDropdown();
    onSportChange(sport.value);
  };

  if (filteredSports.length === 0) {
    return null;
  }

  // Calculate dropdown position - directly below the button, centered
  const dropdownTop = buttonLayout.y + buttonLayout.height + 8;
  const dropdownLeft = buttonLayout.x + (buttonLayout.width / 2) - 140; // Center align (dropdown width is 280)

  return (
    <View style={styles.container}>
      <View
        ref={buttonRef}
        collapsable={false}
        onLayout={() => {
          if (buttonRef.current) {
            buttonRef.current.measureInWindow((x, y, width, height) => {
              setButtonLayout({ x, y, width, height });
            });
          }
        }}
      >
        <TouchableOpacity
          style={styles.switcherButton}
          activeOpacity={0.7}
          onPress={handleToggleDropdown}
        >
          {CurrentIcon && (
            <CurrentIcon 
              width={32} 
              height={32} 
              style={styles.sportIcon}
            />
          )}
          <Text style={[styles.sportName, { color: currentSportData?.color }]}>
            {currentSportData?.label.toLowerCase()}
          </Text>
          <DropdownIcon width={24} height={24} />
        </TouchableOpacity>
      </View>
      
      {/* Modal with backdrop for dropdown */}
      <Modal
        visible={isDropdownOpen}
        transparent
        animationType="none"
        onRequestClose={handleCloseDropdown}
      >
        <Pressable 
          style={styles.backdrop} 
          onPress={handleCloseDropdown}
        >
          <View 
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Animated.View
              style={[
                styles.dropdownMenu,
                {
                  top: dropdownTop,
                  left: Math.max(16, Math.min(dropdownLeft, SCREEN_WIDTH - 296)), // Ensure it stays within screen bounds
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
            <View style={styles.dropdownCard}>
              {filteredSports.map((sport, index) => {
                const IconComponent = sport.icon;
                const isSelected = sport.value === currentSport;
                
                return (
                  <React.Fragment key={sport.value}>
                    <TouchableOpacity
                      style={[
                        styles.dropdownRow,
                        isSelected && styles.dropdownRowSelected
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleSportChange(sport)}
                    >
                      <IconComponent width={32} height={32} />
                      <Text style={[styles.dropdownLabelText, { color: sport.color }]}>
                        {sport.label}
                      </Text>
                      {isSelected && (
                        <View style={[styles.checkmarkContainer, { backgroundColor: `${sport.color}15` }]}>
                          <Text style={[styles.dropdownCheck, { color: sport.color }]}>
                            ✓
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {index < filteredSports.length - 1 && <View style={styles.dropdownDivider} />}
                  </React.Fragment>
                );
              })}
            </View>
          </Animated.View>
          </View>
        </Pressable>
      </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  dropdownMenu: {
    position: 'absolute',
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    zIndex: 1000,
    overflow: 'hidden',
  },
  dropdownCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    minHeight: 56,
  },
  dropdownRowSelected: {
    backgroundColor: '#FAFAFA',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  dropdownLabelText: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginLeft: 16,
    letterSpacing: 0.2,
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  dropdownCheck: {
    fontSize: 18,
    fontWeight: '700',
  },
});
