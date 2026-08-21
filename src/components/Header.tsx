import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, styles } from '../theme/styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Header shows the app title banner at the top of the main browsing flow.
 */
export const Header: React.FC = () => (
  <LinearGradient
    colors={[COLORS.primary, '#c2410c']} 
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.headerContainer}      
  >
    <View style={styles.headerTitleRow}>
      <Text style={styles.headerTitle}>Kitchen Buddy</Text>
      <MaterialCommunityIcons name="chef-hat" size={24} color={COLORS.white} />
    </View>
    <Text style={styles.headerSubtitle}>"Your fridge, sorted."</Text>
  </LinearGradient>
);
