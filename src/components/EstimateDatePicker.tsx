import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { COLORS, styles } from '../theme/styles';

interface EstimateDatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * EstimateDatePicker provides a clean, single text input for entering 
 * exact expiration dates in DD/MM/YYYY format.
 */
export const EstimateDatePicker: React.FC<EstimateDatePickerProps> = ({ value, onChange }) => (
  <View style = {styles.formFieldsDistance}>
    <Text style={styles.label}>Expiration date or estimate (e.g. 3 days, 1 week, 1 month)</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder="DD/MM/YYYY or 1 week"
      placeholderTextColor={COLORS.placeholder}
    />
  </View>
);