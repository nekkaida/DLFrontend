import { useEffect } from 'react';
import { socketService } from '@/lib/socket-service';

export interface AchievementUnlockPayload {
  achievementId: string;
  title: string;
  description: string;
  icon: string;
  tier: string;
  category: string;
  points: number;
}

export function useAchievementSocket(
  onUnlock: (achievement: AchievementUnlockPayload) => void
) {
  useEffect(() => {
    socketService.on('achievement_unlocked', onUnlock);
    return () => {
      socketService.off('achievement_unlocked', onUnlock);
    };
  }, [onUnlock]);
}
