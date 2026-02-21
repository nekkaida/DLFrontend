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

export interface AchievementRevokedPayload {
  achievementId: string;
  title: string;
  category: string;
}

export function useAchievementSocket(
  onUnlock: (achievement: AchievementUnlockPayload) => void,
  onRevoked?: (payload: AchievementRevokedPayload) => void
) {
  useEffect(() => {
    socketService.on('achievement_unlocked', onUnlock);
    if (onRevoked) {
      socketService.on('achievement_revoked', onRevoked);
    }
    return () => {
      socketService.off('achievement_unlocked', onUnlock);
      if (onRevoked) {
        socketService.off('achievement_revoked', onRevoked);
      }
    };
  }, [onUnlock, onRevoked]);
}
