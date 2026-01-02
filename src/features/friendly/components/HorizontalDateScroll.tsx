import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { format, addDays, isSameDay, isToday, startOfDay } from 'date-fns';
import * as Haptics from 'expo-haptics';

interface HorizontalDateScrollProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  sportColor: string;
}

const DATE_BOX_WIDTH = 56;
const DATE_BOX_GAP = 12;

export const HorizontalDateScroll: React.FC<HorizontalDateScrollProps> = ({
  selectedDate,
  onDateSelect,
  sportColor,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  // Generate 14 days starting from today
  const dates = useMemo(() => {
    const result: Date[] = [];
    const today = startOfDay(new Date());

    for (let i = 0; i < 14; i++) {
      result.push(addDays(today, i));
    }
    return result;
  }, []);

  // Scroll to selected date on mount or when selection changes
  useEffect(() => {
    if (selectedDate && scrollViewRef.current) {
      const selectedIndex = dates.findIndex(date => isSameDay(date, selectedDate));
      if (selectedIndex > 0) {
        const scrollPosition = selectedIndex * (DATE_BOX_WIDTH + DATE_BOX_GAP);
        scrollViewRef.current.scrollTo({ x: scrollPosition, animated: true });
      }
    }
  }, [selectedDate, dates]);

  const handleDatePress = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Toggle selection: if same date is pressed, deselect
    if (selectedDate && isSameDay(date, selectedDate)) {
      onDateSelect(null);
    } else {
      onDateSelect(date);
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      decelerationRate="fast"
    >
      {dates.map((date, index) => {
        const isSelected = selectedDate && isSameDay(date, selectedDate);
        const isTodayDate = isToday(date);

        return (
          <TouchableOpacity
            key={index}
            onPress={() => handleDatePress(date)}
            activeOpacity={0.7}
            accessibilityLabel={`${format(date, 'EEEE')}, ${format(date, 'MMMM d')}${isTodayDate ? ', today' : ''}${isSelected ? ', selected' : ''}`}
          >
            <View
              style={[
                styles.dateBox,
                isTodayDate && !isSelected && { borderColor: sportColor, borderWidth: 2 },
                isSelected && { backgroundColor: sportColor, borderColor: sportColor },
              ]}
            >
              <Text
                style={[
                  styles.dayName,
                  isTodayDate && !isSelected && { color: sportColor },
                  isSelected && styles.selectedText,
                ]}
              >
                {format(date, 'EEE')}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isTodayDate && !isSelected && { color: sportColor },
                  isSelected && styles.selectedText,
                ]}
              >
                {format(date, 'd')}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingRight: 16,
    gap: DATE_BOX_GAP,
  },
  dateBox: {
    width: DATE_BOX_WIDTH,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  selectedText: {
    color: '#FFFFFF',
  },
});

export default HorizontalDateScroll;
