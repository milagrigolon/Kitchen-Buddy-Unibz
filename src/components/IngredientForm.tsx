// Reusable ingredient form used both for adding and editing.
// The component owns only the local UI inputs; it keeps the save routine pure
// and delegates object creation to the helper layer.

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ChipSelector } from './ChipSelector';
import { EstimateDatePicker } from './EstimateDatePicker';
import { QuantityControl } from './QuantityControl';
import { CATEGORIES, CONFECTIONS, LOCATIONS, RIPENESS_LEVELS } from '../constants/options';
import { Ingredient, Category, Location, ConfectionType, RipenessStatus, Unit } from '../types';
import { styles } from '../theme/styles';
import { buildIngredientFromDraft } from '../utils/helpers';
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
  const [quantity, setQuantity] = useState<number>(initialData?.quantity ?? 1);
  const [unit, setUnit] = useState<Unit>(initialData?.unit ?? 'pcs');
  const [ripeness, setRipeness] = useState<RipenessStatus | null>(initialData?.ripeness ?? null);
  const [isOpen, setIsOpen] = useState<boolean>(initialData?.isOpen ?? false);
  const [isFrozen, setIsFrozen] = useState<boolean>(initialData?.isFrozen ?? false);
  const [brand, setBrand] = useState<string>(initialData?.brand ?? '');
  const [barcode, setBarcode] = useState<string>(initialData?.barcode ?? '');

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
      ripeness,
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
      setRipeness(null);
      setIsOpen(false);
      setIsFrozen(false);
      setBrand('');
      setBarcode('');
    }
  };

  const buttonColor = isEdit ? '#1e40af' : '#2563eb';

  return (
    <ScrollView
      style={styles.formPadding}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ingredient Name" />

      <Text style={styles.label}>Brand</Text>
      <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Optional brand" />

      <Text style={styles.label}>Barcode</Text>
      <TextInput style={styles.input} value={barcode} onChangeText={setBarcode} placeholder="Optional barcode" />

      <Text style={styles.label}>Category</Text>
      <ChipSelector options={CATEGORIES} selectedValue={category} onSelect={(value) => setCategory(value as Category | null)} />

      <Text style={styles.label}>Location</Text>
      <ChipSelector options={LOCATIONS} selectedValue={location} onSelect={(value) => setLocation(value as Location | null)} />

      <Text style={styles.label}>Confection</Text>
      <ChipSelector options={CONFECTIONS} selectedValue={confection} onSelect={(value) => setConfection(value as ConfectionType | null)} />

      <Text style={styles.label}>Ripeness</Text>
      <ChipSelector options={RIPENESS_LEVELS} selectedValue={ripeness} onSelect={(value) => setRipeness(value as RipenessStatus | null)} />

      <EstimateDatePicker value={expiration} onChange={setExpiration} />
      <QuantityControl value={quantity} unit={unit} onChangeQuantity={setQuantity} onChangeUnit={setUnit} />

      <View style={styles.queryButtonRow}>
        <TouchableOpacity style={[styles.chip, isOpen && styles.chipSelected]} onPress={() => setIsOpen((current) => !current)}>
          <Text style={isOpen ? styles.chipTextSelected : styles.chipText}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chip, isFrozen && styles.chipSelected]} onPress={() => setIsFrozen((current) => !current)}>
          <Text style={isFrozen ? styles.chipTextSelected : styles.chipText}>Frozen</Text>
        </TouchableOpacity>
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