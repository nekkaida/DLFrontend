import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import Svg, {
  Line,
  Circle,
  Polyline,
  G,
  Text as SvgText,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { theme } from '@core/theme/theme';
import type { EloProgressGraphProps } from '../types';

const { width } = Dimensions.get('window');

export const EloProgressGraph: React.FC<EloProgressGraphProps> = ({ data, onPointPress }) => {
  const graphWidth = width - 80; // Account for padding
  const graphHeight = 200; // Increased from 150 to 200
  const padding = { top: 20, bottom: 30, left: 30, right: 30 };
  
  // Calculate graph dimensions
  const chartWidth = graphWidth - padding.left - padding.right;
  const chartHeight = graphHeight - padding.top - padding.bottom;
  
  // Find min and max ratings for scaling
  const ratings = data.map(d => d.rating).filter(r => !isNaN(r) && typeof r === 'number');
  
  // Safety checks to prevent NaN issues
  let minRating = 1000; // Default minimum
  let maxRating = 2000; // Default maximum
  
  if (ratings.length > 0) {
    const actualMin = Math.min(...ratings);
    const actualMax = Math.max(...ratings);
    
    // For single data point, create a reasonable range around it
    if (ratings.length === 1) {
      const singleRating = actualMin;
      const padding = Math.max(200, singleRating * 0.15); // 15% padding or minimum 200 points
      minRating = Math.max(500, singleRating - padding);
      maxRating = Math.min(5000, singleRating + padding);
    } else {
      // For multiple points, create a reasonable range around the actual values
      const range = actualMax - actualMin;
      const padding = Math.max(100, range * 0.1); // At least 100 points padding or 10% of range
      
      minRating = Math.max(500, actualMin - padding);
      maxRating = Math.min(5000, actualMax + padding);
    }
    
    // Additional safety check
    if (isNaN(minRating)) minRating = 1000;
    if (isNaN(maxRating)) maxRating = 2000;
  }
  
  // Scale functions with safety checks
  const xScale = (index: number) => {
    if (data.length <= 1) return chartWidth / 2 + padding.left; // Center single point
    return (index / (data.length - 1)) * chartWidth + padding.left;
  };
  
  const yScale = (rating: number) => {
    if (isNaN(rating)) rating = 1400; // Default rating
    const range = maxRating - minRating;
    if (range === 0) return chartHeight / 2 + padding.top; // Center if no range
    return chartHeight - ((rating - minRating) / range) * chartHeight + padding.top;
  };
  
  // Create points array for polyline
  const points = data
    .map((point, index) => `${xScale(index)},${yScale(point.rating)}`)
    .join(' ');
  
  return (
    <View style={styles.graphContainer}>
      <View style={{ position: 'relative' }}>
      <Svg width={graphWidth} height={graphHeight} style={styles.graph}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding.top + (chartHeight / 4) * i;
          const rating = maxRating - ((maxRating - minRating) / 4) * i;
          return (
            <G key={`grid-${i}`}>
              <Line
                x1={padding.left}
                y1={y}
                x2={graphWidth - padding.right}
                y2={y}
                stroke={theme.colors.neutral.gray[200]}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <SvgText
                x={padding.left - 5}
                y={y + 4}
                fontSize="10"
                fill={theme.colors.neutral.gray[500]}
                textAnchor="end"
              >
                {Math.round(rating) >= 1000 ? `${Math.round(rating / 1000)}k` : Math.round(rating)}
              </SvgText>
            </G>
          );
        })}
        
        {/* Line gradient definition */}
        <Defs>
          <SvgLinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FE9F4D" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#FFA366" stopOpacity="0.8" />
          </SvgLinearGradient>
        </Defs>
        
        {/* The line */}
        <Polyline
          points={points}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((point, index) => (
          <G key={`point-${index}`}>
            <Circle
              cx={xScale(index)}
              cy={yScale(point.rating)}
              r="8"
              fill="#FE9F4D"
              opacity="0.2"
            />
            <Circle
              cx={xScale(index)}
              cy={yScale(point.rating)}
              r="5"
              fill="#FE9F4D"
            />
          </G>
        ))}
        
        {/* Month labels */}
        {data.filter((_, i) => i % 2 === 0).map((point, index) => {
          // Handle special cases for labels
          let labelText;
          if (point.date === 'No matches yet') {
            labelText = 'No Data';
          } else if (point.date === 'Current Rating') {
            labelText = 'Current';
          } else {
            labelText = point.date.split(' ')[0];
          }
          
          return (
            <SvgText
              key={`label-${index}`}
              x={xScale(index * 2)}
              y={graphHeight - 5}
              fontSize="9"
              fill={theme.colors.neutral.gray[500]}
              textAnchor="middle"
            >
              {labelText}
            </SvgText>
          );
        })}
      </Svg>
      
      {/* Clickable overlays for data points */}
      {data.map((point, index) => (
        <Pressable
          key={`press-${index}`}
          style={{
            position: 'absolute',
            left: xScale(index) - 15,
            top: yScale(point.rating) - 15,
            width: 30,
            height: 30,
            borderRadius: 15,
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPointPress(point);
          }}
        />
      ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  graphContainer: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    width: '100%',
  },
  graph: {
    backgroundColor: 'transparent',
  },
});