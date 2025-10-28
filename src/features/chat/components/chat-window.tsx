import { useSession } from '@/lib/auth-client';
import React, { useEffect, useRef } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import { Message } from '../types';
import { MessageBubble } from './chat-bubble';

interface MessageWindowProps {
  messages: Message[];
  threadId: string;
  onLoadMore?: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export const MessageWindow: React.FC<MessageWindowProps> = ({
  messages,
  threadId,
  onLoadMore,
}) => {
  const { data: session } = useSession();
  const flatListRef = useRef<FlatList>(null);

  const user = session?.user;

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    }
  }, [messages.length]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isCurrentUser = item.senderId === user?.id;
    const previousMessage = messages[index + 1];
    const nextMessage = messages[index - 1];
    
    const showAvatar = !previousMessage || previousMessage.senderId !== item.senderId;
    const isLastInGroup = !nextMessage || nextMessage.senderId !== item.senderId;
    
    return (
      <MessageBubble
        message={item}
        isCurrentUser={isCurrentUser}
        showAvatar={showAvatar}
        isLastInGroup={isLastInGroup}
      />
    );
  };

  const renderEmpty = () => (
    <View style={[styles.emptyContainer ]}>
      <Text style={styles.emptyText}>No messages yet</Text>
      <Text style={styles.emptySubtext}>Start the conversation!</Text>
    </View>
  );

  return (
    <View style={[styles.container, { height: screenHeight * 0.65 }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.contentContainer}
        inverted
        showsVerticalScrollIndicator={false}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  messagesList: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});