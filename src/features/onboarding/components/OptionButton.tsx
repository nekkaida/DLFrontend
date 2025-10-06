import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface OptionButtonProps {
  title: string;
  isSelected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
}

const OptionButton: React.FC<OptionButtonProps> = ({
  title,
  isSelected = false,
  onPress,
  disabled = false,
  variant = 'default',
}) => {
  const buttonStyle: ViewStyle[] = [
    variant === 'compact' ? styles.buttonCompact : styles.button,
    ...(isSelected ? [styles.buttonSelected] : []),
    ...(disabled ? [styles.buttonDisabled] : []),
  ];

  const textStyle: TextStyle[] = [
    variant === 'compact' ? styles.textCompact : styles.text,
    ...(isSelected ? [styles.textSelected] : []),
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ 
        selected: isSelected,
        disabled: disabled 
      }}
      accessibilityHint={`${isSelected ? 'Selected' : 'Not selected'}. Tap to ${isSelected ? 'deselect' : 'select'}.`}
    >
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderWidth: 1,
    borderColor: '#A04DFE',
    borderRadius: 25,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonCompact: {
    borderWidth: 1,
    borderColor: '#A04DFE',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  buttonSelected: {
    borderColor: '#FE9F4D',
    backgroundColor: '#FE9F4D',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  textCompact: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  textSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default OptionButton;