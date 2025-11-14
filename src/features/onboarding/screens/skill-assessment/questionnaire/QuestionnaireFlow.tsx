import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { QuestionCard } from '../../../components/QuestionContainer';
import { QuestionProgressBar } from './QuestionProgressBar';
import { NavigationButtons } from '../components/NavigationButtons';
import { styles } from './QuestionnaireFlow.styles';
import { moderateScale, isSmallDevice } from '../utils/responsive';

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
  const lipHeight = useMemo(() => moderateScale(isSmallDevice() ? 10 : 12), []);
  const stackPeekOffset = useMemo(() => moderateScale(isSmallDevice() ? 6 : 8), []);

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

  const resetCardAnimations = () => {
    slideAnim.setValue(0);
    scaleAnim.setValue(1);
    fadeAnim.setValue(1);
    nextCardTranslateY.setValue(20);
    nextCardScale.setValue(0.95);
    nextCardOpacity.setValue(0.7);
  };

  const handleNext = () => {
    if (isAnimating) {
      return;
    }

    setIsAnimating(true);

    const runTransition = () =>
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
    ]);

    runTransition().start(() => {
      const finalize = () => {
        resetCardAnimations();
        setIsAnimating(false);
      };

      try {
        const maybePromise = onNext?.();
        if (maybePromise && typeof (maybePromise as PromiseLike<void>).then === 'function') {
          (maybePromise as PromiseLike<void>)
            .catch((error) => {
              console.error('Failed to advance questionnaire:', error);
            })
            .finally(finalize);
        } else {
          finalize();
        }
      } catch (error) {
        console.error('Failed to advance questionnaire:', error);
        finalize();
      }
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
                    paddingTop: stackPeekOffset,
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
