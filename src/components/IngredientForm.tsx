// Reusable ingredient form used both for adding and editing.
// The component owns only the local UI inputs; it keeps the save routine pure
// and delegates object creation to the helper layer.

import React, { useEffect, useReducer } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ChipSelector } from './ChipSelector';
import { EstimateDatePicker } from './EstimateDatePicker';
import { QuantityControl } from './QuantityControl';
import { CATEGORIES, CONFECTIONS, LOCATIONS, RIPENESS_LEVELS } from '../constants/options';
import { Ingredient, Category, Location, ConfectionType, RipenessStatus, Unit } from '../types';
import { COLORS, styles } from '../theme/styles';
import { buildIngredientFromDraft, isFreshConfection, applyFrozenRules } from '../utils/helpers';
import { BarcodeScanSuggestion } from '../services/openFoodFacts';

interface IngredientFormProps {
  initialData?: Ingredient | null;
  onSave: (ingredient: Ingredient) => void;
  isEdit: boolean;
  onCancel?: () => void;
  prefillData?: BarcodeScanSuggestion | null;
  onDelete?: () => void;
}

type FormState = {
  name: string;
  category: Category | null;
  location: Location | null;
  confection: ConfectionType | null;
  expiration: string;
  quantity: number;
  unit: Unit;
  ripeness: RipenessStatus | null;
  isOpen: boolean;
  isFrozen: boolean;
  brand: string;
  barcode: string;
  consumedPercentage: number;
  originalExpiration: string;
  originalLocation: Location | null;
};

type FormAction =
  | { type: 'setField'; field: keyof FormState; value: any }
  | { type: 'reset'; initial?: Partial<FormState> }
  | { type: 'applyPrefill'; data: BarcodeScanSuggestion | null }
  | { type: 'toggleFrozen'; value: boolean };

const createInitialState = (initialData?: Ingredient | null): FormState => ({
  name: initialData?.name ?? '',
  category: initialData?.category ?? null,
  location: initialData?.location ?? null,
  confection: initialData?.confectionType ?? null,
  expiration: initialData?.expirationDate ?? '',
  quantity: initialData?.quantity ?? 0,
  unit: initialData?.unit ?? 'pcs',
  ripeness: initialData?.ripeness ?? 'green',
  isOpen: initialData?.isOpen ?? false,
  isFrozen: initialData?.isFrozen ?? false,
  brand: initialData?.brand ?? '',
  barcode: initialData?.barcode ?? '',
  consumedPercentage: initialData?.consumedPercentage ?? 0,
  originalExpiration: initialData?.expirationDate ?? '',
  originalLocation: initialData?.location ?? null,
});

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.field]: action.value };
    case 'applyPrefill':
      if (!action.data) return state;
      return {
        ...state,
        name: action.data.name ?? state.name,
        brand: action.data.brand ?? state.brand,
        category: action.data.category ?? state.category,
        barcode: action.data.barcode ?? state.barcode,
      };
    case 'toggleFrozen': {
      if (action.value) {
        const frozen = applyFrozenRules(true, state.location, state.expiration);
        return {
          ...state,
          isFrozen: true,
          originalExpiration: state.expiration,
          originalLocation: state.location,
          location: frozen.location ?? 'freezer',
          expiration: frozen.finalExp ?? state.expiration,
        };
      }

      return {
        ...state,
        isFrozen: false,
        expiration: state.originalExpiration,
        location: state.originalLocation,
      };
    }
    case 'reset':
      return { ...createInitialState(), ...action.initial };
    default:
      return state;
  }
};

const FormInput: React.FC<{
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}> = ({ label, value, onChangeText, placeholder }) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.placeholder}
    />
  </>
);

const SwitchRow: React.FC<{
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}> = ({ icon, title, description, value, onValueChange }) => (
  <View style={styles.formSwitchRow}>
    <View style={styles.formSwitchContent}>
      <MaterialCommunityIcons name={icon} size={24} color="#334155" />
      <View>
        <Text style={styles.label}>{title}</Text>
        <Text style={styles.formSwitchDescription}>{description}</Text>
      </View>
    </View>
    <Switch value={value} onValueChange={onValueChange} />
  </View>
);

