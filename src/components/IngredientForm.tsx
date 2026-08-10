// Reusable ingredient form used both for adding and editing.
// The component owns only the local UI inputs; it keeps the save routine pure
// and delegates object creation to the helper layer.

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ChipSelector } from './ChipSelector';
import { EstimateDatePicker } from './EstimateDatePicker';
import { QuantityControl } from './QuantityControl';
import { CATEGORIES, CONFECTIONS, LOCATIONS, RIPENESS_LEVELS } from '../constants/options';
import { Ingredient, Category, Location, ConfectionType, RipenessStatus, Unit } from '../types';
import { COLORS, styles } from '../theme/styles';
import { buildIngredientFromDraft, isFreshConfection } from '../utils/helpers';
import { BarcodeScanSuggestion } from '../services/openFoodFacts';

interface IngredientFormProps {
  initialData?: Ingredient | null;
  onSave: (ingredient: Ingredient) => void;
  isEdit: boolean;
  onCancel?: () => void;
  prefillData?: BarcodeScanSuggestion | null;
}

/**
 * IngredientForm gathers the core ingredient details in a reusable interface and
 * transforms them into a single typed Ingredient value when the user saves.
 */
export const IngredientForm: React.FC<IngredientFormProps> = ({
  initialData,
  onSave,
  isEdit,
  onCancel,
  prefillData,
}) => {
  const [name, setName] = useState<string>(initialData?.name ?? '');
  const [category, setCategory] = useState<Category | null>(initialData?.category ?? null);
  const [location, setLocation] = useState<Location | null>(initialData?.location ?? null);
  const [confection, setConfection] = useState<ConfectionType | null>(initialData?.confectionType ?? null);
  const [expiration, setExpiration] = useState<string>(initialData?.expirationDate ?? '');
  const [quantity, setQuantity] = useState<number>(initialData?.quantity ?? 0);
  const [unit, setUnit] = useState<Unit>(initialData?.unit ?? 'pcs');
  const [ripeness, setRipeness] = useState<RipenessStatus | null>(initialData?.ripeness ?? null);
  const [isOpen, setIsOpen] = useState<boolean>(initialData?.isOpen ?? false);
  const [isFrozen, setIsFrozen] = useState<boolean>(initialData?.isFrozen ?? false);
  const [brand, setBrand] = useState<string>(initialData?.brand ?? '');
  const [barcode, setBarcode] = useState<string>(initialData?.barcode ?? '');
  // Track consumed percentage state
  const [consumedPercentage, setConsumedPercentage] = useState<number>(initialData?.consumedPercentage ?? 0);

  useEffect(() => {
    if (!prefillData) {
      return;
    }

    setName(prefillData.name ?? '');
    setBrand(prefillData.brand ?? '');
    setCategory(prefillData.category ?? null);
    setBarcode(prefillData.barcode ?? '');
  }, [prefillData]);

  const handlePress = (): void => {
    if (!name.trim()) {
      Alert.alert('Attention', 'Please enter a name for the ingredient.');
      return;
    }

    const savedIngredient = buildIngredientFromDraft({
      id: initialData?.id ?? Date.now().toString(),
      name,
      category,
      location,
      confectionType: confection,
      expiration,
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      quantity,
      unit,
      consumedPercentage, // <-- AGGIUNGI QUESTA RIGA
      ripeness: isFreshConfection(confection) ? ripeness : null,
      isOpen,
      isFrozen,
      barcode,
      brand,
    });

    onSave(savedIngredient);

    if (!isEdit) {
      setName('');
      setCategory(null);
      setLocation(null);
      setConfection(null);
      setExpiration('');
      setQuantity(1);
      setUnit('pcs');
      setConsumedPercentage(0); // <-- AGGIUNGI QUESTA RIGA PER RESETTARE LO STATO
      setRipeness(null);
      setIsOpen(false);
      setIsFrozen(false);
      setBrand('');
      setBarcode('');
    }
  };

  const buttonColor = isEdit ? COLORS.primaryDark : COLORS.primary;
  const ripenessStops = ['#22c55e', '#a3e635', '#fbbf24', '#f97316', '#dc2626'];
  const getRipenessColor = (index: number) => ripenessStops[Math.min(Math.max(index, 0), ripenessStops.length - 1)];
  const selectedRipenessIndex = ripeness ? RIPENESS_LEVELS.findIndex((option) => option.value === ripeness) : 0;

  return (
    <ScrollView
      style={styles.formPadding}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Name* (e.g. Lettuce)</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ingredient Name" />

      <Text style={styles.label}>Brand (e.g. Esselunga, Conad)</Text>
      <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Optional brand" />

      <Text style={styles.label}>Barcode (numeric)</Text>
      <TextInput style={styles.input} value={barcode} onChangeText={setBarcode} placeholder="Optional barcode" />

      <Text style={styles.label}>Category</Text>
      <ChipSelector options={CATEGORIES} selectedValue={category} onSelect={(value) => setCategory(value as Category | null)} />

      <Text style={styles.label}>Location</Text>
      <ChipSelector options={LOCATIONS} selectedValue={location} onSelect={(value) => setLocation(value as Location | null)} />

      <Text style={styles.label}>Confection</Text>
      <ChipSelector options={CONFECTIONS} selectedValue={confection} onSelect={(value) => setConfection(value as ConfectionType | null)} />

      {/* Ripeness clarification */}
      <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 8 }}>
        Fresh items have a Ripeness Status
      </Text>

      {/* RIPENESS shown only if the category is 'Fresh' --> conditional rendering*/}
      {isFreshConfection(confection) ? (
        <>
          <Text style={styles.label}>Ripeness</Text>
          <View style={{ marginTop: 8, marginBottom: 12 }}>
            <View style={{ position: 'relative', paddingVertical: 8 }}>
              <View
                style={{
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: '#e2e8f0',
                  overflow: 'hidden',
                }}
              />

              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                }}
              />

              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 8,
                  height: 8,
                  width: `${((selectedRipenessIndex + 1) / RIPENESS_LEVELS.length) * 100}%`,
                  borderRadius: 999,
                  backgroundColor: selectedRipenessIndex === RIPENESS_LEVELS.length - 1 ? '#dc2626' : getRipenessColor(selectedRipenessIndex),
                  opacity: 1,
                }}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                {RIPENESS_LEVELS.map((option, index) => {
                  const selected = ripeness === option.value;
                  const color = getRipenessColor(index);
                  const isFinalAlert = option.value === 'too ripe';

                  return (
                    <TouchableOpacity
                      key={option.value}
                      activeOpacity={0.8}
                      onPress={() => setRipeness(option.value)}
                      style={{ flex: 1, alignItems: 'center' }}
                    >
                      <View
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          backgroundColor: selected ? (isFinalAlert ? '#dc2626' : color) : '#f8fafc',
                          borderWidth: 2,
                          borderColor: selected ? (isFinalAlert ? '#dc2626' : color) : '#cbd5e1',
                          marginBottom: 8,
                          shadowColor: selected ? (isFinalAlert ? '#dc2626' : color) : 'transparent',
                          shadowOpacity: selected ? 0.45 : 0,
                          shadowRadius: selected ? 7 : 0,
                          shadowOffset: { width: 0, height: 2 },
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 10,
                          color: selected ? '#0f172a' : '#64748b',
                          fontWeight: selected ? '700' : '500',
                          textAlign: 'center',
                        }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </>
      ) : null}

      <EstimateDatePicker value={expiration} onChange={setExpiration} />
      <QuantityControl
        value={quantity}
        unit={unit}
        consumedPercentage={consumedPercentage}
        onChangeQuantity={setQuantity}
        onChangeUnit={setUnit}
        onChangeConsumed={setConsumedPercentage}
      />

      <View style={{ marginVertical: 12, gap: 16 }}>
        {/* Switch for OPEN */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
            <MaterialCommunityIcons name="food-variant" size={24} color="#334155" />
            <View>
              <Text style={styles.label}>Open Item</Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Open ingredients are automatically included in "expiring soon".
              </Text>
            </View>
          </View>
          <Switch value={isOpen} onValueChange={setIsOpen} />
        </View>

        {/* Switch for FROZEN */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
            <MaterialCommunityIcons name="snowflake" size={24} color="#334155" />
            <View>
              <Text style={styles.label}>Frozen Item</Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Frozen fresh ingredients are moved to freezer and can last up to 6 months.
              </Text>
            </View>
          </View>
          <Switch value={isFrozen} onValueChange={setIsFrozen} />
        </View>
      </View>

      <TouchableOpacity style={[styles.mainButton, { backgroundColor: buttonColor }]} onPress={handlePress}>
        <Text style={styles.buttonText}>{isEdit ? 'Update Ingredient' : 'Add Ingredient'}</Text>
      </TouchableOpacity>

      {isEdit && onCancel && (
        <TouchableOpacity style={[styles.mainButton, { backgroundColor: '#94a3b8', marginTop: 8 }]} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};