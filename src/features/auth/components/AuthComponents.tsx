import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G } from 'react-native-svg';
import PhoneInput from 'react-native-phone-number-input';
import { AuthStyles, AuthColors, AuthTypography } from '../styles/AuthStyles';

// Status Bar Component
export const StatusBar: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => {
  const textColor = darkMode ? AuthColors.white : AuthColors.black;

  return (
    <View style={AuthStyles.statusBar}>
      <View style={AuthStyles.statusBarLeft}>
        <Text style={[AuthStyles.statusBarTime, { color: textColor }]}>9:41</Text>
        <Ionicons name="location" size={14} color={textColor} />
      </View>

      <View style={AuthStyles.dynamicIsland} />

      <View style={AuthStyles.statusBarRight}>
        <SignalIcon color={textColor} />
        <DataIcon color={textColor} />
        <BatteryIcon />
      </View>
    </View>
  );
};

// Signal Icon
const SignalIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="18" height="14" viewBox="0 0 18 14">
    <Path d="M1 10H4V13H1V10Z" fill={color} />
    <Path d="M6 7H9V13H6V7Z" fill={color} />
    <Path d="M11 4H14V13H11V4Z" fill={color} opacity="0.2" />
    <Path d="M16 1H19V13H16V1Z" fill={color} opacity="0.2" />
  </Svg>
);

// Data Icon
const DataIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="18" height="14" viewBox="0 0 18 14">
    <Path d="M1 1H17V13H1V1Z" fill={color} />
  </Svg>
);

// Battery Icon
const BatteryIcon: React.FC = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0.5 }}>
    <Text style={{
      fontFamily: AuthTypography.fontFamily.primary,
      fontWeight: AuthTypography.fontWeight.heavy,
      fontSize: 11,
      color: AuthColors.white,
    }}>78</Text>
    <Svg width="27" height="14" viewBox="0 0 27 14">
      <Path d="M2.5 4H22.5V10H2.5V4Z" stroke={AuthColors.black} strokeOpacity="0.3" fill="transparent" />
      <Path d="M2.5 4H15V10H2.5V4Z" fill="#34C759" />
      <Path d="M24 6H25V8H24V6Z" fill={AuthColors.black} strokeOpacity="0.3" />
    </Svg>
  </View>
);

// Home Indicator
export const HomeIndicator: React.FC = () => (
  <View style={AuthStyles.homeIndicator} />
);

// Logo Component
export const Logo: React.FC<{ large?: boolean }> = ({ large = false }) => (
  <View style={large ? {} : AuthStyles.logoContainer}>
    <Text style={large ? AuthStyles.largeLogoText : AuthStyles.logoText}>
      DEUCE
    </Text>
  </View>
);

// Input Field Component
interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  icon?: 'mail' | 'user' | 'lock' | 'phone';
  showEyeIcon?: boolean;
  onEyePress?: () => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  containerStyle?: ViewStyle;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  icon,
  showEyeIcon = false,
  onEyePress,
  keyboardType = 'default',
  containerStyle,
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'mail':
        return <Ionicons name="mail-outline" size={16} color={AuthColors.gray[300]} />;
      case 'user':
        return <Ionicons name="person-outline" size={16} color={AuthColors.gray[300]} />;
      case 'lock':
        return <Ionicons name="lock-closed-outline" size={16} color={AuthColors.gray[300]} />;
      case 'phone':
        return <Ionicons name="call-outline" size={16} color={AuthColors.gray[300]} />;
      default:
        return null;
    }
  };

  return (
    <View style={[AuthStyles.inputFieldContainer, containerStyle]}>
      <Text style={AuthStyles.inputLabel}>{label}</Text>
      <View style={[AuthStyles.inputArea, value ? AuthStyles.inputAreaActive : {}]}>
        {icon && <View style={AuthStyles.inputIcon}>{getIcon()}</View>}
        <TextInput
          style={AuthStyles.inputText}
          placeholder={placeholder}
          placeholderTextColor={AuthColors.gray[400]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
        />
        {showEyeIcon && (
          <TouchableOpacity onPress={onEyePress} style={AuthStyles.eyeIcon}>
            <Ionicons
              name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
              size={16}
              color={AuthColors.gray[300]}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Phone Input Field
interface PhoneInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onChangeFormattedText?: (text: string) => void;
  onChangeCountryCode?: (countryCode: string) => void;
}

export const PhoneInputField: React.FC<PhoneInputProps> = ({
  label,
  value,
  onChangeText,
  onChangeFormattedText,
  onChangeCountryCode,
}) => {
  const phoneInput = useRef<PhoneInput>(null);

  return (
    <View style={AuthStyles.inputFieldContainer}>
      <Text style={AuthStyles.inputLabel}>{label}</Text>
      <View style={[AuthStyles.inputArea, value ? AuthStyles.inputAreaActive : {}]}>
        {/* Phone Icon */}
        <View style={AuthStyles.inputIcon}>
          <Ionicons name="call-outline" size={16} color={AuthColors.gray[300]} />
        </View>
        <PhoneInput
          ref={phoneInput}
          defaultValue={value}
          defaultCode="US"
          layout="first"
          onChangeText={onChangeText}
          onChangeFormattedText={onChangeFormattedText}
          onChangeCountryCode={onChangeCountryCode}
          withDarkTheme={false}
          withShadow={false}
          autoFocus={false}
          containerStyle={{
            backgroundColor: 'transparent',
            width: '100%',
            height: 48,
            paddingLeft: 0,
          }}
          textContainerStyle={{
            backgroundColor: 'transparent',
            paddingVertical: 0,
            paddingHorizontal: 0
          }}
          textInputStyle={{
            fontSize: 14,
            color: AuthColors.black,
            height: 48,
            paddingVertical: 12,
          }}
          codeTextStyle={{
            fontSize: 14,
            color: AuthColors.black,
            height: 20,
          }}
          flagButtonStyle={{
            width: 50,
            marginLeft: 0,
          }}
          countryPickerButtonStyle={{
            backgroundColor: 'transparent',
          }}
        />
      </View>
    </View>
  );
};

// Circle Arrow Button
export const CircleArrowButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity style={AuthStyles.circleButton} onPress={onPress}>
    <Ionicons name="arrow-forward" size={24} color={AuthColors.white} />
  </TouchableOpacity>
);

// Primary Button
interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, style }) => (
  <TouchableOpacity style={[AuthStyles.primaryButton, style]} onPress={onPress}>
    <Text style={AuthStyles.primaryButtonText}>{title}</Text>
  </TouchableOpacity>
);

