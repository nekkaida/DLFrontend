import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import Carousel, { ICarouselInstance, TAnimationStyle } from 'react-native-reanimated-carousel';
import { QuestionCard } from '../../../components/QuestionContainer';
import { QuestionProgressBar } from './QuestionProgressBar';
import { NavigationButtons } from '../components/NavigationButtons';
import { styles } from './QuestionnaireFlow.styles';
import { filterVisibleQuestions } from '../utils/showIfEvaluator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sport type definition to avoid triggering security filters
type SportType = 'pickleball' | 'tennis' | 'padel';

interface QuestionnaireFlowProps {
  sport: SportType;
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
  const carouselRef = useRef<ICarouselInstance>(null);
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  // Track swipe direction for rotation animation
  const directionAnimVal = useSharedValue(0);

  // Shared value to track last card state for worklet access
  const isLastCardShared = useSharedValue(false);

  // Track if we're programmatically navigating (to avoid double-triggers)
  const isProgrammaticNav = useRef(false);

  // Track the carousel's actual displayed index (independent of parent state)
  // This is crucial because parent's currentQuestionIndex might not match carousel position
  const [carouselDisplayIndex, setCarouselDisplayIndex] = useState(0);

  // Filter to only visible questions based on showIf conditions
  // This provides STABLE carousel data - questions only appear/disappear based on responses
  const visibleQuestions = useMemo(() => {
    return filterVisibleQuestions(questions, responses);
  }, [questions, responses]);

