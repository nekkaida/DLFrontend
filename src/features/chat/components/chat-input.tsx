import PadelMatchIcon from '@/assets/icons/chats/padel-match.svg';
import PickleballMatchIcon from '@/assets/icons/chats/pickleball-match.svg';
import TennisMatchIcon from '@/assets/icons/chats/tennis-match.svg';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Message } from '../types';

interface MessageInputProps {
  onSendMessage: (message: string, replyToId?: string) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  onhandleMatch?: () => void;
  onEmojiPress?: () => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  sportType?: 'PICKLEBALL' | 'TENNIS' | 'PADEL' | null;
  isGroupChat?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  placeholder = 'Type a message...',
  onhandleMatch,
  onEmojiPress,
  replyingTo,
  onCancelReply,
  sportType,
  isGroupChat = false,
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  // Track keyboard visibility to adjust bottom padding
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // TO DO create constant for chat colors 
  // Get sport-specific color for send button
  const getSendButtonColor = () => {
    if (!isGroupChat || !message.trim()) return message.trim() ? '#863A73' : '#E5E7EB';
    
    switch (sportType) {
      case 'PICKLEBALL':
        return '#863A73'; // Purple
      case 'TENNIS':
        return '#65B741'; // Green
      case 'PADEL':
        return '#3B82F6'; // Blue
      default:
        return '#863A73'; // Default purple
    }
  };

  // Get sport-specific match icon component
  const getMatchIcon = () => {
    if (!isGroupChat) {
      // For individual chats, return null to use default Ionicons
      return null;
    }
    
    switch (sportType) {
      case 'PICKLEBALL':
        return PickleballMatchIcon;
      case 'TENNIS':
        return TennisMatchIcon;
      case 'PADEL':
        return PadelMatchIcon;
      default:
        return null;
    }
  };

  const MatchIcon = getMatchIcon();

  const handleTextChange = (text: string) => {
    setMessage(text);
    
    if (onTyping) {
      if (!isTyping && text.length > 0) {
        setIsTyping(true);
        onTyping(true);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTyping(false);
      }, 1000);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim(), replyingTo?.id);
      setMessage('');
      setIsTyping(false);
      if (onTyping) onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleMatch = () => {
    console.log('handleMatch called, onhandleMatch:', onhandleMatch);
    if (onhandleMatch) {
      onhandleMatch();
    }
  };


  // Simple clamp function for padding
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  // Bottom padding - parent SafeAreaView handles safe area, we just need minimal padding
  // When keyboard is visible, use minimal padding (keyboard covers safe area)
  const bottomPadding = Platform.select({
    ios: keyboardVisible ? 4 : clamp(insets.bottom, 4, 10),
    android: clamp(insets.bottom, 8, 16),
    default: clamp(insets.bottom, 6, 12),
  }) as number;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {/* Reply Preview Bar */}
      {replyingTo && (
        <View style={styles.replyPreviewContainer}>
          <View style={styles.replyPreviewContent}>
            <View style={styles.replyBar} />
            <View style={styles.replyTextContainer}>
              <Text style={styles.replyLabel}>
                Replying to {replyingTo.metadata?.sender?.name || replyingTo.metadata?.sender?.username || 'User'}
              </Text>
              <Text style={styles.replyMessageText} numberOfLines={2}>
                {replyingTo.content || 'Message'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onCancelReply}
            style={styles.cancelReplyButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        {/* Match button */}
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={handleMatch}
          activeOpacity={0.7}
        >
          {MatchIcon ? (
            <MatchIcon width={24} height={24} />
          ) : (
            <Ionicons name="calendar-clear-outline" size={24} color="#6B7280" />
          )}
        </TouchableOpacity>
        
        <View style={styles.textInputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={message}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            textAlignVertical="center"
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: getSendButtonColor() }
          ]}
          onPress={handleSend}
          disabled={!message.trim()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="send"
            size={18}
            color={message.trim() ? '#FFFFFF' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  replyPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 0,
    marginBottom: 8,
    marginHorizontal: -16,
    paddingLeft: 20,
  },
  replyPreviewContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyBar: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: '#863A73',
    borderRadius: 2,
    marginRight: 12,
    minHeight: 40,
  },
  replyTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  replyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#863A73',
    marginBottom: 4,
  },
  replyMessageText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  cancelReplyButton: {
    padding: 8,
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachmentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    paddingRight: 12,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#111827',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});