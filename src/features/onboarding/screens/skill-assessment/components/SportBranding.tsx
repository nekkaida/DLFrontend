import React from 'react';
import { View, Text } from 'react-native';
import { SportIcon } from './SportIcon';
import { styles } from './SportBranding.styles';

interface SportBrandingProps {
  sport: 'pickleball' | 'tennis' | 'padel';
}

export const SportBranding: React.FC<SportBrandingProps> = ({ sport }) => {
  const sportName = sport === 'pickleball' ? 'pickleball' :
                   sport === 'tennis' ? 'tennis' : 'padel';

  return (
    <View style={styles.sportBranding}>
      <View style={styles.sportIconContainer}>
        <SportIcon sport={sport} />
      </View>
      <Text style={[
        styles.sportText,
        sport === 'tennis' && styles.tennisSportText,
        sport === 'padel' && styles.padelSportText
      ]}>
        {sportName}
      </Text>
    </View>
  );
};
