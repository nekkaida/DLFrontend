import React from 'react';
import PickleballInfo1 from '@/assets/icons/season-details/pickleball-info-1.svg';
import PickleballInfo2 from '@/assets/icons/season-details/pickleball-info-2.svg';
import PickleballInfo3 from '@/assets/icons/season-details/pickleball-info-3.svg';
import PickleballInfo4 from '@/assets/icons/season-details/pickleball-info-4.svg';
import PickleballInfo5 from '@/assets/icons/season-details/pickleball-info-5.svg';
import PickleballInfo6 from '@/assets/icons/season-details/pickleball-info-6.svg';
import TennisInfo1 from '@/assets/icons/season-details/tennis-info-1.svg';
import TennisInfo2 from '@/assets/icons/season-details/tennis-info-2.svg';
import TennisInfo3 from '@/assets/icons/season-details/tennis-info-3.svg';
import TennisInfo4 from '@/assets/icons/season-details/tennis-info-4.svg';
import TennisInfo5 from '@/assets/icons/season-details/tennis-info-5.svg';
import TennisInfo6 from '@/assets/icons/season-details/tennis-info-6.svg';
import PadelInfo1 from '@/assets/icons/season-details/padel-info-1.svg';
import PadelInfo2 from '@/assets/icons/season-details/padel-info-2.svg';
import PadelInfo3 from '@/assets/icons/season-details/padel-info-3.svg';
import PadelInfo4 from '@/assets/icons/season-details/padel-info-4.svg';
import PadelInfo5 from '@/assets/icons/season-details/padel-info-5.svg';
import PadelInfo6 from '@/assets/icons/season-details/padel-info-6.svg';

export type SportType = 'pickleball' | 'tennis' | 'padel';

interface SeasonInfoIconsProps {
  sport: SportType;
}

export const SeasonInfoIcons: React.FC<SeasonInfoIconsProps> = ({ sport }) => {
  switch (sport) {
    case 'tennis':
      return (
        <>
          <TennisInfo1 width={43} height={43} />
          <TennisInfo2 width={43} height={43} />
          <TennisInfo3 width={43} height={43} />
          <TennisInfo4 width={43} height={43} />
          <TennisInfo5 width={43} height={43} />
          <TennisInfo6 width={43} height={43} />
        </>
      );
    case 'padel':
      return (
        <>
          <PadelInfo1 width={43} height={43} />
          <PadelInfo2 width={43} height={43} />
          <PadelInfo3 width={43} height={43} />
          <PadelInfo4 width={43} height={43} />
          <PadelInfo5 width={43} height={43} />
          <PadelInfo6 width={43} height={43} />
        </>
      );
    case 'pickleball':
    default:
      return (
        <>
          <PickleballInfo1 width={43} height={43} />
          <PickleballInfo2 width={43} height={43} />
          <PickleballInfo3 width={43} height={43} />
          <PickleballInfo4 width={43} height={43} />
          <PickleballInfo5 width={43} height={43} />
          <PickleballInfo6 width={43} height={43} />
        </>
      );
  }
};

// Export individual icon components for direct access
export const getSeasonInfoIcons = (sport: SportType) => {
  switch (sport) {
    case 'tennis':
      return {
        Icon1: TennisInfo1,
        Icon2: TennisInfo2,
        Icon3: TennisInfo3,
        Icon4: TennisInfo4,
        Icon5: TennisInfo5,
        Icon6: TennisInfo6,
      };
    case 'padel':
      return {
        Icon1: PadelInfo1,
        Icon2: PadelInfo2,
        Icon3: PadelInfo3,
        Icon4: PadelInfo4,
        Icon5: PadelInfo5,
        Icon6: PadelInfo6,
      };
    case 'pickleball':
    default:
      return {
        Icon1: PickleballInfo1,
        Icon2: PickleballInfo2,
        Icon3: PickleballInfo3,
        Icon4: PickleballInfo4,
        Icon5: PickleballInfo5,
        Icon6: PickleballInfo6,
      };
  }
};

