import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../theme/styles';
import { Unit } from '../types';

interface QuantityControlProps {
  value: number;
  unit: Unit;
  onChangeQuantity: (next: number) => void;
  onChangeUnit: (next: Unit) => void;
}

const UNIT_OPTIONS: Unit[] = ['pcs', 'kg', 'bottle', 'pack', 'box'];

/**
 * QuantityControl gives the user a compact count selector and unit switcher.
 */
export const QuantityControl: React.FC<QuantityControlProps> = ({
  value,
  unit,
  onChangeQuantity,
  onChangeUnit,
}) => (
  <View>
    <Text style={styles.label}>Quantity</Text>
    <View style={styles.buttonGroup}>
      <TouchableOpacity
        style={styles.dayButton}
        onPress={() => onChangeQuantity(Math.max(0, value - 1))}
      >
        <Text style={styles.dayButtonText}>-</Text>
      </TouchableOpacity>
      <Text style={styles.controlLabel}>
        {value} {unit}
      </Text>
      <TouchableOpacity
        style={styles.dayButton}
        onPress={() => onChangeQuantity(value + 1)}
      >
        <Text style={styles.dayButtonText}>+</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.queryButtonRow}>
      {UNIT_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.chip, unit === option && styles.chipSelected]}
          onPress={() => onChangeUnit(option)}
        >
          <Text style={unit === option ? styles.chipTextSelected : styles.chipText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
