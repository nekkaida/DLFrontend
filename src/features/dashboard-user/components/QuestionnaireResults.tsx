import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BackgroundGradient } from '@/src/features/onboarding/components';
import PickleballCheckIcon from '@/assets/icons/pickleball-check.svg';
import PickleballBgIcon from '@/assets/icons/pickleball-bg.svg';
import TennisCheckIcon from '@/assets/icons/tennis-check.svg';
import TennisBgIcon from '@/assets/icons/tennis-bg.svg';
import PadelCheckIcon from '@/assets/icons/padel-check.svg';
import PadelBgIcon from '@/assets/icons/padel-bg.svg';
import * as Haptics from 'expo-haptics';

interface QuestionnaireResultsProps {
  sport: 'pickleball' | 'tennis' | 'padel';
  firstName: string;
  results: {
    rating: number | { singles_rating: number; doubles_rating: number } | { rating: number };
    feedback?: string;
  };
  onContinue: () => void;
}

// Success checkmark icon - sport-specific
const CheckmarkIcon = ({ sport }: { sport: string }) => {
  switch (sport) {
    case 'pickleball':
      return <PickleballCheckIcon width={32} height={32} />;
    case 'tennis':
      return <TennisCheckIcon width={32} height={32} />;
    case 'padel':
      return <PadelCheckIcon width={32} height={32} />;
    default:
      return <PickleballCheckIcon width={32} height={32} />;
  }
};

// Background SVG icon - sport-specific
const BackgroundSvgIcon = ({ sport }: { sport: string }) => {
  switch (sport) {
    case 'pickleball':
      return <PickleballBgIcon width={231} height={129} />;
    case 'tennis':
      return <TennisBgIcon width={231} height={72} />;
    case 'padel':
      return <PadelBgIcon width={231} height={101} />;
    default:
      return <PickleballBgIcon width={231} height={129} />;
  }
};

