// Utility functions for converting numerical ratings to skill level strings
// Based on the skill level definitions from the questionnaire services

export type SkillLevel = 
  | 'Beginner' 
  | 'Advanced Beginner' 
  | 'Lower Intermediate'    
  | 'Intermediate' 
  | 'Upper Intermediate' 
  | 'Advanced' 
  | 'Expert' 
  | 'Professional';

export interface SkillLevelInfo {
  level: SkillLevel;
  description: string;
}

// Convert numerical rating to skill level for Pickleball

export function getPickleballSkillLevel(rating: number): SkillLevelInfo {
  if (rating < 1200) {
    return {
      level: 'Beginner',
      description: "You're just starting your pickleball journey. Focus on learning the basic rules and shots."
    };
  } else if (rating < 1500) {
    return {
      level: 'Advanced Beginner',
      description: 'You understand the basics and are developing consistency. Work on your dinking and third shot drops.'
    };
  } else if (rating < 1800) {
    return {
      level: 'Lower Intermediate',
      description: 'You have decent consistency and are developing better shot selection. Focus on strategy and positioning.'
    };
  } else if (rating < 2200) {
    return {
      level: 'Intermediate',
      description: 'You have good consistency and shot variety. Work on reducing unforced errors and improving your net game.'
    };
  } else if (rating < 2800) {
    return {
      level: 'Upper Intermediate',
      description: 'You have strong fundamentals and good strategy. Focus on adding more finesse to your soft game and shot placement.'
    };
  } else if (rating < 3500) {
    return {
      level: 'Advanced',
      description: 'You have excellent control, strategy, and shot selection. Work on adding more deception and adaptability to your game.'
    };
  } else if (rating < 4500) {
    return {
      level: 'Expert',
      description: 'You show mastery of all aspects of pickleball. Keep refining your game and working on mental toughness.'
    };
  } else {
    return {
      level: 'Professional',
      description: 'You compete at the highest levels of pickleball. Focus on maintaining peak performance and strategic innovation.'
    };
  }
}

// Convert numerical rating to skill level for Tennis

export function getTennisSkillLevel(rating: number): SkillLevelInfo {
  if (rating < 1000) {
    return {
      level: 'Beginner',
      description: "You're just starting your tennis journey. Focus on learning proper technique and basic strokes."
    };
  } else if (rating < 1300) {
    return {
      level: 'Advanced Beginner',
      description: "You have the basics down and are building consistency. Work on your serve and rally endurance."
    };
  } else if (rating < 1600) {
    return {
      level: 'Lower Intermediate',
      description: "You can sustain rallies and have developing shot variety. Focus on court positioning and strategy."
    };
  } else if (rating < 1900) {
    return {
      level: 'Intermediate',
      description: "You have good consistency and are developing tactical awareness. Work on your weaker shots and net game."
    };
  } else if (rating < 2300) {
    return {
      level: 'Upper Intermediate',
      description: "You have strong fundamentals and good court sense. Focus on shot selection and mental toughness."
    };
  } else if (rating < 2800) {
    return {
      level: 'Advanced',
      description: "You have excellent technique and tactical understanding. Work on adapting your game to different opponents."
    };
  } else if (rating < 3500) {
    return {
      level: 'Expert',
      description: "You show mastery of all tennis skills. Focus on fine-tuning your game and competitive performance."
    };
  } else {
    return {
      level: 'Professional',
      description: "You compete at the highest levels. Continue perfecting your craft and maintaining peak performance."
    };
  }
}

// Convert numerical rating to skill level for Padel

export function getPadelSkillLevel(rating: number): SkillLevelInfo {
  if (rating < 1000) {
    return {
      level: 'Beginner',
      description: "You're just starting your padel journey. Focus on learning the basic rules, wall play, and underhand serving technique."
    };
  } else if (rating < 1300) {
    return {
      level: 'Lower Intermediate',
      description: "You can sustain short rallies and understand basic positioning. Work on your wall play and net game consistency."
    };
  } else if (rating < 1600) {
    return {
      level: 'Intermediate',
      description: "You have good consistency and understand padel tactics. Focus on improving your glass play and court positioning with your partner."
    };
  } else if (rating < 1900) {
    return {
      level: 'Upper Intermediate',
      description: "You have strong fundamentals and good tactical awareness. Work on advanced wall shots and improving your smash game."
    };
  } else if (rating < 2300) {
    return {
      level: 'Advanced',
      description: "You show excellent control and strategic understanding. Focus on perfecting your glass play angles and team coordination."
    };
  } else if (rating < 2800) {
    return {
      level: 'Expert',
      description: "You have mastery of all padel techniques including advanced wall play. Work on mental toughness and adapting to different playing styles."
    };
  } else {
    return {
      level: 'Professional',
      description: "You compete at the highest levels of padel. Continue refining your game and maintaining peak performance."
    };
  }
}

// Get skill level for any sport based on rating

export function getSkillLevel(sport: string, rating: number): SkillLevelInfo {
  const sportLower = sport.toLowerCase();
  
  switch (sportLower) {
    case 'pickleball':
      return getPickleballSkillLevel(rating);
    case 'tennis':
      return getTennisSkillLevel(rating);
    case 'padel':
      return getPadelSkillLevel(rating);
    default:
      // Default to tennis scale for unknown sports
      return getTennisSkillLevel(rating);
  }
}

// Get the primary skill level for a user based on their skill ratings
// Uses the highest rating among all sports as the primary skill level

export function getPrimarySkillLevel(skillRatings: Record<string, any>): string {
  if (!skillRatings || typeof skillRatings !== 'object' || Object.keys(skillRatings).length === 0) {
    return 'No rating yet';
  }

  let highestRating = 0;
  let primarySport = '';

  // Find the sport with the highest rating
  for (const [sport, ratingData] of Object.entries(skillRatings)) {
    if (ratingData && typeof ratingData === 'object') {
      // Check for singles/doubles specific ratings first
      const singlesRating = ratingData.singles ? ratingData.singles * 1000 : 0;
      const doublesRating = ratingData.doubles ? ratingData.doubles * 1000 : 0;
      const generalRating = ratingData.rating ? ratingData.rating * 1000 : 0;
      
      const maxRating = Math.max(singlesRating, doublesRating, generalRating);
      
      if (maxRating > highestRating) {
        highestRating = maxRating;
        primarySport = sport;
      }
    }
  }

  if (highestRating === 0) {
    return 'No rating yet';
  }

  const skillLevelInfo = getSkillLevel(primarySport, highestRating);
  return skillLevelInfo.level;
}
