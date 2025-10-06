import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Alert,
  ScrollView,
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
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text style={styles.instructionText}>Select an answer</Text>
        <Text style={styles.questionText}>{question}</Text>
        
        {contextText && (
          <Text style={styles.contextText}>{contextText}</Text>
        )}
        
        <View style={styles.contentContainer}>
          {children}
        </View>
      </ScrollView>
      
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
    borderRadius: 30,
    padding: 0,
    marginHorizontal: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 600,
    maxHeight: '85%',
    maxWidth: '100%',
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 36,
    paddingTop: 36,
  },
  scrollContent: {
    paddingBottom: 20,
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
  contextText: {
    fontSize: 16,
    color: '#6C7278',
    marginBottom: 20,
    fontFamily: 'Roboto',
    lineHeight: 22,
    textAlign: 'left',
    fontStyle: 'italic',
  },
  contentContainer: {
    gap: 16,
    marginBottom: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
});

export default QuestionContainer;