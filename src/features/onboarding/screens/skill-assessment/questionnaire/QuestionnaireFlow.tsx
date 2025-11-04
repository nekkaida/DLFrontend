import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { router } from 'expo-router';
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
  return (
    <>
      {/* Header */}
      <View style={styles.questionnaireHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
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

      {/* Question Content */}
      <View style={styles.questionnaireContainer}>
        {questions.length > 0 && currentQuestionIndex < questions.length ? (
          <>
            <View style={styles.questionCardWrapper}>
              <QuestionCard
                question={questions[currentQuestionIndex]}
                isActive={true}
                onAnswer={onAnswer}
                currentPageAnswers={currentPageAnswers}
                responses={responses}
                navigationButtons={null}
                sport={sport}
              />
            </View>

            <View style={styles.navigationButtonsContainer}>
              <NavigationButtons
                onBack={onBack}
                onNext={onNext}
                nextEnabled={(() => {
                  const question = questions[currentQuestionIndex];
                  if (question.type === 'number') {
                    return currentPageAnswers[question.key] !== undefined || question.optional;
                  } else {
                    return currentPageAnswers[question.key] !== undefined;
                  }
                })()}
              />
            </View>
          </>
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
