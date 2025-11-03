import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Svg, Path } from 'react-native-svg';
import { PickleballQuestionnaire, Question, QuestionnaireResponse } from '@/src/features/onboarding/services/PickleballQuestionnaire';
import { TennisQuestionnaire, TennisQuestion, TennisQuestionnaireResponse } from '@/src/features/onboarding/services/TennisQuestionnaire';
import { PadelQuestionnaire, PadelQuestion, PadelQuestionnaireResponse } from '@/src/features/onboarding/services/PadelQuestionnaire';
import { BackgroundGradient } from '@/src/features/onboarding/components';
import { QuestionCard } from '@/src/features/onboarding/components/QuestionContainer';
import { LoadingSpinner } from '@/shared/components/ui';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner-native';
import { questionnaireAdapter } from '@/src/features/onboarding/services/adapter';
import * as Haptics from 'expo-haptics';
import { QuestionnaireIntroduction, QuestionnaireResults } from '@/src/features/dashboard-user/components';
import { expandSkillMatrixQuestions, getQuestionProgress } from '@/src/features/dashboard-user/utils/questionnaireHelpers';

export default function CompleteQuestionnaireScreen() {
  const { sport, seasonId, leagueId, returnPath } = useLocalSearchParams<{
    sport: 'pickleball' | 'tennis' | 'padel';
    seasonId?: string;
    leagueId?: string;
    returnPath?: 'season-details' | 'league-details';
  }>();
  
  const { data: session } = useSession();
  const userId = session?.user?.id;
  
  // Get user's first name
  const firstName = session?.user?.name ? session.user.name.split(' ')[0] : 'there';
  
  // Questionnaire state
  const [pickleballQuestionnaire] = useState(() => new PickleballQuestionnaire());
  const [tennisQuestionnaire] = useState(() => new TennisQuestionnaire());
  const [padelQuestionnaire] = useState(() => new PadelQuestionnaire());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionnaireResponse | TennisQuestionnaireResponse | PadelQuestionnaireResponse>({});
  const [questions, setQuestions] = useState<Question[] | TennisQuestion[] | PadelQuestion[]>([]);
  const [currentQuestionnaireType, setCurrentQuestionnaireType] = useState<'pickleball' | 'tennis' | 'padel' | null>(null);
  const [skillResponses, setSkillResponses] = useState<any>({});
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [currentPageAnswers, setCurrentPageAnswers] = useState<{[key: string]: any}>({});
  const [showIntroduction, setShowIntroduction] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  
  // Initialize questionnaire
  useEffect(() => {
    if (sport && ['pickleball', 'tennis', 'padel'].includes(sport)) {
      setCurrentQuestionnaireType(sport);
      setShowIntroduction(true);
      setShowResults(false);
    }
  }, [sport]);
  
  const startFreshAssessment = () => {
    if (!currentQuestionnaireType) return;
    
    const questionnaire = currentQuestionnaireType === 'pickleball' ? pickleballQuestionnaire : 
                         currentQuestionnaireType === 'tennis' ? tennisQuestionnaire : padelQuestionnaire;
    
    const initialQuestions = questionnaire.getConditionalQuestions({});
    if (initialQuestions.length > 0) {
      const expandedQuestions = expandSkillMatrixQuestions(initialQuestions);
      setQuestions(expandedQuestions);
      setCurrentQuestionIndex(0);
      setShowIntroduction(false);
    }
  };

  const handleSkipIntroduction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleQuestionnaireResponse = (questionKey: string, answer: string | number | { [key: string]: string }) => {
    // Update current page answers instead of proceeding immediately
    const newPageAnswers = { ...currentPageAnswers, [questionKey]: answer };
    setCurrentPageAnswers(newPageAnswers);
  };
  
  const proceedToNextQuestion = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    // Handle individual skill questions differently (from skill matrix)
    let finalPageAnswers = { ...currentPageAnswers };
    let updatedResponses = { ...responses };
    
    // Check if this is a skill question (has originalKey and skillKey)
    if ('originalKey' in currentQuestion && 'skillKey' in currentQuestion) {
      const originalKey = (currentQuestion as any).originalKey;
      const skillKey = (currentQuestion as any).skillKey;
      
      // Initialize the skill responses object if it doesn't exist
      if (!updatedResponses[originalKey]) {
        (updatedResponses as any)[originalKey] = {};
      }
      
      // Add the skill response to the appropriate skill matrix
      if (currentPageAnswers[currentQuestion.key] !== undefined) {
        (updatedResponses as any)[originalKey][skillKey] = currentPageAnswers[currentQuestion.key];
      }
      
      // Remove the individual skill question answer from finalPageAnswers since it's now in the skill matrix
      delete finalPageAnswers[currentQuestion.key];
      
      // If we're not at the last question in the current set, just move to next
      if (currentQuestionIndex < questions.length - 1) {
        setResponses(updatedResponses);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentPageAnswers({});
        return;
      }
    }
    
    // Merge all responses together (including skill matrices and regular answers)
    const newResponses = { ...updatedResponses, ...finalPageAnswers };
    setResponses(newResponses);
    
    // Get the appropriate questionnaire
    const questionnaire = currentQuestionnaireType === 'pickleball' ? pickleballQuestionnaire : 
                         currentQuestionnaireType === 'tennis' ? tennisQuestionnaire : padelQuestionnaire;
    
    // Get next questions based on updated responses
    const nextQuestions = questionnaire.getConditionalQuestions(newResponses);
    
    // Clear current page answers
    setCurrentPageAnswers({});
    
    // Check if questionnaire is complete (no more questions)
    if (nextQuestions.length === 0) {
      // Questionnaire complete, calculate rating and submit
      console.log('🎯 Questionnaire complete, submitting...', newResponses);
      if (currentQuestionnaireType === 'pickleball') {
        await completeQuestionnaire(newResponses as QuestionnaireResponse);
      } else if (currentQuestionnaireType === 'tennis') {
        await completeQuestionnaire(newResponses as TennisQuestionnaireResponse);
      } else {
        await completeQuestionnaire(newResponses as PadelQuestionnaireResponse);
      }
      return;
    }
    
    // Update questions and reset to first question of new set
    const expandedQuestions = expandSkillMatrixQuestions(nextQuestions);
    setQuestions(expandedQuestions);
    setCurrentQuestionIndex(0);
    console.log('📖 Moving to next question set:', expandedQuestions.length, 'questions');
  };
  
  const completeQuestionnaire = async (finalResponses: QuestionnaireResponse | TennisQuestionnaireResponse | PadelQuestionnaireResponse) => {
    if (!userId || !sport) return;
    
    setLoadingMessage(`Calculating your ${sport} rating...`);
    setIsSubmittingAssessment(true);
    
    try {
      // Get the appropriate questionnaire
      const questionnaire = currentQuestionnaireType === 'pickleball' ? pickleballQuestionnaire : 
                           currentQuestionnaireType === 'tennis' ? tennisQuestionnaire : padelQuestionnaire;
      
      // Calculate rating
      const ratingResult = questionnaire.calculateInitialRating(finalResponses);
      // Generate feedback (with type assertion for padel/tennis)
      const feedback = (questionnaire as any).generateFeedback ? (questionnaire as any).generateFeedback(ratingResult) : '';
      
      console.log(`✅ ${sport} rating calculated:`, ratingResult);
      
      // Save to backend - this automatically adds the sport to user's profile
      await questionnaireAdapter.saveQuestionnaireResponse(sport, finalResponses, userId);
      console.log(`✅ Questionnaire saved to backend for ${sport}`);
      
      // Store results to show in results screen
      setAssessmentResults({
        rating: ratingResult,
        feedback: feedback,
        responses: finalResponses
      });
      
      // Hide loading and show results
      setIsSubmittingAssessment(false);
      setShowResults(true);
    } catch (error) {
      console.error('Error completing questionnaire:', error);
      setIsSubmittingAssessment(false);
      toast.error('Error', {
        description: 'There was an issue submitting your questionnaire. Please try again.',
      });
    }
  };
  
  const handleContinueFromResults = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };
  
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCurrentPageAnswers({});
    } else {
      // Go back to previous screen
      router.back();
    }
  };
  
  const handleNext = () => {
    proceedToNextQuestion();
  };
  
  // Calculate total questions and current progress (matching onboarding design)
  const calculateProgress = () => {
    return getQuestionProgress(
      currentQuestionnaireType,
      responses,
      currentPageAnswers,
      pickleballQuestionnaire,
      tennisQuestionnaire,
      padelQuestionnaire,
      expandSkillMatrixQuestions
    );
  };
  
  if (isSubmittingAssessment) {
    return (
      <SafeAreaView style={styles.container}>
        <BackgroundGradient sport={sport || 'pickleball'} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner message={loadingMessage} />
        </View>
      </SafeAreaView>
    );
  }
  
  // Show results screen if available
  if (showResults && assessmentResults && sport) {
    return (
      <QuestionnaireResults
        sport={sport}
        firstName={firstName}
        results={assessmentResults}
        onContinue={handleContinueFromResults}
      />
    );
  }
  
  if (!sport || !currentQuestionnaireType) {
    return (
      <SafeAreaView style={styles.container}>
        <BackgroundGradient sport={sport || 'pickleball'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A04DFE" />
          <Text style={styles.loadingText}>Loading questionnaire...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // Show introduction screen first
  if (showIntroduction && currentQuestionnaireType && sport) {
    return (
      <SafeAreaView style={styles.container}>
        <BackgroundGradient sport={sport} />
        <View style={styles.contentContainer}>
          <QuestionnaireIntroduction
            sport={sport}
            firstName={firstName}
            onStart={startFreshAssessment}
            onSkip={handleSkipIntroduction}
            skipButtonText="Go Back"
          />
        </View>
      </SafeAreaView>
    );
  }
  
  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <BackgroundGradient sport={sport || 'pickleball'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A04DFE" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const progress = calculateProgress();
  
  return (
    <SafeAreaView style={styles.container}>
      <BackgroundGradient sport={sport || 'pickleball'} />
      <View style={styles.contentContainer}>
        {/* Questionnaire Header - Matching onboarding design */}
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
            currentQuestionnaireType === 'tennis' && styles.tennisQuestionnaireTitle,
            currentQuestionnaireType === 'padel' && styles.padelQuestionnaireTitle
          ]}>
            {currentQuestionnaireType === 'pickleball' ? 'pickleball' : 
             currentQuestionnaireType === 'tennis' ? 'tennis' : 'padel'}
          </Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Indicator - Matching onboarding design */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Question {progress.current}/{progress.total}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(progress.current / progress.total) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Question Content - Matching onboarding design with card stack */}
        <View style={styles.questionnaireContainer}>
          {questions.length > 0 && currentQuestionIndex < questions.length ? (
            <View style={styles.cardStackContainer}>
              {/* Render current and next question cards */}
              {questions.slice(currentQuestionIndex, currentQuestionIndex + 2).map((question, index) => {
                const actualIndex = currentQuestionIndex + index;
                const isActive = index === 0;
                
                // Determine if Next button should be enabled
                const isNextEnabled = () => {
                  if (question.type === 'number') {
                    return currentPageAnswers[question.key] !== undefined || question.optional;
                  } else {
                    return currentPageAnswers[question.key] !== undefined;
                  }
                };
                
                const navigationButtons = (
                  <>
                    <TouchableOpacity
                      style={styles.skipButton}
                      onPress={handleBack}
                    >
                      <Text style={styles.skipButtonText}>Back</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.nextButtonContainer,
                        !isNextEnabled() && styles.nextButtonDisabled
                      ]}
                      onPress={handleNext}
                      disabled={!isNextEnabled()}
                    >
                      <LinearGradient
                        colors={['#FEA04D', '#FF7903']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.nextButtonGradient}
                      >
                        <Text style={styles.nextButtonText}>
                          {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Complete'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                );
                
                return (
                  <QuestionCard
                    key={actualIndex}
                    question={question}
                    isActive={isActive}
                    onAnswer={handleQuestionnaireResponse}
                    currentPageAnswers={currentPageAnswers}
                    responses={responses}
                    navigationButtons={navigationButtons}
                    sport={currentQuestionnaireType || 'pickleball'}
                  />
                );
              })}
            </View>
          ) : questions.length === 0 ? (
            <View style={styles.questionContainer}>
              <Text style={styles.loadingText}>Loading questions...</Text>
            </View>
          ) : (
            <View style={styles.questionContainer}>
              <Text style={styles.loadingText}>Preparing assessment...</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Loading Overlay */}
      {isSubmittingAssessment && (
        <LoadingSpinner
          overlay={true}
          showCard={true}
          message={loadingMessage}
          color="#FE9F4D"
          size="large"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  questionnaireHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionnaireTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#CA9BFF',
    fontFamily: 'Poppins',
    textTransform: 'lowercase',
  },
  tennisQuestionnaireTitle: {
    color: '#D7FFA9',
  },
  padelQuestionnaireTitle: {
    color: '#9BD0FF',
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 36,
    paddingBottom: 20,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    marginBottom: 20,
    marginTop: 30,
    textAlign: 'left',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FE9F4D',
    borderRadius: 4,
  },
  questionnaireContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  cardStackContainer: {
    flex: 1,
    position: 'relative',
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#FE9F4D',
    fontWeight: '500',
    fontFamily: 'Roboto',
  },
  nextButtonContainer: {
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  nextButtonGradient: {
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 100,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Roboto',
  },
});