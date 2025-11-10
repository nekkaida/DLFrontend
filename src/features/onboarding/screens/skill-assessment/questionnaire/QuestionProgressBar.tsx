import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { styles } from './QuestionProgressBar.styles';

interface QuestionProgressBarProps {
  current: number;
  total: number;
}

export const QuestionProgressBar: React.FC<QuestionProgressBarProps> = ({
  current,
  total,
}) => {
  const percentage = useMemo(() => {
    return (current / total) * 100;
  }, [current, total]);

  const animatedWidth = useRef(new Animated.Value(percentage)).current;
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      animatedWidth.setValue(percentage);
      isInitialMount.current = false;
    } else {
      Animated.timing(animatedWidth, {
        toValue: percentage,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [percentage, animatedWidth]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        Question {current}/{total}
      </Text>
      <View style={styles.progressBar}>
        <Animated.View
          style={[styles.progressFill, { width: widthInterpolation }]}
        />
      </View>
    </View>
  );
};
