import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';

interface ConfirmButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  text?: string;
  loadingText?: string;
}

const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  onPress,
  disabled = false,
  isLoading = false,
  text = 'Confirm',
  loadingText = 'Saving...',
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || isLoading) && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      <Text style={styles.buttonText}>
        {isLoading ? loadingText : text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 44,
    backgroundColor: '#FE9F4D',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 24,
  },
});

export default ConfirmButton;
