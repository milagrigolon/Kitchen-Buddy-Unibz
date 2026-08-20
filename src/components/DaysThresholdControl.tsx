import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../theme/styles';

interface DaysThresholdControlProps {
  value: number;
  onChange: (days: number) => void;
}

const DAY_OPTIONS = [3, 7, 14];

/**
 * DaysThresholdControl chooses how soon the user wants to see expiring ingredient entries.
 */
export const DaysThresholdControl: React.FC<DaysThresholdControlProps> = ({ value, onChange }) => (
  <View style={styles.controlContainer}>
    <Text style={styles.controlLabel}>Ingredients expiring within</Text>
    <View style={styles.buttonGroup}>
      {DAY_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.specialButton, value === option && styles.specialButtonActive]}
          onPress={() => onChange(option)}
        >
          <Text style={[styles.specialButtonText, value === option && styles.specialButtonTextActive]}>
            {option} days
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
