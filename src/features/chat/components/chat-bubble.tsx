import { getSportColors, SportType } from '@/constants/SportsColor';
import {
  scale,
  verticalScale,
  moderateScale,
} from '@/core/utils/responsive';
import { format } from 'date-fns';
import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  showAvatar: boolean;
  isLastInGroup?: boolean;
  isGroupChat?: boolean;
  sportType?: SportType | null;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  isCurrentUser,
  showAvatar,
  isLastInGroup = true,
  isGroupChat = false,
  sportType,
}) => {
  const senderName = message.metadata?.sender?.name ||
                    message.metadata?.sender?.username ||
                    'Unknown';

  // Get sender's avatar/image - check both 'avatar' and 'image' properties
  const senderAvatar = message.metadata?.sender?.avatar ||
                       message.metadata?.sender?.image ||
                       null;
  const senderInitial = senderName.charAt(0).toUpperCase();

  // Memoized sport-specific color for current user messages
  const bubbleColor = useMemo(() => {
    if (!isCurrentUser) return '#F3F4F6'; // Gray for received messages

    // Use sport color for sent messages (both group and direct chats)
    const colors = getSportColors(sportType);
    return colors.background;
  }, [isCurrentUser, sportType]);
  
  return (
    <View style={[
      styles.container, 
      isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
    ]}>
      {!isCurrentUser && isLastInGroup && isGroupChat && (
        <View style={styles.avatarContainer}>
          {senderAvatar ? (
            <Image 
              source={{ uri: senderAvatar }} 
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {senderInitial}
              </Text>
            </View>
          )}
        </View>
      )}
      {!isCurrentUser && !isLastInGroup && isGroupChat && (
        <View style={styles.avatarSpacer} />
      )}
      
      <View style={styles.messageContainer}>
        {/* Sender name for GROUP chats only*/}
        {!isCurrentUser && showAvatar && isGroupChat && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}
        
        <View style={[
          styles.bubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          isCurrentUser && { backgroundColor: bubbleColor },
          isCurrentUser ? {
            borderBottomRightRadius: isLastInGroup ? moderateScale(6) : moderateScale(18),
            borderTopRightRadius: showAvatar ? moderateScale(18) : moderateScale(6),
          } : {
            borderBottomLeftRadius: isLastInGroup ? moderateScale(6) : moderateScale(18),
            borderTopLeftRadius: showAvatar ? moderateScale(18) : moderateScale(6),
          },
          message.status === 'sending' && styles.sendingBubble,
          message.status === 'failed' && styles.failedBubble,
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText,
          ]}>
            {message.content}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.timestamp,
              isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp,
            ]}>
              {format(new Date(message.timestamp), 'HH:mm')}
            </Text>
            
            {isCurrentUser && (
              <View style={styles.statusContainer}>
                {message.status === 'sending' && (
                  <Text style={styles.sendingStatus}>○</Text>
                )}
                {message.status === 'failed' && (
                  <Text style={styles.failedStatus}>!</Text>
                )}
                {message.status !== 'sending' && message.status !== 'failed' && message.isDelivered && (
                  <Text style={styles.deliveryStatus}>✓</Text>
                )}
                {message.status !== 'sending' && message.status !== 'failed' && message.isRead && (
                  <Text style={styles.readStatus}>✓</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

MessageBubble.displayName = 'MessageBubble';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: verticalScale(1),
    paddingHorizontal: scale(4),
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: scale(8),
    alignSelf: 'flex-end',
    marginBottom: verticalScale(2),
  },
  avatarSpacer: {
    width: scale(40),
  },
  avatar: {
    width: scale(32),
    height: verticalScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: scale(32),
    height: verticalScale(32),
    borderRadius: moderateScale(16),
  },
  avatarText: {
    color: '#6B7280',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  messageContainer: {
    maxWidth: '75%',
    marginBottom: verticalScale(2),
  },
  senderName: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginBottom: verticalScale(2),
    marginLeft: scale(4),
    fontWeight: '500',
  },
  bubble: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(20),
    minHeight: verticalScale(40),
    justifyContent: 'center',
  },
  currentUserBubble: {
    backgroundColor: '#A04DFE',
    alignSelf: 'flex-end',
  },
  otherUserBubble: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
  },
  sendingBubble: {
    opacity: 0.7,
  },
  failedBubble: {
    opacity: 0.5,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  messageText: {
    fontSize: moderateScale(15),
    lineHeight: verticalScale(20),
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#111827',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: verticalScale(2),
  },
  timestamp: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },
  currentUserTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherUserTimestamp: {
    color: '#9CA3AF',
  },
  statusContainer: {
    flexDirection: 'row',
    marginLeft: scale(4),
  },
  deliveryStatus: {
    fontSize: moderateScale(10),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  readStatus: {
    fontSize: moderateScale(10),
    color: '#34D399',
    marginLeft: scale(-2),
  },
  sendingStatus: {
    fontSize: moderateScale(10),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  failedStatus: {
    fontSize: moderateScale(10),
    color: '#EF4444',
    fontWeight: '700',
  },
});