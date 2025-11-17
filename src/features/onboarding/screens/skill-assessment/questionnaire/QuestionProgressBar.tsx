import React, { useMemo, useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
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

  const animatedProgress = useSharedValue(percentage);

  useEffect(() => {
    animatedProgress.value = withTiming(percentage, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const progressStyle = useAnimatedStyle(() => {
    const width = interpolate(
      animatedProgress.value,
      [0, 100],
      [0, 100]
    );
    return {
      width: `${width}%`,
    };
  });

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        Question {current}/{total}
      </Text>
      <View style={styles.progressBar}>
        <Animated.View
          style={[styles.progressFill, progressStyle]}
        />
      </View>
    </View>
  );
};