  // Map currentQuestionIndex (in all questions) to visible index (in filtered array)
  const currentVisibleIndex = useMemo(() => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return 0;
    const foundIndex = visibleQuestions.findIndex(q => q.key === currentQuestion.key);
    // If current question is hidden (not in visible list), default to 0 to prevent -1
    // This handles edge cases where showIf conditions hide the current question
    if (foundIndex === -1) {
      console.warn(`Question ${currentQuestion.key} not found in visible questions, defaulting to index 0`);
      return 0;
    }
    return foundIndex;
  }, [questions, currentQuestionIndex, visibleQuestions]);

  // Track previous visible questions to detect changes
  const prevVisibleLengthRef = useRef(visibleQuestions.length);

  // Card dimensions
  const CARD_WIDTH = SCREEN_WIDTH - 30; // Account for padding
  const CARD_HEIGHT = SCREEN_HEIGHT * 0.72; // Reasonable card height

  // Tinder-style animation
  const animationStyle: TAnimationStyle = useCallback(
    (value: number) => {
      'worklet';
      // value: 0 = current card, -1 = swiped out left, 1 = next card in stack

      // Horizontal movement - swipe out to the right based on direction
      const translateX =
        interpolate(value, [-1, 0], [CARD_WIDTH + 50, 0], Extrapolation.CLAMP) *
        directionAnimVal.value;

      // Vertical offset for stacked cards (cards behind move down slightly)
      const translateY = interpolate(value, [0, 1], [0, 15], Extrapolation.CLAMP);

      // Rotation on swipe - Tinder flip effect
      const rotateZ =
        interpolate(value, [-1, 0], [12, 0], Extrapolation.CLAMP) *
        directionAnimVal.value;

      // Scale - cards behind are slightly smaller
      const scale = interpolate(value, [0, 1], [1, 0.95], Extrapolation.CLAMP);

      // Opacity - fade out swiped card, dim cards behind
      const opacity = interpolate(
        value,
        [-1, -0.8, 0, 1],
        [0, 0.9, 1, 0.85],
        Extrapolation.EXTEND,
      );

      // Z-index simulation via transform order
      const zIndex = interpolate(value, [-1, 0, 1], [0, 100, 50], Extrapolation.CLAMP);

      return {
        transform: [
          { translateY },
          { translateX },
          { rotateZ: `${rotateZ}deg` },
          { scale },
        ],
        opacity,
        zIndex: Math.round(zIndex),
      };
    },
    [CARD_WIDTH, directionAnimVal]
  );

  // Handle visible questions count changes (when new questions become visible)
  useEffect(() => {
    const visibleLengthChanged = visibleQuestions.length !== prevVisibleLengthRef.current;

    if (visibleLengthChanged) {
      console.log(`Visible questions changed: ${prevVisibleLengthRef.current} -> ${visibleQuestions.length}`);
      prevVisibleLengthRef.current = visibleQuestions.length;
    }
  }, [visibleQuestions.length]);

  // Sync carousel position with external index changes (e.g., back button, parent navigation)
  useEffect(() => {
    if (carouselRef.current && !isProgrammaticNav.current && currentVisibleIndex >= 0) {
      const currentCarouselIndex = carouselRef.current.getCurrentIndex();
      if (currentCarouselIndex !== currentVisibleIndex) {
        console.log(`Syncing carousel: ${currentCarouselIndex} -> ${currentVisibleIndex}`);
        carouselRef.current.scrollTo({ index: currentVisibleIndex, animated: true });
        // Also sync our tracked index
        setCarouselDisplayIndex(currentVisibleIndex);
      }
    }
  }, [currentVisibleIndex]);

  // Update shared value for worklet access - track if on last card
  useEffect(() => {
    isLastCardShared.value = carouselDisplayIndex >= visibleQuestions.length - 1;
  }, [carouselDisplayIndex, visibleQuestions.length, isLastCardShared]);

  // Initialize carouselDisplayIndex when currentVisibleIndex changes from parent
  useEffect(() => {
    setCarouselDisplayIndex(currentVisibleIndex);
  }, [currentVisibleIndex]);

  // Handle carousel snap to new index
  const handleSnapToItem = useCallback((index: number) => {
    // Always track the carousel's actual displayed index
    setCarouselDisplayIndex(index);

    // Only trigger onNext if user swiped forward (not programmatic or back)
    if (!isProgrammaticNav.current && index > currentVisibleIndex) {
      console.log(`User swiped to visible index ${index}, triggering onNext`);
      onNextRef.current();
    }
    isProgrammaticNav.current = false;
  }, [currentVisibleIndex]);

  // Handle last card swipe completion (called from worklet via runOnJS)
  const handleLastCardSwipe = useCallback(() => {
    // Only proceed if answer is selected (same logic as isNextEnabled)
    const question = visibleQuestions?.[carouselDisplayIndex];
    if (!question) return;

    const hasAnswer = currentPageAnswers[question.key] !== undefined ||
                     responses[question.key] !== undefined;
    const canProceed = question.type === 'number' ? (hasAnswer || question.optional) : hasAnswer;

    if (canProceed) {
      console.log('Last card swipe detected, triggering completion');
      onNext();
    }
  }, [visibleQuestions, carouselDisplayIndex, currentPageAnswers, responses, onNext]);

  // Programmatic navigation to next
  // Use carouselDisplayIndex for accurate last-question detection
  const handleNext = useCallback(() => {
    // Check if this is the last visible question
    if (carouselDisplayIndex >= visibleQuestions.length - 1) {
      // Last visible question - let parent handle completion
      onNext();
      return;
    }

    isProgrammaticNav.current = true;
    directionAnimVal.value = 1; // Swipe right direction
    carouselRef.current?.next();

    // Trigger parent's onNext after animation
    setTimeout(() => {
      onNextRef.current();
    }, 300);
  }, [carouselDisplayIndex, visibleQuestions.length, onNext, directionAnimVal]);

  // Handle skip (for optional questions)
  // Use carouselDisplayIndex to ensure we skip the correct displayed question
  const handleSkipAndProceed = useCallback(() => {
    const question = visibleQuestions[carouselDisplayIndex];
    if (question?.optional && question?.key) {
      onAnswer(question.key, '');
    }
    handleNext();
  }, [visibleQuestions, carouselDisplayIndex, onAnswer, handleNext]);

  // Check if next button should be enabled
  // IMPORTANT: Use carouselDisplayIndex (actual carousel position) instead of currentVisibleIndex
  // This ensures we check the ACTUAL question being displayed, not the parent's tracked index
  const isNextEnabled = useCallback(() => {
    const question = visibleQuestions?.[carouselDisplayIndex];
    if (!question) return false;

    const hasAnswer = currentPageAnswers[question.key] !== undefined ||
                     responses[question.key] !== undefined;

    if (question.type === 'number') {
      return hasAnswer || question.optional;
    }
    return hasAnswer;
  }, [visibleQuestions, carouselDisplayIndex, currentPageAnswers, responses]);

  // Render individual question card
  const renderItem = useCallback(({ item: question, index }: { item: any; index: number }) => {
    // Show navigation buttons on cards near the carousel's actual displayed index
    // Use carouselDisplayIndex for accurate positioning regardless of parent state
    const isCurrentCard = index === carouselDisplayIndex;
    const isNearCurrent = Math.abs(index - carouselDisplayIndex) <= 1;

    return (
      <Animated.View style={styles.activeCardContainer} key={question.key}>
        <QuestionCard
          question={question}
          isActive={isCurrentCard}
          onAnswer={onAnswer}
          currentPageAnswers={currentPageAnswers}
          responses={responses}
          showContent={true}
          onSkipAndProceed={handleSkipAndProceed}
          navigationButtons={
            isNearCurrent ? (
              <NavigationButtons
                onBack={onBack}
                onNext={handleNext}
                nextEnabled={isNextEnabled()}
              />
            ) : null
          }
          sport={sport}
        />
      </Animated.View>
    );
  }, [
    carouselDisplayIndex,
    onAnswer,
    currentPageAnswers,
    responses,
    handleSkipAndProceed,
    onBack,
    handleNext,
    isNextEnabled,
    sport,
  ]);

  return (
    <>
      {/* Header */}
      <View style={styles.questionnaireHeader}>
        <Text style={[
          styles.questionnaireTitle,
          sport === 'tennis' && styles.tennisQuestionnaireTitle,
          sport === 'padel' && styles.padelQuestionnaireTitle
        ]}>
          {sport}
        </Text>
      </View>

      {/* Progress Bar */}
      <QuestionProgressBar current={progress.current} total={progress.total} />

      {/* Question Cards Carousel - Uses visibleQuestions for stable animation */}
      <View style={styles.questionnaireContainer}>
        {visibleQuestions && visibleQuestions.length > 0 ? (
          <Carousel
            ref={carouselRef}
            data={visibleQuestions}
            renderItem={renderItem}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            style={{
              width: SCREEN_WIDTH,
              alignItems: 'center',
            }}
            loop={false}
            defaultIndex={currentVisibleIndex >= 0 ? currentVisibleIndex : 0}
            onConfigurePanGesture={(gesture) => {
              gesture.onChange((e) => {
                'worklet';
                // Track swipe direction for rotation animation
                directionAnimVal.value = Math.sign(e.translationX);
              });
              gesture.onEnd((e) => {
                'worklet';
                // Detect left swipe (negative translationX) on last card with sufficient velocity/distance
                // This allows users to swipe the last question to complete the questionnaire
                const isLeftSwipe = e.translationX < -50 || e.velocityX < -500;
                if (isLastCardShared.value && isLeftSwipe) {
                  runOnJS(handleLastCardSwipe)();
                }
              });
            }}
            // Only allow swiping forward (left swipe = next), not backward
            fixedDirection="negative"
            customAnimation={animationStyle}
            onSnapToItem={handleSnapToItem}
            // Performance: only render nearby cards
            windowSize={3}
            // Disable swipe when no answer selected
            enabled={isNextEnabled()}
            // Scroll animation config
            scrollAnimationDuration={300}
          />
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