// White arrow icon for continue button
const WhiteArrowIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const QuestionnaireResults: React.FC<QuestionnaireResultsProps> = ({
  sport,
  firstName,
  results,
  onContinue,
}) => {
  const getSportTitle = () => {
    return sport ? sport.charAt(0).toUpperCase() + sport.slice(1) : '';
  };

  return (
    <SafeAreaView style={styles.container}>
      <BackgroundGradient sport={sport} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={[
            styles.logo, 
            sport === 'pickleball' && styles.pickleballLogo,
            sport === 'tennis' && styles.tennisLogo,
            sport === 'padel' && styles.padelLogo
          ]}>
            {sport === 'pickleball' ? 'pickleball' : 
             sport === 'tennis' ? 'tennis' : 
             sport === 'padel' ? 'padel' : 'DEUCE'}
          </Text>
        </View>

        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <CheckmarkIcon sport={sport} />
        </View>

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            <Text style={styles.titleWhite}>You're All Set, </Text>
            <Text style={styles.titleOrange}>{firstName}!</Text>
          </Text>
          <Text style={styles.subtitle}>Here&apos;s your initial rating for {getSportTitle()}.</Text>
        </View>

        {/* Results Card */}
        <View style={styles.resultsCard}>
          {/* White Top Section */}
          <View style={styles.cardTopSection}>
            {/* Background SVG */}
            <View style={styles.backgroundSvgContainer}>
              <BackgroundSvgIcon sport={sport} />
            </View>
            
            {/* Logo */}
            <View style={styles.cardLogoContainer}>
              <Svg width="48" height="48" viewBox="0 0 146.46 154.58" fill="none">
                <Path d="m146.45,76.67c-.04,1.52-.19,3.06-.46,4.6-4.06,23.39-34.72,48.43-102.74,73.18-1.72.62-3.28-.94-2.88-2.72,10.78-48.65,9.38-119.74-.72-148.91-.58-1.65,1.11-3.24,2.79-2.71,62.42,19.74,104.79,46.66,104.01,76.56Z" fill="#44a7de"/>
                <Path d="m45.08,76.67v4.6h1.11v-4.6h-1.11Z" fill="none" stroke="#ed2124" strokeMiterlimit="10"/>
                <Path d="m48.94,17.75c-1.51-.71-3.04-1.41-4.6-2.1C31.91,10.08,17.98,4.89,2.87.11,1.2-.42-.39,1.13.08,2.82c14.06,50.94,15.69,100.47.72,148.91-.54,1.74,1.17,3.34,2.88,2.72,15.43-5.62,28.95-11.25,40.66-16.88,1.57-.74,3.1-1.5,4.6-2.25,36.77-18.4,54.47-36.68,57.49-54.05.27-1.54.42-3.08.46-4.6.57-21.76-21.71-41.94-57.95-58.92Zm0,84.23c-.89.37-1.81.73-2.75,1.1v-21.81h-1.11v-4.6h1.11v-22.5c.94.45,1.85.9,2.75,1.35,13.99,6.99,23.28,14.03,25.46,21.15.47,1.53.62,3.06.4,4.6-.94,6.82-8.85,13.73-25.86,20.71Z" fill="#195e9a"/>
                <Path d="m74.4,76.67c.47,1.53.62,3.06.4,4.6h-29.72v-4.6h29.32Z" fill="#fff"/>
                <Path d="m146.45,76.67c-.04,1.52-.19,3.06-.46,4.6h-39.56c.27-1.54.42-3.08.46-4.6h39.56Z" fill="#fff"/>
                <Path d="m48.94,17.75v117.57c-1.5.75-3.03,1.51-4.6,2.25V15.65c1.56.69,3.09,1.39,4.6,2.1Z" fill="#fff"/>
              </Svg>
            </View>
            
            {/* DMR Title */}
            <Text style={styles.dmrTitle}>
              <Text style={styles.dmrTitleBrand}>DEUCE</Text> Match Rating (DMR)
            </Text>
            {/* Main Rating Display */}
            <View style={styles.ratingContainer}>
              {sport === 'pickleball' && results.rating && typeof results.rating === 'object' && 'singles_rating' in results.rating ? (
                <>
                  <View style={styles.ratingSection}>
                    <Text style={styles.ratingLabel}>Singles</Text>
                    <Text style={styles.ratingValue}>{(results.rating as any).singles_rating}</Text>
                  </View>
                  <View style={styles.ratingDivider} />
                  <View style={styles.ratingSection}>
                    <Text style={styles.ratingLabel}>Doubles</Text>
                    <Text style={styles.ratingValue}>{(results.rating as any).doubles_rating}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.ratingSection}>
                  <Text style={styles.ratingLabel}>Rating</Text>
                  <Text style={styles.ratingValue}>
                    {typeof results.rating === 'number' ? results.rating : 
                     (results.rating && typeof results.rating === 'object' && 'rating' in results.rating) ? (results.rating as any).rating : 'N/A'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom Section */}
          <LinearGradient
            colors={sport === 'pickleball' ? ['#A04DFE', '#602E98'] : 
                   sport === 'tennis' ? ['#A2E047', '#587A27'] : 
                   ['#83C4FE', '#2196F3']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.cardBottomSection,
              sport === 'tennis' && styles.tennisCardBottomSection,
              sport === 'padel' && styles.padelCardBottomSection
            ]}
          >
            <Text style={styles.instructionalText}>
              Think of this DMR as your kick-off point that will adjust as you play.
            </Text>
            <Text style={styles.instructionalTextFun}>
              Now hit the court and have fun!
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onContinue();
          }}
        >
          <LinearGradient
            colors={['#FF7903', '#FEA04D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <WhiteArrowIcon />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#FE9F4D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  pickleballLogo: {
    color: '#CA9BFF',
    fontSize: 32,
    fontWeight: '500',
    fontFamily: 'Poppins',
    textTransform: 'lowercase',
    letterSpacing: 1,
  },
  tennisLogo: {
    color: '#D7FFA9',
    fontSize: 32,
    fontWeight: '500',
    fontFamily: 'Poppins',
    textTransform: 'lowercase',
    letterSpacing: 1,
  },
  padelLogo: {
    color: '#9BD0FF',
    fontSize: 32,
    fontWeight: '500',
    fontFamily: 'Poppins',
    textTransform: 'lowercase',
    letterSpacing: 1,
  },
  successIconContainer: {
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 40,
  },
  headerContainer: {
    paddingHorizontal: 37,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 36,
    marginBottom: 8,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  titleWhite: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 36,
    fontFamily: 'Inter',
    letterSpacing: 1,
  },
  titleOrange: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FEA04D',
    lineHeight: 36,
    fontFamily: 'Inter',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 20,
    letterSpacing: -0.01,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 5,
  },
  resultsCard: {
    marginHorizontal: 37,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#E4E5E7',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.24,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardTopSection: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    alignItems: 'center',
  },
  cardBottomSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  tennisCardBottomSection: {
    // Background color handled by LinearGradient
  },
  padelCardBottomSection: {
    // Background color handled by LinearGradient
  },
  backgroundSvgContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLogoContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  dmrTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FEA04D',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  dmrTitleBrand: {
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#FEA04D',
    fontFamily: 'Inter',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 24,
  },
  ratingSection: {
    alignItems: 'center',
    flex: 1,
  },
  ratingDivider: {
    width: 2,
    height: 80,
    backgroundColor: '#777777',
    marginHorizontal: 20,
    opacity: 0.2,
  },
  ratingLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: '#777777',
    marginBottom: 4,
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
  ratingValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FEA04D',
    fontFamily: 'Inter',
  },
  instructionalText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 12,
  },
  instructionalTextFun: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'Inter',
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 80,
    right: 40,
  },
  continueButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    shadowColor: '#E4E5E7',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.24,
    shadowRadius: 6,
    elevation: 5,
  },
  gradientButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

