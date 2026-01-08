// app/user-dashboard/connect.tsx

import React from 'react';
import { FeedScreen } from '@/features/feed';

export default function ConnectPage() {
  // Default sport for the feed
  const defaultSport = 'PICKLEBALL'.toLowerCase();

  return <FeedScreen sport={defaultSport} />;
}
