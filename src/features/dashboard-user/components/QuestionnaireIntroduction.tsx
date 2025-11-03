import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Svg, Path, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import TennisIconSvg from '@/assets/images/tennis-icon.svg';
import PadelIconSvg from '@/assets/images/padel-icon.svg';

interface QuestionnaireIntroductionProps {
  sport: 'pickleball' | 'tennis' | 'padel';
  firstName: string;
  onStart: () => void;
  onSkip: () => void;
  skipButtonText?: string;
}

// Sport Icons with faded yellow-orange color
const PickleballIcon = () => (
  <Svg width="70" height="70" viewBox="0 0 64 64" fill="none">
    <G>
      <G fill="#F8F3FF">
        <Path d="M6.519 33.26a1.5 1.5 0 0 1-1.461-1.166C.346 11.497 12.714 4.013 13.243 3.704a1.5 1.5 0 0 1 1.516 2.59c-.477.284-10.97 6.8-6.778 25.131A1.5 1.5 0 0 1 6.52 33.26zM17 15.5a1.5 1.5 0 0 1-1.5-1.5c-.001-6.771 5.493-10.146 5.728-10.286a1.5 1.5 0 0 1 1.548 2.57C22.6 6.391 18.5 8.96 18.5 14a1.5 1.5 0 0 1-1.5 1.5z" fill="#F8F3FF" opacity="1"/>
        <Path d="M13.17 26.61a1.5 1.5 0 0 1-1.326-.799c-2.444-4.62-.942-9.194-.876-9.387a1.499 1.499 0 1 1 2.842.962c-.01.029-1.14 3.572.686 7.023a1.5 1.5 0 0 1-1.325 2.201zM28.52 19.21c-.263 0-.529-.07-.771-.214-4.985-2.988-4.674-7.66-2.893-10.754a1.5 1.5 0 0 1 2.6 1.497c-.719 1.248-1.978 4.398 1.836 6.684a1.5 1.5 0 0 1-.772 2.786zM22.768 43.452a1.5 1.5 0 0 1-.197-2.987l3.584-.478a1.5 1.5 0 1 1 .396 2.974l-3.583.478a1.543 1.543 0 0 1-.2.013zM27.482 36.565c-.272 0-.546-.074-.794-.228l-2.996-1.873a1.499 1.499 0 1 1 1.59-2.544l2.996 1.873a1.499 1.499 0 0 1-.796 2.772zM32.259 32.245a1.5 1.5 0 0 1-1.38-.91l-1.15-2.688a1.5 1.5 0 1 1 2.758-1.18l1.15 2.688a1.5 1.5 0 0 1-1.378 2.09z" fill="#F8F3FF" opacity="1"/>
        <Path d="M22.549 54.498c-1.171 0-2.35-.302-3.414-.922-6.609-3.826-10.872-8.09-14.713-14.714-1.536-2.66-1.11-6.016 1.037-8.163l13.29-13.29a6.837 6.837 0 0 1 6.047-1.895l10.48 1.89a1.5 1.5 0 0 1-.533 2.952l-10.48-1.89a3.843 3.843 0 0 0-3.393 1.065L7.58 32.82c-1.187 1.187-1.419 3.054-.561 4.539 3.601 6.212 7.42 10.032 13.622 13.621 1.48.862 3.35.63 4.551-.565l7.456-7.466a1.5 1.5 0 1 1 2.123 2.12l-7.46 7.47a6.75 6.75 0 0 1-4.762 1.958zM40.202 30.5a1.5 1.5 0 0 1-1.474-1.234l-1.084-6.01a1.501 1.501 0 0 1 2.953-.532l1.084 6.01a1.501 1.501 0 0 1-1.479 1.766z" fill="#F8F3FF" opacity="1"/>
        <Path d="M39.116 24.493c-.384 0-.767-.146-1.06-.44l-4.109-4.108a1.5 1.5 0 0 1 0-2.12l11.069-11.07.643-1.715a2.37 2.37 0 0 1 3.897-.844l4.249 4.248c.572.573.812 1.387.641 2.179a2.364 2.364 0 0 1-1.484 1.718l-1.716.644-11.07 11.069c-.292.293-.676.44-1.06.44zm-1.987-5.608 1.987 1.987 10.238-10.238c.152-.152.333-.269.535-.344l1.105-.415-2.868-2.869-.415 1.106a1.5 1.5 0 0 1-.344.534zm9.178-11.3h.01zm2.16-1.492z" fill="#F8F3FF" opacity="1"/>
        <Path d="M43.626 19.984c-.384 0-.768-.146-1.06-.44l-4.11-4.11a1.5 1.5 0 1 1 2.12-2.12l4.11 4.11a1.5 1.5 0 0 1-1.06 2.56zM48.026 15.585c-.383 0-.767-.147-1.06-.44l-4.11-4.11a1.5 1.5 0 1 1 2.12-2.121l4.11 4.11a1.5 1.5 0 0 1-1.06 2.561z" fill="#F8F3FF" opacity="1"/>
      </G>
      <Path fill="#C89AFF" d="M46.255 32.01c-7.855 0-14.244 6.39-14.244 14.245S38.4 60.5 46.255 60.5 60.5 54.11 60.5 46.255s-6.39-14.244-14.245-14.244zm-5.409 17.054a2 2 0 1 1-3.912-.831 2 2 0 0 1 3.912.831zm1.066-7.085a2 2 0 1 1-.418-3.978 2 2 0 0 1 .418 3.978zm6.075 13.02a2 2 0 1 1-3.464-2 2 2 0 0 1 3.464 2zm0-7.744a2 2 0 1 1-3.464-2 2 2 0 0 1 3.464 2zm.993-6.452a2 2 0 1 1 3.654-1.627 2 2 0 0 1-3.654 1.627zm5.979 9.332a2 2 0 1 1-2.677-2.973 2 2 0 0 1 2.677 2.973z" opacity="1"/>
    </G>
  </Svg>
);

