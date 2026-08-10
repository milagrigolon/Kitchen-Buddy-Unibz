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
      {isFreshConfection(confection)?(
        <>
          <Text style={styles.label}>Ripeness</Text>
          <ChipSelector options={RIPENESS_LEVELS} selectedValue={ripeness} onSelect={(value) => setRipeness(value as RipenessStatus | null)} />
        </>
      ):null}

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