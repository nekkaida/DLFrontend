import { Ionicons } from '@expo/vector-icons';
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
// import { MatchResultCard } from './MatchResultCard';
import ScoreCard from '@/src/features/feed/components/ScoreCard';
import { ScrollProgressBar } from './ScrollProgressBar';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_HEIGHT = 160;
const CARD_GAP = 12;

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
        <ActivityIndicator size="small" color={sportColors.background} />
        <Text style={styles.resultsLoadingText}>Loading results...</Text>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.noResultsContainer}>
        <Ionicons name="document-text-outline" size={32} color="#D1D5DB" />
        <Text style={styles.noResultsText}>No completed matches yet</Text>
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
            style={{
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              marginRight: index < results.length - 1 ? CARD_GAP : 0,
              // justifyContent: "center",
              overflow: 'hidden',
              borderRadius: 16,
            }}
          >
            <ScoreCard
              match={match as any}
              sportColors={sportColors}
              previewScale={1}
              containerStyle={{ width: '100%', height: '100%', borderRadius: 16, maxWidth: 300, maxHeight: 160 }}
              
            />
          </View>
          // <MatchResultCard
          //   key={match.id}
          //   match={match}
          //   index={index}
          //   totalResults={results.length}
          //   sportColors={sportColors}
          //   isPickleball={isPickleball}
          //   cardWidth={CARD_WIDTH}
          //   cardGap={CARD_GAP}
          //   expandedComments={expandedComments}
          //   onToggleComments={onToggleComments}
          // />
        ))}
      </ScrollView>

      {/* Progress Slider */}
      <ScrollProgressBar
        progress={scrollProgress}
        viewWidth={scrollViewWidth}
        contentWidth={contentWidth}
        accentColor={sportColors.background}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  resultsSectionNew: {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 8,
    paddingBottom: 12,
  },
  resultsScrollContent: {
    paddingVertical: 4,
    paddingLeft: 12,
    paddingRight: 12,
  },
  resultsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  resultsLoadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  noResultsText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});

export default ResultsSection;
