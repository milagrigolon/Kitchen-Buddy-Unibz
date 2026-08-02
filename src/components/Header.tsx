import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../theme/styles';

/**
 * Header shows the app title banner at the top of the main browsing flow.
 */
export const Header: React.FC = () => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerTitle}>Kitchen Buddy</Text>
  </View>
);
