import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { QuestionContainer } from '../../components';
import { styles } from './SimpleSkillDropdown.styles';

const ChevronDown = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 10L12 15L17 10"
      stroke="#6C7278"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SKILL_OPTIONS = [
  'Never played before',
  'Less than 1 month',
  '1-3 months',
  '3-6 months',
  '6-12 months',
  '1-2 years',
  '2-5 years',
  'More than 5 years',
];

interface SimpleSkillDropdownProps {
  initialValue?: string | null;
  onConfirm: (value: string) => void;
}

export const SimpleSkillDropdown: React.FC<SimpleSkillDropdownProps> = ({
  initialValue,
  onConfirm,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(initialValue || null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0 });
  const dropdownRef = useRef<View>(null);

  const measureDropdownPosition = () => {
    if (dropdownRef.current) {
      dropdownRef.current.measure((x, y, width, height, pageX, pageY) => {
        setDropdownPosition({
          x: pageX,
          y: pageY + height - 8,
          width: width
        });
      });
    }
  };

  const openDropdown = () => {
    measureDropdownPosition();
    setDropdownOpen(true);
  };

  const selectOption = (option: string) => {
    setSelectedOption(option);
    setDropdownOpen(false);
  };

  return (
    <View style={styles.cardStackContainer}>
      {/* Question Card */}
      <View style={[styles.stackedCard, styles.activeCard]}>
        <QuestionContainer question="How long have you been playing?">
          <TouchableOpacity
            ref={dropdownRef}
            style={styles.dropdown}
            onPress={openDropdown}
          >
            <Text style={[
              styles.dropdownText,
              selectedOption && styles.dropdownTextSelected
            ]}>
              {selectedOption || 'Select an option'}
            </Text>
            <ChevronDown />
          </TouchableOpacity>
        </QuestionContainer>
      </View>

      {/* Confirm Button */}
      {selectedOption && (
        <View style={styles.simpleConfirmButtonContainer}>
          <TouchableOpacity
            style={styles.simpleConfirmButton}
            onPress={() => onConfirm(selectedOption)}
          >
            <Text style={styles.simpleConfirmButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        >
          <View
            style={[
              styles.modalDropdown,
              {
                top: dropdownPosition.y,
                left: dropdownPosition.x,
                width: dropdownPosition.width,
              }
            ]}
          >
            <FlatList
              data={SKILL_OPTIONS}
              keyExtractor={(item, index) => `${item}-${index}`}
              style={styles.modalDropdownList}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    index === SKILL_OPTIONS.length - 1 && styles.dropdownItemLast,
                  ]}
                  onPress={() => selectOption(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
