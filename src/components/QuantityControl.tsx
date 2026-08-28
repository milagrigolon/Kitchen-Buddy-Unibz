import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../theme/styles';
import { COLORS } from '../theme/styles';
import { Unit } from '../types';
import { getQuantityStep } from '../utils/helpers';

interface QuantityControlProps {
  value: number | null;
  unit: Unit | null;
  consumedPercentage?: number;
  onChangeQuantity: (next: number | null) => void;
  onChangeUnit: (next: Unit | null) => void;
  onChangeConsumed?: (next: number) => void;
}

const UNIT_OPTIONS: Unit[] = ['pcs', 'kg', 'l'];
const CONSUMED_OPTIONS = [0, 25, 50, 75, 100];

/**
 * QuantityControl manages unit metric selection, dynamic step increments,
 * direct text entry, and consumed percentage tracking
 * 
 * Keeps a local `inputText` state mirroring the numeric `value` prop, so the
 * text field can hold intermediate typing states (e.g. a trailing "." or an
 * empty string) that wouldn't be valid as a parsed number yet. Syncs back to
 * `value` via a useEffect whenever the prop changes from outside.
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
  const [inputText, setInputText] = useState<string>(value === null ? '' : value.toString());

  useEffect(() => {
    setInputText(value === null ? '' : value.toString());
  }, [value]);

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
    const formattedText = text.replace(',', '.');
    
    const allowedPattern = unit === 'pcs' ? /^\d*$/ : /^\d*\.?\d*$/;
    if (!allowedPattern.test(formattedText)) return;

    setInputText(formattedText);

    if (!formattedText.trim() || formattedText === '.') {
      onChangeQuantity(null);
      return;
    }
    if (formattedText.endsWith('.')) return;

    const parsed = parseFloat(formattedText);
    onChangeQuantity(isNaN(parsed) ? null : Math.max(0, parsed));
  };

  const handleUnitSelect = (selectedOption: Unit) => {
    if (unit === selectedOption) {
      onChangeUnit(null);
      onChangeQuantity(null);
      setInputText('');
      return;
    }

    onChangeUnit(selectedOption);
    onChangeQuantity(null);
    setInputText('');
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
          Quantity Amount{unit ? ` (${unit})` : ''}
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
            value={inputText}
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