const TennisIcon = () => <TennisIconSvg width={70} height={70} />;

const PadelIcon = () => <PadelIconSvg width={70} height={70} />;

export const QuestionnaireIntroduction: React.FC<QuestionnaireIntroductionProps> = ({
  sport,
  firstName,
  onStart,
  onSkip,
  skipButtonText = 'Skip for now',
}) => {
  const sportName = sport === 'pickleball' ? 'pickleball' : 
                   sport === 'tennis' ? 'tennis' : 'padel';

  const getSportIcon = () => {
    switch (sport) {
      case 'pickleball':
        return <PickleballIcon />;
      case 'tennis':
        return <TennisIcon />;
      case 'padel':
        return <PadelIcon />;
      default:
        return <PickleballIcon />;
    }
  };

  return (
    <>
      {/* Sport branding */}
      <View style={styles.sportBranding}>
        <View style={styles.sportIconContainer}>
          {getSportIcon()}
        </View>
        <Text style={[
          styles.sportText,
          sport === 'tennis' && styles.tennisSportText,
          sport === 'padel' && styles.padelSportText
        ]}>
          {sportName}
        </Text>
      </View>
      
      {/* Introduction container */}
      <View style={styles.introductionContainer}>
        <View style={styles.whiteCard}>
          {/* Greeting at top-left of white card */}
          <View style={styles.greetingContainer}>
            <Text style={[
              styles.greetingText,
              sport === 'tennis' && styles.tennisGreetingText,
              sport === 'padel' && styles.padelGreetingText
            ]}>
              Hi, {firstName}
            </Text>
          </View>
          <Text style={styles.introTitle}>It&apos;s time to set your level.</Text>
          <View style={styles.introPoints}>
            <View style={styles.introPointContainer}>
              <View style={[
                styles.arrowCircle,
                sport === 'tennis' && styles.tennisArrowCircle,
                sport === 'padel' && styles.padelArrowCircle
              ]}>
                <Text style={[
                  styles.arrowText,
                  sport === 'tennis' && styles.tennisArrowText,
                  sport === 'padel' && styles.padelArrowText
                ]}>→</Text>
              </View>
              <Text style={styles.introPoint}>5 mins or less</Text>
            </View>
            <View style={styles.introPointContainer}>
              <View style={[
                styles.arrowCircle,
                sport === 'tennis' && styles.tennisArrowCircle,
                sport === 'padel' && styles.padelArrowCircle
              ]}>
                <Text style={[
                  styles.arrowText,
                  sport === 'tennis' && styles.tennisArrowText,
                  sport === 'padel' && styles.padelArrowText
                ]}>→</Text>
              </View>
              <Text style={styles.introPoint}>About your play style & experience</Text>
            </View>
            {sport !== 'tennis' && (
              <View style={styles.introPointContainer}>
                <View style={[
                  styles.arrowCircle,
                  sport === 'padel' && styles.padelArrowCircle
                ]}>
                  <Text style={[
                    styles.arrowText,
                    sport === 'padel' && styles.padelArrowText
                  ]}>→</Text>
                </View>
                <Text style={styles.introPoint}>
                  Already have a DUPR rating? We&apos;ll sync it
                </Text>
              </View>
            )}
            <View style={styles.introPointContainer}>
              <View style={[
                styles.arrowCircle,
                sport === 'tennis' && styles.tennisArrowCircle,
                sport === 'padel' && styles.padelArrowCircle
              ]}>
                <Text style={[
                  styles.arrowText,
                  sport === 'tennis' && styles.tennisArrowText,
                  sport === 'padel' && styles.padelArrowText
                ]}>→</Text>
              </View>
              <Text style={styles.introPoint}>Not sure? Skip and come back later</Text>
            </View>
          </View>
          <Text style={styles.introDescription}>
            You&apos;ll start with a provisional DMR based on your experience and skill level to match you with the most balanced competition in the right division.
          </Text>
          <View style={styles.introButtonContainer}>
            <TouchableOpacity
              style={[
                styles.startButton,
                sport === 'tennis' && styles.tennisStartButton,
                sport === 'padel' && styles.padelStartButton
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onStart();
              }}
            >
              <Text style={styles.startButtonText}>Start Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.answerLaterButton,
                sport === 'tennis' && styles.tennisAnswerLaterButton,
                sport === 'padel' && styles.padelAnswerLaterButton
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSkip();
              }}
            >
              <Text style={[
                styles.answerLaterButtonText,
                sport === 'tennis' && styles.tennisAnswerLaterButtonText,
                sport === 'padel' && styles.padelAnswerLaterButtonText
              ]}>{skipButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sportBranding: {
    position: 'absolute',
    right: 20,
    bottom: 610,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  sportIconContainer: {
    marginBottom: 8,
  },
  sportText: {
    fontSize: 48,
    fontWeight: '500',
    color: '#CA9BFF',
    fontFamily: 'Poppins',
    textAlign: 'right',
  },
  tennisSportText: {
    color: '#D7FFA9',
  },
  padelSportText: {
    color: '#9BD0FF',
  },
  greetingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A04DFE',
    fontFamily: 'Poppins',
  },
  tennisGreetingText: {
    color: '#A2E047',
  },
  padelGreetingText: {
    color: '#4DABFE',
  },
  introductionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 20,
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  introTitle: {
    fontSize: 30,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 24,
    fontFamily: 'Inter',
    textAlign: 'left',
  },
  introPoints: {
    marginBottom: 20,
  },
  introPointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(160, 77, 254, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tennisArrowCircle: {
    backgroundColor: 'rgba(162, 224, 71, 0.15)',
  },
  padelArrowCircle: {
    backgroundColor: 'rgba(77, 171, 254, 0.15)',
  },
  arrowText: {
    fontSize: 17,
    color: '#A04DFE',
    fontWeight: '600',
  },
  tennisArrowText: {
    color: '#A2E047',
  },
  padelArrowText: {
    color: '#4DABFE',
  },
  introDescription: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 21,
    marginBottom: 2,
    fontFamily: 'Poppins',
  },
  introPoint: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8C8C8C',
    lineHeight: 21,
    fontFamily: 'Roboto',
    flex: 1,
  },
  introButtonContainer: {
    gap: 14,
    marginTop: 28,
  },
  startButton: {
    height: 50,
    backgroundColor: '#A04DFE',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A04DFE',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tennisStartButton: {
    backgroundColor: '#A2E047',
    shadowColor: '#A2E047',
  },
  padelStartButton: {
    backgroundColor: '#4DABFE',
    shadowColor: '#4DABFE',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  answerLaterButton: {
    height: 50,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#A04DFE',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tennisAnswerLaterButton: {
    borderColor: '#A2E047',
  },
  padelAnswerLaterButton: {
    borderColor: '#4DABFE',
  },
  answerLaterButtonText: {
    color: '#777777',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  tennisAnswerLaterButtonText: {
    color: '#A2E047',
  },
  padelAnswerLaterButtonText: {
    color: '#4DABFE',
  },
});

