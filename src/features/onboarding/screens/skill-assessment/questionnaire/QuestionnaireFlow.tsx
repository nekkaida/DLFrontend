import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { QuestionCard } from '../../../components/QuestionContainer';
import { QuestionProgressBar } from './QuestionProgressBar';
import { NavigationButtons } from '../components/NavigationButtons';
import { styles } from './QuestionnaireFlow.styles';

interface QuestionnaireFlowProps {
  sport: 'pickleball' | 'tennis' | 'padel';
  questions: any[];
  currentQuestionIndex: number;
  currentPageAnswers: { [key: string]: any };
  responses: any;
  progress: { current: number; total: number };
  onAnswer: (questionKey: string, answer: any) => void;
  onBack: () => void;
  onNext: () => void;
}

export const QuestionnaireFlow: React.FC<QuestionnaireFlowProps> = ({
  sport,
  questions,
  currentQuestionIndex,
  currentPageAnswers,
  responses,
  progress,
  onAnswer,
  onBack,
  onNext,
}) => {
  // Track displayed question index separately from prop
  const [displayedIndex, setDisplayedIndex] = useState(currentQuestionIndex);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animation values for current card (sliding out)
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Animation values for next card (behind, sliding up into position)
  const nextCardTranslateY = useRef(new Animated.Value(20)).current; // Start 20px below
  const nextCardScale = useRef(new Animated.Value(0.95)).current; // Start slightly smaller
  const nextCardOpacity = useRef(new Animated.Value(0.7)).current; // Start semi-transparent

  // When parent updates currentQuestionIndex, update displayed index after animation
  useEffect(() => {
    if (currentQuestionIndex !== displayedIndex && !isAnimating) {
      setDisplayedIndex(currentQuestionIndex);
      slideAnim.setValue(0);
      scaleAnim.setValue(1);
      fadeAnim.setValue(1);
      // Reset next card to "behind" position for new cycle
      nextCardTranslateY.setValue(20);
      nextCardScale.setValue(0.95);
      nextCardOpacity.setValue(0.7);
    }
  }, [currentQuestionIndex, displayedIndex, isAnimating, slideAnim, scaleAnim, fadeAnim, nextCardTranslateY, nextCardScale, nextCardOpacity]);

  const handleNext = () => {
    setIsAnimating(true);

    // Update state immediately before animation to prevent key change flash
    const nextIndex = displayedIndex + 1;
    setDisplayedIndex(nextIndex);
    onNext();

    // Simultaneous animation: current card slides left, next card slides up into position
    Animated.parallel([
      // Current card: slides left and fades out
      Animated.timing(slideAnim, {
        toValue: -500, // Slide left off screen
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),

      // Next card: smoothly slides up and scales to full size
      Animated.timing(nextCardTranslateY, {
        toValue: 0, // Slide up to position
        duration: 600, // Slower, more gradual
        useNativeDriver: true,
      }),
      Animated.timing(nextCardScale, {
        toValue: 1, // Scale to full size
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(nextCardOpacity, {
        toValue: 1, // Fade to full opacity
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After all animations complete, reset for next cycle
      setIsAnimating(false);

      // Reset animation values for next cycle
      slideAnim.setValue(0);
      scaleAnim.setValue(1);
      fadeAnim.setValue(1);
      nextCardTranslateY.setValue(20);
      nextCardScale.setValue(0.95);
      nextCardOpacity.setValue(0.7);
    });
  };

  return (
    <>
      {/* Header */}
      <View style={styles.questionnaireHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18L9 12L15 6"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        <Text style={[
          styles.questionnaireTitle,
          sport === 'tennis' && styles.tennisQuestionnaireTitle,
          sport === 'padel' && styles.padelQuestionnaireTitle
        ]}>
          {sport}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <QuestionProgressBar current={progress.current} total={progress.total} />

      {/* Question Content - Card Stack */}
      <View style={styles.questionnaireContainer}>
        {questions && questions.length > 0 && displayedIndex < questions.length ? (
          <View style={styles.cardStack}>
            {/* Render stack placeholder cards (showing remaining depth) - max 3 visible */}
            {(() => {
              const remainingCards = questions.length - displayedIndex - 2; // -2 for current and next card
              const visibleStackCards = Math.max(0, Math.min(3, remainingCards));

              return [...Array(visibleStackCards)].map((_, i) => {
                const cardIndex = displayedIndex + i + 2;
                if (cardIndex >= questions.length) return null;

                // Each card is offset further back and down
                const offsetY = (i + 2) * 6; // Stack offset: 12px, 18px, 24px
                const offsetX = (i + 2) * 4; // Side offset: 8px, 12px, 16px

                return (
                  <Animated.View
                    key={`stack-card-${cardIndex}`}
                    style={[
                      styles.stackedCardLayer,
                      {
                        transform: [
                          { translateY: offsetY },
                          { scale: 1 - (i + 2) * 0.02 }, // Slightly smaller: 0.96, 0.94, 0.92
                        ],
                        marginHorizontal: offsetX,
                        zIndex: 8 - i,
                      },
                    ]}
                  >
                    {/* Empty card placeholder showing just the edge - solid white */}
                    <View style={styles.cardPlaceholder} />
                  </Animated.View>
                );
              });
            })()}

            {/* Next card (behind current, animated to slide up) */}
            {displayedIndex < questions.length - 1 && (
              <Animated.View
                key={`next-card-${displayedIndex + 1}`}
                style={[
                  styles.nextCardContainer,
                  {
                    opacity: nextCardOpacity,
                    transform: [
                      { translateY: nextCardTranslateY },
                      { scale: nextCardScale },
                    ],
                  },
                ]}
              >
                <QuestionCard
                  question={questions[displayedIndex + 1]}
                  isActive={false}
                  onAnswer={() => {}}
                  currentPageAnswers={{}}
                  responses={responses}
                  navigationButtons={null}
                  sport={sport}
                />
              </Animated.View>
            )}

            {/* Active card (current question) - front, slides left when answered */}
            <Animated.View
              key={`question-card-${displayedIndex}`}
              style={[
                styles.activeCardContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateX: slideAnim },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              <QuestionCard
                question={questions[displayedIndex]}
                isActive={true}
                onAnswer={onAnswer}
                currentPageAnswers={currentPageAnswers}
                responses={responses}
                navigationButtons={
                  <NavigationButtons
                    onBack={onBack}
                    onNext={handleNext}
                    nextEnabled={(() => {
                      const question = questions?.[displayedIndex];
                      if (!question) return false;
                      if (question.type === 'number') {
                        return currentPageAnswers[question.key] !== undefined || question.optional;
                      } else {
                        return currentPageAnswers[question.key] !== undefined;
                      }
                    })()}
                  />
                }
                sport={sport}
              />
            </Animated.View>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {questions.length === 0 ? 'Loading questions...' : 'Preparing assessment...'}
            </Text>
          </View>
        )}
      </View>
    </>
  );
};
