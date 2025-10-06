import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Alert,
} from 'react-native';

interface QuestionContainerProps {
  question: string;
  helpText?: string;
  contextText?: string;
  tooltipText?: string;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  navigationButtons?: React.ReactNode;
}

const QuestionContainer: React.FC<QuestionContainerProps> = ({
  question,
  helpText,
  contextText,
  tooltipText,
  children,
  containerStyle,
  navigationButtons,
}) => {
  const showTooltip = () => {
    if (tooltipText) {
      Alert.alert('Info', tooltipText);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.instructionText}>Select an answer</Text>
      <Text style={styles.questionText}>{question}</Text>
      
      <View style={styles.contentContainer}>
        {children}
      </View>
      
      {navigationButtons && (
        <View style={styles.navigationContainer}>
          {navigationButtons}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 36,
    marginHorizontal: 12,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 500,
    maxWidth: '100%',
  },
  instructionText: {
    fontSize: 14,
    color: '#8C8C8C',
    marginBottom: 16,
    fontFamily: 'Roboto',
    textAlign: 'left',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 24,
    fontFamily: 'Roboto',
    lineHeight: 28,
    textAlign: 'left',
  },
  contentContainer: {
    gap: 16,
    flex: 1,
    marginBottom: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});

export default QuestionContainer;