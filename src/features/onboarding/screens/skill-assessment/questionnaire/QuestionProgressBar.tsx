import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
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

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        Question {current}/{total}
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
};
