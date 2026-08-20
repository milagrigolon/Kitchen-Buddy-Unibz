import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shop } from '../types';
import { COLORS, styles } from '../theme/styles';
import { nearbyStoreSuggestions } from '../utils/helpers';

interface ShopLocationBannerProps {
  nearbyShop: Shop | null;
}

/**
 * ShopLocationBanner component displays information about the nearby shop, 
 * if any, and provides suggestions for other nearby stores.
 */
export const ShopLocationBanner: React.FC<ShopLocationBannerProps> = ({
  nearbyShop,
}) => {
  const suggestions = nearbyStoreSuggestions(nearbyShop);
  const suggestionText = suggestions.length > 0
    ? ` Suggestions: ${suggestions.join(', ')}.`
    : '';

  const message = nearbyShop
    ? `Nearby store: ${nearbyShop.name} | ${nearbyShop.type}`
    : 'No nearby store detected';

  return (
    <View style={styles.shopContainer}>
      <Ionicons name="location" size={18} color={COLORS.white} />

      <Text style={styles.shopLabel}>{message}</Text>
    </View>
  );
};
