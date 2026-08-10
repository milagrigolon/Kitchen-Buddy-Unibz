import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '../theme/styles';
import { Unit } from '../types';
import { getQuantityStep } from '../utils/helpers';

interface QuantityControlProps {
  value: number;
  unit: Unit;
  consumedPercentage?: number;
  onChangeQuantity: (next: number) => void;
  onChangeUnit: (next: Unit) => void;
  onChangeConsumed?: (next: number) => void;
}

const UNIT_OPTIONS: Unit[] = ['pcs', 'kg', 'l'];
const CONSUMED_OPTIONS = [0, 25, 50, 75, 100];

/**
 * QuantityControl manages unit metric selection, dynamic step increments,
 * direct text entry, and consumed percentage tracking.
 * 
 * REACT THEORY NOTE (State & Source of Truth):
 * This component is a "Controlled Component". It does not hold its own persistent
 * quantity or unit state. Instead, state is lifted up to the parent form component
 * and flows down via props (`value`, `unit`, `consumedPercentage`).
 */
export const QuantityControl: React.FC<QuantityControlProps> = ({
  value,
  unit,
  consumedPercentage = 0,
  onChangeQuantity,
  onChangeUnit,
  onChangeConsumed,
}) => {
  // HELPER: fetch the step increment (0.25 for kg/l, 1 for pcs) dynamically from domain helpers
  const step = getQuantityStep(unit);

  // CALLBACK: Increments current quantity based on the unit step
  // Uses Math.round to avoid floating-point precision bugs in JavaScript (e.g. 0.1 + 0.2)
  const handleIncrement = () => {
    const nextValue = Math.round((value + step) * 100) / 100;
    onChangeQuantity(nextValue);
  };

  // CALLBACK: Decrements quantity down to a minimum bound of 0
  const handleDecrement = () => {
    const nextValue = Math.max(0, Math.round((value - step) * 100) / 100);
    onChangeQuantity(nextValue);
  };

  // CALLBACK: handles direct typing in TextInput
  // replaces commas with dots and parses strings to valid numbers while guarding against NaN
  const handleQuantityTextChange = (text: string) => {
    const formattedText = text.replace(',', '.');
    const parsed = parseFloat(formattedText);
    onChangeQuantity(isNaN(parsed) ? 0 : Math.max(0, parsed));
  };

  /**
   * State Batching & Callbacks:
   * When switching unit metrics (e.g., from 'pcs' to 'kg'), we trigger two state update callbacks
   * sequentially: `onChangeUnit` and `onChangeQuantity(0)`.
   * React batches these state updates together before re-rendering the UI, ensuring 
   * a single atomic update where quantity resets back to 0 cleanly.
   */
  const handleUnitSelect = (selectedOption: Unit) => {
    if (unit !== selectedOption) {
      onChangeUnit(selectedOption);
      onChangeQuantity(0); // Reset quantity to zero whenever unit changes
    }
  };

  return (
    <View style={{ gap: 12 }}>
      {/* SECTION 1: UNIT METRIC SELECTION CHIPS */}
      <View>
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

      {/* SECTION 2: QUANTITY INPUT (TEXT INPUT & STEP CONTROLS) */}
      <View>
        {/* dynamic label showing current active metric unit */}
        <Text style={styles.label}>
          Quantity Amount ({unit})
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* decrement Button */}
          <TouchableOpacity style={styles.dayButton} onPress={handleDecrement}>
            <Text style={styles.dayButtonText}>-</Text>
          </TouchableOpacity>

          {/* 
            Single Source of Truth:
            TextInput gets its 'value' strictly from props (`value.toString()`)
            Changes are communicated upward via `onChangeText` callback
          */}
          <TextInput
            style={[styles.input, { flex: 1, textAlign: 'center', marginBottom: 0 }]}
            keyboardType="decimal-pad"
            value={value === 0 ? '0' : value.toString()}
            onChangeText={handleQuantityTextChange}
          />

          {/* Increment Button */}
          <TouchableOpacity style={styles.dayButton} onPress={handleIncrement}>
            <Text style={styles.dayButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 3: CONSUMED PERCENTAGE CHIPS (conditional rendering */}
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