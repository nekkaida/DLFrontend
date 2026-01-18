// src/features/feed/components/ScorecardCaptureWrapper.tsx

import React, { forwardRef, useState, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { MatchResultCard, type CardBackgroundStyle } from '@/features/standings/components';
import { SportColors, MatchResult } from '@/features/standings/types';

interface ScorecardCaptureWrapperProps {
  match: MatchResult;
  sportColors: SportColors;
  isPickleball: boolean;
  cardWidth: number;
}

export interface ScorecardCaptureRef {
  viewRef: View | null;
  setBackgroundStyle: (style: CardBackgroundStyle) => void;
}

/**
 * Wrapper component for MatchResultCard that allows dynamic background style changes
 * for different capture scenarios (white vs transparent backgrounds)
 */
export const ScorecardCaptureWrapper = forwardRef<ScorecardCaptureRef, ScorecardCaptureWrapperProps>(
  ({ match, sportColors, isPickleball, cardWidth }, ref) => {
    const [backgroundStyle, setBackgroundStyle] = useState<CardBackgroundStyle>('white');
    const viewRef = useRef<View>(null);

    // Expose both the view ref and the style setter to parent
    useImperativeHandle(ref, () => ({
      get viewRef() {
        return viewRef.current;
      },
      setBackgroundStyle,
    }));

    return (
      <View ref={viewRef} collapsable={false}>
        <MatchResultCard
          match={match}
          index={0}
          totalResults={1}
          sportColors={sportColors}
          isPickleball={isPickleball}
          cardWidth={cardWidth}
          cardGap={0}
          expandedComments={new Set()}
          onToggleComments={() => {}}
          backgroundStyle={backgroundStyle}
        />
      </View>
    );
  }
);

ScorecardCaptureWrapper.displayName = 'ScorecardCaptureWrapper';
