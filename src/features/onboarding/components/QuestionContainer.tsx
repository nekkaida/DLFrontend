import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Alert,
  Platform,
} from 'react-native';
import OptionButton from './OptionButton';
import NumberInput from './NumberInput';
import { toast } from 'sonner-native';
import {
  scaleFontSize,
  moderateScale,
  getResponsivePadding,
  createShadow,
  isSmallDevice,
} from '../screens/skill-assessment/utils/responsive';

const isSmall = isSmallDevice();

interface QuestionContainerProps {
  question: string;
  helpText?: string;
  contextText?: string;
  tooltipText?: string;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  navigationButtons?: React.ReactNode;
  questionKey?: string;
}

// Question context mapping
const getQuestionContext = (questionKey?: string) => {
  if (!questionKey) return null;
  
  const pickleballContextMap: { [key: string]: { text: string; tooltip?: string } } = {
    has_dupr: { 
      text: "We will take into account of your existing DUPR (if any) in calculating a provisional DMR for you.",
      tooltip: "DUPR is the official rating system used in competitive pickleball"
    },
    dupr_singles: { 
      text: "Your official singles rating for accurate assessment",
      tooltip: "DUPR ratings typically range from 2.0 (beginner) to 8.0+ (professional)"
    },
    dupr_doubles: { 
      text: "Your official doubles rating for accurate assessment",
      tooltip: "Doubles ratings may differ from singles due to partner play dynamics"
    },
    experience: { 
      text: "Experience level helps gauge your development",
      tooltip: "Playing time correlates with skill development patterns"
    },
    sports_background: { 
      text: "Other sports experience translates to pickleball",
      tooltip: "Tennis, badminton, and paddle sports provide transferable skills"
    },
    frequency: { 
      text: "How often you play affects skill development",
      tooltip: "Regular play accelerates improvement and maintains consistency"
    },
    competitive_level: { 
      text: "Your typical competition level",
      tooltip: "The skill level of your regular opponents indicates your own level"
    },
    skills: { 
      text: "Technical skills assessment",
      tooltip: "Different aspects of your game may be at different skill levels"
    },
    self_rating: { 
      text: "Your honest self-assessment",
      tooltip: "Self-perception helps validate our calculated rating"
    },
    tournament: { 
      text: "Tournament experience indicates skill level",
      tooltip: "Competitive play demonstrates ability under pressure"
    },
    coaching_background: {
      text: "Formal instruction background",
      tooltip: "Coaching experience often indicates higher skill levels"
    }
  };
  
  return pickleballContextMap[questionKey];
};

const QuestionContainer: React.FC<QuestionContainerProps> = ({
  question,
  helpText,
  contextText,
  tooltipText,
  children,
  containerStyle,
  navigationButtons,
  questionKey,
}) => {
  const showTooltip = () => {
    if (tooltipText) {
      Alert.alert('Info', tooltipText);
    }
  };

  // Use provided contextText or fall back to questionKey lookup
  const effectiveContextText = contextText || getQuestionContext(questionKey)?.text;
  const effectiveTooltipText = tooltipText || getQuestionContext(questionKey)?.tooltip;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.contentWrapper}>
        <Text style={styles.instructionText}>Select an answer</Text>
        <Text style={styles.questionText}>{question}</Text>

        {effectiveContextText && (
          <Text style={styles.contextText}>{effectiveContextText}</Text>
        )}

        <View style={styles.contentContainer}>{children}</View>
      </View>

      {navigationButtons && (
        <View style={styles.navigationContainer}>{navigationButtons}</View>
      )}
    </View>
  );
};

