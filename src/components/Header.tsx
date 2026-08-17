import React from 'react';
import { View, Text } from 'react-native';
import { COLORS, styles } from '../theme/styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Header shows the app title banner at the top of the main browsing flow.
 */

export const Header: React.FC = () => (
  <View style={styles.headerContainer}>
    <View style={styles.headerTitleRow}>
      <Text style={styles.headerTitle}>Kitchen Buddy</Text>
      <MaterialCommunityIcons name="chef-hat" size={24} color={COLORS.white} />
    </View>
    <Text style={styles.headerSubtitle}>"Your fridge, sorted."</Text>
  </View>
);
