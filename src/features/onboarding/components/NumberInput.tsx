import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';

interface NumberInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onSkipAndProceed?: () => void; // Called when skipping - handles both setting skip value and navigation
  label?: string;
  helpText?: string;
  error?: string;
  minValue?: number;
  maxValue?: number;
  allowSkip?: boolean;
  containerStyle?: ViewStyle;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChangeText,
  onSubmit,
  onSkipAndProceed,
  label,
  helpText,
  error,
  minValue,
  maxValue,
  allowSkip = false,
  containerStyle,
  placeholder,
  keyboardType,
  ...textInputProps
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const defaultKeyboardType =
    keyboardType ??
    (Platform.select({
      ios: 'decimal-pad',
      android: 'decimal-pad',
      default: 'numeric',
    }) as TextInputProps['keyboardType']);

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (minValue !== undefined && maxValue !== undefined) {
      return `Enter value (${minValue}-${maxValue})`;
    }
    return 'Enter value';
  };

  // Validate and filter input
  const handleTextChange = (text: string) => {
    // Allow empty input
    if (text === '') {
      setValidationError(null);
      onChangeText(text);
      return;
    }

    // Replace comma with dot for decimal
    const normalizedText = text.replace(',', '.');

    // Only allow numbers and one decimal point
    if (!/^-?\d*\.?\d*$/.test(normalizedText)) {
      return; // Reject invalid characters
    }

    // Parse the number
    const numValue = parseFloat(normalizedText);

    // Allow partial input (like "5." while typing)
    if (isNaN(numValue)) {
      onChangeText(text);
      setValidationError(null);
      return;
    }

    // Check max value - block if exceeds
    if (maxValue !== undefined && numValue > maxValue) {
      setValidationError(`Maximum value is ${maxValue}`);
      // Don't update if way over (more than 1 digit over for single digits)
      if (numValue > maxValue * 10) {
        return;
      }
      // Still allow the input but show error
      onChangeText(text);
      return;
    }

    // Check min value - show error but allow typing
    if (minValue !== undefined && numValue < minValue && normalizedText.indexOf('.') === -1) {
      // Only show error if it's a complete number (no decimal in progress)
      if (normalizedText.length >= String(minValue).length) {
        setValidationError(`Minimum value is ${minValue}`);
      }
    } else {
      setValidationError(null);
    }

    onChangeText(text);
  };

  // Clear error when value becomes valid
  useEffect(() => {
    if (value) {
      const numValue = parseFloat(value.replace(',', '.'));
      if (!isNaN(numValue)) {
        if (minValue !== undefined && maxValue !== undefined) {
          if (numValue >= minValue && numValue <= maxValue) {
            setValidationError(null);
          }
        }
      }
    }
  }, [value, minValue, maxValue]);

  const canSubmit = value.trim().length > 0 && !validationError;
  const canSkip = allowSkip;
  const displayError = error || validationError;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[styles.inputWrapper, displayError && styles.inputError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleTextChange}
          placeholder={getPlaceholder()}
          placeholderTextColor="#6C7278"
          keyboardType={defaultKeyboardType}
          inputMode="decimal"
          returnKeyType={canSubmit ? 'done' : 'default'}
          onSubmitEditing={canSubmit ? onSubmit : undefined}
          {...textInputProps}
        />
      </View>

      {helpText && !displayError && <Text style={styles.helpText}>{helpText}</Text>}
      {displayError && <Text style={styles.errorText}>{displayError}</Text>}

      {canSkip && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              onSkipAndProceed?.();
            }}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6C7278',
    marginBottom: 8,
    letterSpacing: -0.02,
    fontFamily: 'Roboto',
  },
  inputWrapper: {
    height: 46,
    borderWidth: 1,
    borderColor: '#EDF1F3',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    shadowColor: '#E4E5E7',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.24,
    shadowRadius: 2,
    elevation: 2,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  input: {
    fontSize: 14,
    color: '#1A1C1E',
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    color: '#6C7278',
    marginTop: 4,
    fontFamily: 'Roboto',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    fontFamily: 'Roboto',
  },
  buttonContainer: {
    marginTop: 16,
  },
  submitButton: {
    height: 40,
    backgroundColor: '#FE9F4D',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
  skipButton: {
    height: 40,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6C7278',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonWithMargin: {
    marginTop: 8,
  },
  skipButtonText: {
    color: '#6C7278',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
});

export default NumberInput;
