import React from 'react';
import { View, Text } from 'react-native';
import { Shop } from '../types';
import { styles } from '../theme/styles';

interface ShopLocationBannerProps {
  nearbyShop: Shop | null;
}

/**
 * ShopLocationBanner communicates whether the device is near a known shop.
 */
export const ShopLocationBanner: React.FC<ShopLocationBannerProps> = ({ nearbyShop }) => (
  <View style={styles.controlContainer}>
    <Text style={styles.controlLabel}>
      {nearbyShop ? `Nearby store: ${nearbyShop.name} (${nearbyShop.type})` : 'No nearby store detected'}
    </Text>
  </View>
);
