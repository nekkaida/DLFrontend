import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  onhandleMatch?: () => void;
  onEmojiPress?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  placeholder = 'Type a message...',
  onhandleMatch,
  onEmojiPress,
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

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
      onSendMessage(message.trim());
      setMessage('');
      setIsTyping(false);
      if (onTyping) onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleMatch = () => {
    onhandleMatch?.();
  };

  
  const bottomPadding = Platform.select({
    ios: Math.max(insets.bottom + 70, 78), 
    android: 90, 
  });

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.inputContainer}>
        {/* Match button */}
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={handleMatch}
          activeOpacity={0.7}
        >
         <Ionicons name="game-controller" size={24} color="#6B7280" />  
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
            { backgroundColor: message.trim() ? '#863A73' : '#E5E7EB' }
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