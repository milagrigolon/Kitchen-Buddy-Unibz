import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../theme/styles';

interface EstimateDatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const QUICK_ESTIMATES = [
  { label: '+1 week', value: '1 week' },
  { label: '+10 days', value: '10 days' },
  { label: '+1 month', value: '1 month' },
];

/**
 * EstimateDatePicker is a small form control that lets the user either type an
 * exact date or select a quick estimate shortcut.
 */
export const EstimateDatePicker: React.FC<EstimateDatePickerProps> = ({ value, onChange }) => (
  <View>
    <Text style={styles.label}>Expiration date (e.g. 1 week, 10 days, 1 month)</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder="DD/MM/YYYY"
    />
    <View style={styles.buttonGroup}>
      {QUICK_ESTIMATES.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={styles.dayButton}
          onPress={() => onChange(option.value)}
        >
          <Text style={styles.dayButtonText}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
