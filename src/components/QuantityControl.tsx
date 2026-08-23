import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../theme/styles';
import { COLORS } from '../theme/styles';
import { Unit } from '../types';
import { getQuantityStep } from '../utils/helpers';

interface QuantityControlProps {
  value: number | null;
  unit: Unit;
  consumedPercentage?: number;
  onChangeQuantity: (next: number | null) => void;
  onChangeUnit: (next: Unit) => void;
  onChangeConsumed?: (next: number) => void;
}

const UNIT_OPTIONS: Unit[] = ['pcs', 'kg', 'l'];
const CONSUMED_OPTIONS = [0, 25, 50, 75, 100];

/**
 * QuantityControl manages unit metric selection, dynamic step increments,
 * direct text entry, and consumed percentage tracking
 */
export const QuantityControl: React.FC<QuantityControlProps> = ({
  value,
  unit,
  consumedPercentage = 0,
  onChangeQuantity,
  onChangeUnit,
  onChangeConsumed,
}) => {
  const step = getQuantityStep(unit);

  const handleIncrement = () => {
    const currentValue = value ?? 0;
    const nextValue = Math.round((currentValue + step) * 100) / 100;
    onChangeQuantity(nextValue);
  };

  const handleDecrement = () => {
    const currentValue = value ?? 0;
    const nextValue = Math.max(0, Math.round((currentValue - step) * 100) / 100);
    onChangeQuantity(nextValue);
  };

  const handleQuantityTextChange = (text: string) => {
    if (!text.trim()) {
      onChangeQuantity(null);
      return;
    }
    const formattedText = text.replace(',', '.');
    const parsed = parseFloat(formattedText);
    onChangeQuantity(isNaN(parsed) ? null : Math.max(0, parsed));
  };

  const handleUnitSelect = (selectedOption: Unit) => {
    if (unit !== selectedOption) {
      onChangeUnit(selectedOption);
      onChangeQuantity(null);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.formFieldsDistance}>
        <Text style={styles.label}>Quantity Unit</Text>
        <View style={styles.queryButtonRow}>
          {UNIT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.chip, unit === option && styles.chipSelected]}
              onPress={() => handleUnitSelect(option)}
            >
              <Text style={unit === option ? styles.chipTextSelected : styles.chipText}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View>
        <Text style={styles.label}>
          Quantity Amount ({unit})
        </Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity style={styles.specialButton} onPress={handleDecrement}>
            <Text style={styles.specialButtonText}>-</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { flex: 1, textAlign: 'center', marginBottom: 0 }]}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={COLORS?.placeholder ?? '#94a3b8'}
            value={value === null ? '' : value.toString()}
            onChangeText={handleQuantityTextChange}
          />

          <TouchableOpacity style={styles.specialButton} onPress={handleIncrement}>
            <Text style={styles.specialButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {onChangeConsumed && (
        <View style={{ marginTop: 4 }}>
          <Text style={styles.label}>Consumed Amount</Text>
          <View style={styles.queryButtonRow}>
            {CONSUMED_OPTIONS.map((pct) => (
              <TouchableOpacity
                key={pct}
                style={[styles.chip, consumedPercentage === pct && styles.chipSelected]}
                onPress={() => onChangeConsumed(pct)}
              >
                <Text style={consumedPercentage === pct ? styles.chipTextSelected : styles.chipText}>
                  {pct}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};