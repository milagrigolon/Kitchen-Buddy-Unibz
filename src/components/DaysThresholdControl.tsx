import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../theme/styles';

interface DaysThresholdControlProps {
  value: number;
  onChange: (days: number) => void;
}

const DAY_OPTIONS = [3, 7, 14, 30];

/**
 * DaysThresholdControl chooses how soon the user wants to see ingredient entries.
 */
export const DaysThresholdControl: React.FC<DaysThresholdControlProps> = ({ value, onChange }) => (
  <View style={styles.controlContainer}>
    <Text style={styles.controlLabel}>Ingredients expiring within</Text>
    <View style={styles.buttonGroup}>
      {DAY_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.dayButton, value === option && styles.dayButtonActive]}
          onPress={() => onChange(option)}
        >
          <Text style={[styles.dayButtonText, value === option && styles.dayButtonTextActive]}>
            {option} days
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
