export type SportType = 'PICKLEBALL' | 'TENNIS' | 'PADEL';

export interface SportColors {
  background: string;
  badgeColor: string;
  label: string;
}

export const SPORT_COLORS: Record<SportType, SportColors> = {
  PICKLEBALL: {
    background: '#863A73',
    badgeColor: '#A855F7',
    label: 'PICKLEBALL',
  },
  TENNIS: {
    background: '#65B741',
    badgeColor: '#22C55E',
    label: 'TENNIS',
  },
  PADEL: {
    background: '#3B82F6',
    badgeColor: '#60A5FA',
    label: 'PADEL',
  },
};

export const getSportColors = (
  sportType: SportType | null | undefined
): SportColors => {
  if (!sportType) {
    return SPORT_COLORS.PICKLEBALL; // Default
  }
  return SPORT_COLORS[sportType] || SPORT_COLORS.PICKLEBALL;
};
