import { ChatThreadScreen } from '@/src/features/chat/ChatThreadScreen';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function ChatThread() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();

  if (!threadId) {
    return null;
  }

  return <ChatThreadScreen threadId={threadId} />;
}