// Social Login Button
interface SocialButtonProps {
  type: 'facebook' | 'google' | 'apple';
  onPress: () => void;
}

export const SocialButton: React.FC<SocialButtonProps> = ({ type, onPress }) => {
  const getButtonStyle = () => {
    switch (type) {
      case 'facebook':
        return AuthStyles.facebookButton;
      case 'google':
      case 'apple':
        return AuthStyles.googleButton;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'facebook':
        return <Ionicons name="logo-facebook" size={20} color={AuthColors.white} />;
      case 'google':
        return <GoogleIcon />;
      case 'apple':
        return <Ionicons name="logo-apple" size={20} color={AuthColors.black} />;
    }
  };

  return (
    <TouchableOpacity style={[AuthStyles.socialButton, getButtonStyle()]} onPress={onPress}>
      {getIcon()}
    </TouchableOpacity>
  );
};

// Google Icon Component
const GoogleIcon: React.FC = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20">
    <G>
      <Path d="M10 8.18V12H15.86C15.56 13.24 14.94 14.32 14.04 15.13L17.21 17.63C19.11 15.87 20.21 13.27 20.21 10.22C20.21 9.5 20.15 8.8 20.04 8.13H10V8.18Z" fill={AuthColors.google.blue} />
      <Path d="M10 20C12.7 20 14.96 19.1 17.21 17.63L14.04 15.13C13.01 15.82 11.73 16.25 10 16.25C7.39 16.25 5.19 14.51 4.44 12.12H1.17V14.73C2.65 17.64 6.05 20 10 20Z" fill={AuthColors.google.green} />
      <Path d="M4.44 12.12C3.96 10.88 3.96 9.12 4.44 7.88V5.27H1.17C-0.39 8.35 -0.39 11.65 1.17 14.73L4.44 12.12Z" fill={AuthColors.google.yellow} />
      <Path d="M10 3.75C11.8 3.72 13.53 4.42 14.81 5.69L17.29 3.21C15.06 1.14 12.08 -0.03 10 0C6.05 0 2.65 2.36 1.17 5.27L4.44 7.88C5.19 5.49 7.39 3.75 10 3.75Z" fill={AuthColors.google.red} />
    </G>
  </Svg>
);

// Link Text Component
interface LinkTextProps {
  text: string;
  linkText: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const LinkText: React.FC<LinkTextProps> = ({ text, linkText, onPress, style }) => (
  <View style={[AuthStyles.linkContainer, style]}>
    <Text style={AuthStyles.linkText}>{text}</Text>
    <TouchableOpacity onPress={onPress}>
      <Text style={AuthStyles.linkTextBold}>{linkText}</Text>
    </TouchableOpacity>
  </View>
);

// Back Button
export const BackButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity style={AuthStyles.backButton} onPress={onPress}>
    <Ionicons name="chevron-back" size={24} color={AuthColors.black} />
  </TouchableOpacity>
);

// Gradient Background
export const GradientBackground: React.FC = () => (
  <LinearGradient
    colors={['#FFB678', '#FFFFFF']}
    start={{ x: 0.5, y: 0 }}
    end={{ x: 0.5, y: 0.7882 }}
    style={AuthStyles.gradientBackground}
  />
);

// Verification Code Input
interface VerificationInputProps {
  code: string[];
  onCodeChange: (code: string[]) => void;
}

export const VerificationInput: React.FC<VerificationInputProps> = ({ code, onCodeChange }) => {
  const inputRefs = React.useRef<TextInput[]>([]);

  const handleCodeInput = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    onCodeChange(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={AuthStyles.codeInputContainer}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref!)}
          style={AuthStyles.codeInput}
          value={code[index] || ''}
          onChangeText={(text) => handleCodeInput(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
        />
      ))}
    </View>
  );
};