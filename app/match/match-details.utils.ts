/**
 * Utility functions for match-details screen
 */

import PickleballIcon from '@/assets/images/045-PICKLEBALL.svg';
import PadelIcon from '@/assets/images/padel-icon.svg';
import TennisIcon from '@/assets/images/tennis-icon.svg';

/**
 * Format walkover reason enum to display string
 */
export const formatWalkoverReason = (reason?: string): string => {
  switch (reason) {
    case 'NO_SHOW': return 'No Show';
    case 'LATE_CANCELLATION': return 'Late Cancellation';
    case 'INJURY': return 'Injury';
    case 'PERSONAL_EMERGENCY': return 'Personal Emergency';
    case 'OTHER': return 'Other';
    default: return reason || 'Unknown';
  }
};

/**
 * Get the appropriate sport icon component based on sport type
 */
export const getSportIcon = (sportType: string) => {
  const sport = sportType?.toUpperCase();
  if (sport?.includes('TENNIS')) return TennisIcon;
  if (sport?.includes('PADEL')) return PadelIcon;
  if (sport?.includes('PICKLEBALL')) return PickleballIcon;
  return TennisIcon;
};