// Reusable QuestionCard component for stacked UI
interface QuestionCardProps {
  question: any;
  isActive: boolean;
  onAnswer: (questionKey: string, answer: string | number | { [key: string]: string }) => void;
  currentPageAnswers: {[key: string]: any};
  responses: any;
  navigationButtons: React.ReactNode;
  sport?: 'pickleball' | 'tennis' | 'padel';
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  isActive,
  onAnswer,
  currentPageAnswers,
  responses,
  navigationButtons,
  sport = 'pickleball',
}) => {
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'single_choice':
        return (
          <QuestionContainer
            question={question.question}
            helpText={question.help_text}
            questionKey={question.key}
            navigationButtons={navigationButtons}
          >
            {question.options?.map((option: string, index: number) => (
              <OptionButton
                key={index}
                title={option}
                isSelected={currentPageAnswers[question.key] === option || responses[question.key] === option}
                onPress={() => onAnswer(question.key, option)}
                sport={sport}
              />
            ))}
          </QuestionContainer>
        );
      
      case 'number':
        return (
          <QuestionContainer
            question={question.question}
            helpText={question.help_text}
            questionKey={question.key}
            navigationButtons={navigationButtons}
          >
            <NumberInput
              value={
                currentPageAnswers[question.key] !== undefined &&
                currentPageAnswers[question.key] !== null
                  ? String(currentPageAnswers[question.key])
                  : ''
              }
              onChangeText={(text) => {
                const normalizedText = text.replace(',', '.');

                if (normalizedText.trim() === '' || normalizedText.endsWith('.')) {
                  onAnswer(question.key, normalizedText);
                  return;
                }

                const numValue = parseFloat(normalizedText);
                if (!isNaN(numValue)) {
                  const belowMin =
                    question.min_value !== undefined && numValue < question.min_value;
                  const aboveMax =
                    question.max_value !== undefined && numValue > question.max_value;

                  if (belowMin || aboveMax) {
                    onAnswer(question.key, normalizedText);
                    return;
                  }

                  onAnswer(question.key, numValue);
                } else {
                  onAnswer(question.key, normalizedText);
                }
              }}
              onSubmit={() => {
                const text =
                  currentPageAnswers[question.key] !== undefined &&
                  currentPageAnswers[question.key] !== null
                    ? String(currentPageAnswers[question.key])
                    : '';
                const normalizedText = text.replace(',', '.');
                const numValue = parseFloat(normalizedText);
                if (
                  !isNaN(numValue) &&
                  (question.min_value === undefined || numValue >= question.min_value) &&
                  (question.max_value === undefined || numValue <= question.max_value)
                ) {
                  onAnswer(question.key, numValue);
                } else {
                  toast.error('Invalid Input', {
                    description: `Please enter a valid number${
                      question.min_value !== undefined && question.max_value !== undefined
                        ? ` between ${question.min_value} and ${question.max_value}`
                        : ''
                    }`,
                  });
                }
              }}
              onSkip={question.optional ? () => onAnswer(question.key, '') : undefined}
              minValue={question.min_value}
              maxValue={question.max_value}
              allowSkip={question.optional}
            />
          </QuestionContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.questionCardContainer}>
      {renderQuestionContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  questionCardContainer: {
    width: '100%',
  },

  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(isSmall ? 24 : 30),
    paddingHorizontal: getResponsivePadding(isSmall ? 20 : 24),
    paddingTop: moderateScale(isSmall ? 18 : 22),
    paddingBottom: moderateScale(isSmall ? 14 : 18),
    ...createShadow('#000', 0.12, 10, 6),
  },
  contentWrapper: {
    width: '100%',
  },
  instructionText: {
    fontSize: scaleFontSize(isSmall ? 12 : 13),
    color: '#8C8C8C',
    marginBottom: moderateScale(isSmall ? 6 : 8),
    fontFamily: 'Roboto',
    textAlign: 'left',
  },
  questionText: {
    fontSize: scaleFontSize(isSmall ? 18 : 20),
    fontWeight: '600',
    color: '#000000',
    marginBottom: moderateScale(isSmall ? 12 : 16),
    fontFamily: 'Roboto',
    lineHeight: scaleFontSize(isSmall ? 24 : 28),
    textAlign: 'left',
  },
  contextText: {
    fontSize: scaleFontSize(isSmall ? 14 : 15),
    color: '#6C7278',
    marginBottom: moderateScale(isSmall ? 10 : 12),
    fontFamily: 'Roboto',
    lineHeight: scaleFontSize(isSmall ? 20 : 22),
    textAlign: 'left',
    fontStyle: 'italic',
  },
  contentContainer: {
    gap: moderateScale(isSmall ? 6 : 8),
    marginBottom: moderateScale(isSmall ? 6 : 8),
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(isSmall ? 6 : 8),
    paddingBottom: moderateScale(isSmall ? 2 : 4),
  },
});

export default QuestionContainer;
