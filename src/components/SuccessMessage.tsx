import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, styles } from '../theme/styles';

interface SuccessMessageProps {
  title: string;
  description: string;
  onContinue: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title,
  description,
  onContinue,
}) => {
  return (
    <View style={styles.addScreenSuccessContainer}>
      <View style={styles.addScreenSuccessIcon}>
        <MaterialCommunityIcons name="check" size={52} color={COLORS.primary} />
      </View>

      <Text style={styles.addScreenSuccessTitle}>{title}</Text>
      <Text style={styles.addScreenSuccessDescription}>{description}</Text>

      <TouchableOpacity style={styles.addScreenContinueButton} onPress={onContinue}>
        <Text style={styles.addScreenContinueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};