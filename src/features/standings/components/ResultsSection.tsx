import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MatchResult, SportColors } from '../types';
import ScoreCard from '@/src/features/feed/components/ScoreCard';
import { ScrollProgressBar } from './ScrollProgressBar';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_HEIGHT = 160;
const CARD_GAP = 12;

// Championship color palette
const COLORS = {
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  cardBackground: 'rgba(30, 35, 45, 0.6)',
  divider: 'rgba(255, 255, 255, 0.06)',
};

interface ResultsSectionProps {
  results: MatchResult[];
  isLoading: boolean;
  sportColors: SportColors;
  isPickleball: boolean;
  expandedComments: Set<string>;
  onToggleComments: (matchId: string) => void;
  onScrollUpdate?: (progress: number, viewWidth: number, contentWidth: number) => void;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  results: resultsProp,
  isLoading,
  sportColors,
  isPickleball,
  expandedComments,
  onToggleComments,
  onScrollUpdate,
}) => {
  const results: MatchResult[] = Array.isArray(resultsProp) ? resultsProp : [];
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  if (isLoading) {
    return (
      <View style={styles.resultsLoadingContainer}>
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="small" color={sportColors.background} />
        </View>
        <Text style={styles.resultsLoadingText}>Loading results...</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.noResultsContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
          style={styles.noResultsIconContainer}
        >
          <Ionicons name="document-text-outline" size={28} color={COLORS.textMuted} />
        </LinearGradient>
        <Text style={styles.noResultsText}>No completed matches yet</Text>
        <Text style={styles.noResultsSubtext}>Results will appear here after matches are played</Text>
      </View>
    );
  }

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollX = contentOffset.x;
    const maxScrollX = contentSize.width - layoutMeasurement.width;
    const progress = maxScrollX > 0 ? scrollX / maxScrollX : 0;
    setScrollProgress(progress);
    onScrollUpdate?.(progress, layoutMeasurement.width, contentSize.width);
  };

  const handleContentSizeChange = (width: number) => {
    setContentWidth(width);
  };

  const handleLayout = (event: any) => {
    const layoutWidth = event.nativeEvent.layout.width;
    setScrollViewWidth(layoutWidth);
  };

  return (
    <View style={styles.resultsSectionNew}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Matches</Text>
        <Text style={styles.matchCount}>{results.length} match{results.length !== 1 ? 'es' : ''}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        contentContainerStyle={styles.resultsScrollContent}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        scrollEventThrottle={16}
      >
        {results.map((match, index) => (
          <View
            key={match.id}
            style={[
              styles.cardWrapper,
              {
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                marginRight: index < results.length - 1 ? CARD_GAP : 0,
              }
            ]}
          >
            <ScoreCard
              match={match as any}
              sportColors={sportColors}
              previewScale={1}
              containerStyle={styles.scoreCard}
            />
          </View>
        ))}
      </ScrollView>

      {/* Progress Slider */}
      {results.length > 1 && (
        <ScrollProgressBar
          progress={scrollProgress}
          viewWidth={scrollViewWidth}
          contentWidth={contentWidth}
          accentColor={sportColors.background}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  resultsSectionNew: {
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  matchCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  resultsScrollContent: {
    paddingVertical: 4,
    paddingLeft: 20,
    paddingRight: 20,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
  },
  scoreCard: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    maxWidth: 300,
    maxHeight: 160,
  },
  resultsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsLoadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  noResultsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  noResultsText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  noResultsSubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});

export default ResultsSection;
