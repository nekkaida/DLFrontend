import { useSession } from '@/lib/auth-client';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Message } from '../types';
import { MessageBubble } from './chat-bubble';

interface MessageWindowProps {
  messages: Message[];
  threadId: string;
  onLoadMore?: () => void;
  loading?: boolean;
}

const { height: screenHeight } = Dimensions.get('window');

interface GroupedMessage {
  id: string;
  type: 'date' | 'message';
  date?: string;
  message?: Message;
}

export const MessageWindow: React.FC<MessageWindowProps> = ({
  messages,
  threadId,
  onLoadMore,
  loading = false,
}) => {
  const { data: session } = useSession();
  const flatListRef = useRef<FlatList>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const user = session?.user;

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const grouped: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = format(new Date(message.timestamp), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(message);
    });

    // Convert to flat array with date dividers
    const flatData: GroupedMessage[] = [];
    Object.entries(grouped).forEach(([date, dateMessages]) => {
      flatData.push({
        id: `date-${date}`,
        type: 'date',
        date: dateMessages[0].timestamp.toISOString(),
      });
      
      // Add messages for this date
      dateMessages.forEach(message => {
        flatData.push({
          id: message.id,
          type: 'message',
          message,
        });
      });
    });

    return flatData.reverse();
  }, [messages]);

  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      }, 100);
    }
  }, [messages.length, isAtBottom]);

  const getDateLabel = (dateString: string) => {
    const messageDate = new Date(dateString);
    if (isToday(messageDate)) return 'Today';
    if (isYesterday(messageDate)) return 'Yesterday';
    return format(messageDate, 'MMMM d, yyyy');
  };

  const renderDateDivider = (dateString: string) => (
    <View style={styles.dateDivider}>
      <View style={styles.dateDividerBadge}>
        <Text style={styles.dateDividerText}>
          {getDateLabel(dateString)}
        </Text>
      </View>
    </View>
  );

  const renderMessageSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonNameLine} />
        <View style={styles.skeletonMessageLine} />
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: GroupedMessage; index: number }) => {
    if (item.type === 'date') {
      return renderDateDivider(item.date!);
    }

    const message = item.message!;
    const isCurrentUser = message.senderId === user?.id;
    const previousItem = groupedMessages[index + 1];
    const nextItem = groupedMessages[index - 1];
    
    const previousMessage = previousItem?.type === 'message' ? previousItem.message : null;
    const nextMessage = nextItem?.type === 'message' ? nextItem.message : null;
    
    const showAvatar = !previousMessage || previousMessage.senderId !== message.senderId;
    const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId;
    const isGroupChat = false; // TODO: Pass this from parent component based on thread type
    
    return (
      <MessageBubble
        message={message}
        isCurrentUser={isCurrentUser}
        showAvatar={showAvatar}
        isLastInGroup={isLastInGroup}
        isGroupChat={isGroupChat}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>💬</Text>
      <Text style={styles.emptyText}>No messages yet</Text>
      <Text style={styles.emptySubtext}>Start the conversation by sending a message</Text>
    </View>
  );

  const renderLoadingSkeleton = () => (
    <View style={styles.loadingContainer}>
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index}>
          {renderMessageSkeleton()}
        </View>
      ))}
    </View>
  );

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isNearBottom = contentSize.height - contentOffset.y - layoutMeasurement.height < 100;
    
    setIsAtBottom(isNearBottom);
    setShowScrollButton(!isNearBottom && messages.length > 10);
  };

  const scrollToBottom = () => {
    if (groupedMessages.length > 0) {
      flatListRef.current?.scrollToIndex({ 
        index: 0, 
        animated: true 
      });
    }
  };

  if (loading && messages.length === 0) {
    return (
      <View style={[styles.container, { height: screenHeight * 0.65 }]}>
        {renderLoadingSkeleton()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: screenHeight * 0.65 }]}>
      <FlatList
        ref={flatListRef}
        data={groupedMessages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.contentContainer,
          groupedMessages.length === 0 && styles.emptyContentContainer
        ]}
        inverted
        showsVerticalScrollIndicator={false}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={renderEmpty}
        getItemLayout={(data, index) => ({
          length: 80, // Approximate item height
          offset: 80 * index,
          index,
        })}
      />

      {/* Loading indicator for sending messages */}
      {loading && messages.length > 0 && (
        <View style={styles.sendingIndicator}>
          <ActivityIndicator size="small" color="#6B7280" />
          <Text style={styles.sendingText}>Sending...</Text>
        </View>
      )}

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  messagesList: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContentContainer: {
    justifyContent: 'center',
  },
  dateDivider: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dateDividerBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  dateDividerText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  skeletonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  skeletonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonNameLine: {
    height: 12,
    width: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  skeletonMessageLine: {
    height: 16,
    width: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  sendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  sendingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#863A73',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});