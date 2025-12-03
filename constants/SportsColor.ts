export type SportType = 'PICKLEBALL' | 'TENNIS' | 'PADEL';

export interface SportColors {
  background: string;
  badgeColor: string;
  label: string;
  buttonColor: string;
  icon: string;
}

export const SPORT_COLORS: Record<SportType, SportColors> = {
  PICKLEBALL: {
    background: '#863A73',
    badgeColor: '#A855F7',
    label: 'PICKLEBALL',
    buttonColor: '#602E98',
    icon: 'disc',
  },
  TENNIS: {
    background: '#65B741',
    badgeColor: '#22C55E',
    label: 'TENNIS',
    buttonColor: '#587A27',
    icon: 'tennisball',
  },
  PADEL: {
    background: '#3B82F6',
    badgeColor: '#60A5FA',
    label: 'PADEL',
    buttonColor: '#2E6698',
    icon: 'tennisball',
  },
};

export const getSportColors = (
  sportType: SportType | null | undefined
): SportColors => {
  if (!sportType) {
    return SPORT_COLORS.PICKLEBALL;
  }
  return SPORT_COLORS[sportType] || SPORT_COLORS.PICKLEBALL;
};
