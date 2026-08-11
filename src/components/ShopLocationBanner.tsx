import React from 'react';
import { View, Text } from 'react-native';
import { Shop } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, styles } from '../theme/styles';

interface ShopLocationBannerProps {
  nearbyShop: Shop | null;
}

/**
 * ShopLocationBanner communicates whether the device is near a known shop.
 */
export const ShopLocationBanner: React.FC<ShopLocationBannerProps> = ({ nearbyShop }) => (
  <View style={styles.shopContainer}>
    <Ionicons name="location" size={18} color={COLORS.white} />
    <Text style={styles.shopLabel}>
      {nearbyShop ? `Nearby store: ${nearbyShop.name} | ${nearbyShop.type}` : 'No nearby store detected'}
    </Text>
  </View>
);