const RipenessSelector: React.FC<{
  ripeness: RipenessStatus | null;
  onSelect: (value: RipenessStatus) => void;
}> = ({ ripeness, onSelect }) => {
  const ripenessStops = ['#22c55e', '#a3e635', '#fbbf24', '#f97316', '#dc2626'];
  const getRipenessColor = (index: number) => ripenessStops[Math.min(Math.max(index, 0), ripenessStops.length - 1)];
  const selectedRipenessIndex = ripeness ? RIPENESS_LEVELS.findIndex((option) => option.value === ripeness) : 0;

  return (
    <View style={styles.ripenessSection}>
      <View style={styles.ripenessTrackFrame}>
        <View style={styles.ripenessTrack} />
        <View pointerEvents="none" style={styles.ripenessTrackOverlay} />
        <View style={[styles.ripenessFill, { width: `${((selectedRipenessIndex + 1) / RIPENESS_LEVELS.length) * 100}%`, backgroundColor: selectedRipenessIndex === RIPENESS_LEVELS.length - 1 ? '#dc2626' : getRipenessColor(selectedRipenessIndex) }]} />
        <View style={styles.ripenessOptionsRow}>
          {RIPENESS_LEVELS.map((option, index) => {
            const selected = ripeness === option.value;
            const color = getRipenessColor(index);
            const isFinalAlert = option.value === 'too ripe';

            return (
              <TouchableOpacity key={option.value} activeOpacity={0.8} onPress={() => onSelect(option.value as RipenessStatus)} style={styles.ripenessOption}>
                <View style={[styles.ripenessDot, { backgroundColor: selected ? (isFinalAlert ? '#dc2626' : color) : '#f8fafc', borderColor: selected ? (isFinalAlert ? '#dc2626' : color) : '#cbd5e1', shadowColor: selected ? (isFinalAlert ? '#dc2626' : color) : 'transparent', shadowOpacity: selected ? 0.45 : 0, shadowRadius: selected ? 7 : 0, shadowOffset: { width: 0, height: 2 } }]} />
                <Text style={[styles.ripenessDotText, { color: selected ? '#0f172a' : '#64748b', fontWeight: selected ? '700' : '500' }]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export const IngredientForm: React.FC<IngredientFormProps> = ({
  initialData,
  onSave,
  isEdit,
  onCancel,
  prefillData,
  onDelete,
}) => {
  const [state, dispatch] = useReducer(formReducer, createInitialState(initialData));

  useEffect(() => {
    dispatch({ type: 'applyPrefill', data: prefillData ?? null });
  }, [prefillData]);

  const handleSave = () => {
    if (!state.name.trim()) {
      Alert.alert('Attention', 'Please enter a name for the ingredient.');
      return;
    }

    const savedIngredient = buildIngredientFromDraft({
      id: initialData?.id ?? Date.now().toString(),
      name: state.name,
      category: state.category,
      location: state.location,
      confectionType: state.confection,
      expiration: state.expiration,
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      quantity: state.quantity,
      unit: state.unit,
      consumedPercentage: state.consumedPercentage,
      ripeness: isFreshConfection(state.confection) ? state.ripeness : null,
      isOpen: state.isOpen,
      isFrozen: state.isFrozen,
      barcode: state.barcode,
      brand: state.brand,
    });

    onSave(savedIngredient);

    if (!isEdit) {
      dispatch({ type: 'reset' });
    }
  };

  const buttonColor = isEdit ? COLORS.primaryDark : COLORS.primary;

  return (
    <ScrollView
      style={[styles.formPadding, { flex: 1 }]}
      contentContainerStyle={styles.formScrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <FormInput label="Name* (e.g. Lettuce)" value={state.name} onChangeText={(value) => dispatch({ type: 'setField', field: 'name', value })} placeholder="Ingredient Name" />
      <FormInput label="Brand (e.g. Esselunga, Primia)" value={state.brand} onChangeText={(value) => dispatch({ type: 'setField', field: 'brand', value })} placeholder="Optional brand" />
      <FormInput label="Barcode (numeric)" value={state.barcode} onChangeText={(value) => dispatch({ type: 'setField', field: 'barcode', value })} placeholder="Optional barcode" />

      <Text style={styles.label}>Category</Text>
      <ChipSelector options={CATEGORIES} selectedValue={state.category} onSelect={(value) => dispatch({ type: 'setField', field: 'category', value: value as Category | null })} />

      <Text style={styles.label}>Location</Text>
      <ChipSelector options={LOCATIONS} selectedValue={state.location} onSelect={(value) => dispatch({ type: 'setField', field: 'location', value: value as Location | null })} />

      <Text style={styles.label}>Confection</Text>
      <ChipSelector options={CONFECTIONS} selectedValue={state.confection} onSelect={(value) => dispatch({ type: 'setField', field: 'confection', value: value as ConfectionType | null })} />

      <View style={styles.formHelperRow}>
        <Ionicons name="information-circle-outline" size={16} color="#64748b" />
        <Text style={styles.formHelperText}>Fresh items have a Ripeness Status.</Text>
      </View>

      {isFreshConfection(state.confection) ? (
        <>
          <Text style={styles.label}>Ripeness</Text>
          <RipenessSelector ripeness={state.ripeness} onSelect={(value) => dispatch({ type: 'setField', field: 'ripeness', value })} />
        </>
      ) : null}

      <EstimateDatePicker
        value={state.expiration}
        onChange={(newDate) => {
          dispatch({ type: 'setField', field: 'expiration', value: newDate });
          if (!state.isFrozen) {
            dispatch({ type: 'setField', field: 'originalExpiration', value: newDate });
          }
        }}
      />

      <QuantityControl
        value={state.quantity}
        unit={state.unit}
        consumedPercentage={state.consumedPercentage}
        onChangeQuantity={(value) => dispatch({ type: 'setField', field: 'quantity', value })}
        onChangeUnit={(value) => dispatch({ type: 'setField', field: 'unit', value })}
        onChangeConsumed={(value) => dispatch({ type: 'setField', field: 'consumedPercentage', value })}
      />

      <View style={styles.formSwitchGroup}>
        <SwitchRow icon="food-variant" title="Open Item" description='Open ingredients are automatically included in "expiring soon".' value={state.isOpen} onValueChange={(value) => dispatch({ type: 'setField', field: 'isOpen', value })} />
        <SwitchRow icon="snowflake" title="Frozen Item" description="Frozen fresh ingredients are moved to freezer and can last up to 6 months." value={state.isFrozen} onValueChange={(value) => dispatch({ type: 'toggleFrozen', value })} />
      </View>

      <TouchableOpacity style={[styles.mainButton, { backgroundColor: buttonColor }]} onPress={handleSave}>
        <Text style={styles.buttonText}>{isEdit ? 'Update Ingredient' : 'Add Ingredient'}</Text>
      </TouchableOpacity>

      {isEdit && onCancel && (
        <TouchableOpacity style={[styles.mainButton, { backgroundColor: '#94a3b8', marginTop: 8 }]} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      )}

      {isEdit && onDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete()} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Delete Ingredient</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};