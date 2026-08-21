import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shop } from '../types';
import { COLORS, styles } from '../theme/styles';

interface ShopLocationBannerProps {
  nearbyShop: Shop | null;
}

export const ShopLocationBanner: React.FC<ShopLocationBannerProps> = ({
  nearbyShop,
}) => {
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