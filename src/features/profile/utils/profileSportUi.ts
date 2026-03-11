import PaddleIcon from '@/assets/icons/sports/profile/PaddleMono.svg';
import PickleballIcon from '@/assets/icons/sports/profile/PickleballMono.svg';
import TennisIcon from '@/assets/icons/sports/profile/TennisMono.svg';

export type ProfileSportIconProps = {
  width?: number;
  height?: number;
  fill?: string;
  color?: string;
};

export type ProfileSportConfig = {
  color: string;
  Icon: React.ComponentType<ProfileSportIconProps>;
};

export const PROFILE_SPORT_CONFIG: Record<string, ProfileSportConfig> = {
  PICKLEBALL: { color: '#A04DFEED', Icon: PickleballIcon },
  TENNIS: { color: '#9BD940', Icon: TennisIcon },
  PADEL: { color: '#4DABFEED', Icon: PaddleIcon },
};

export const getSportKey = (sport: string) => (sport || '').trim().toUpperCase();

export const getProfileSportConfig = (sport: string): ProfileSportConfig => {
  return PROFILE_SPORT_CONFIG[getSportKey(sport)] || PROFILE_SPORT_CONFIG.TENNIS;
};
