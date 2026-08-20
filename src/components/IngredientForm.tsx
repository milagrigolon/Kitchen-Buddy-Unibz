import React, { useEffect, useReducer } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View, Platform} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BarcodeScanSuggestion } from '../services/openFoodFacts';
import { CATEGORIES, CONFECTIONS, LOCATIONS, RIPENESS_LEVELS, DIETARY_OPTIONS} from '../constants/options';
import { COLORS, styles } from '../theme/styles';
import { Category, ConfectionType, DietaryTag, Ingredient, Location, RipenessStatus, Unit } from '../types';
import { buildIngredientFromDraft, isFreshConfection, getTodayDateString, isPastExpiration } from '../utils/helpers';
import { ChipSelector } from './ChipSelector';
import { EstimateDatePicker } from './EstimateDatePicker';
import { QuantityControl } from './QuantityControl';

interface IngredientFormProps {
  initialData?: Ingredient | null;
  onSave: (ingredient: Ingredient) => void;
  isEdit: boolean;
  onCancel?: () => void;
  prefillData?: BarcodeScanSuggestion | null;
  onDelete?: () => void;
}

interface FormInputProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

interface SwitchRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

type TextField = 'name' | 'expiration' | 'brand' | 'barcode';

type FormState = {
  name: string;
  category: Category | null;
  location: Location | null;
  confection: ConfectionType | null;
  expiration: string;
  quantity: number | null;
  unit: Unit;
  ripeness: RipenessStatus | null;
  isOpen: boolean;
  isFrozen: boolean;
  brand: string;
  barcode: string;
  consumedPercentage: number;
  dietaryTags: DietaryTag[];
};

type FormAction =
  | { type: 'setText'; field: TextField; value: string }
  | { type: 'setCategory'; value: Category | null }
  | { type: 'setLocation'; value: Location | null }
  | { type: 'setConfection'; value: ConfectionType | null }
  | { type: 'setQuantity'; value: number | null }
  | { type: 'setUnit'; value: Unit }
  | { type: 'setRipeness'; value: RipenessStatus | null }
  | { type: 'setOpen'; value: boolean }
  | { type: 'setFrozen'; value: boolean }
  | { type: 'setConsumedPercentage'; value: number }
  | { type: 'toggleDietaryTag'; value: DietaryTag } 
  | { type: 'prefill'; value: BarcodeScanSuggestion }
  | { type: 'reset' };

const ripenessColors = ['#22c55e', '#a3e635', '#fbbf24', '#dc2626'];

const emptyFormState = (): FormState => {
  return {
    name: '',
    category: null,
    location: null,
    confection: null,
    expiration: '',
    quantity: null,
    unit: 'pcs',
    ripeness: null,
    isOpen: false,
    isFrozen: false,
    brand: '',
    barcode: '',
    consumedPercentage: 0,
    dietaryTags: [], 
  };
};

const formStateFromIngredient = (ingredient?: Ingredient | null): FormState => {
  if (!ingredient) {
    return emptyFormState();
  }

  return {
    name: ingredient.name,
    category: ingredient.category,
    location: ingredient.location,
    confection: ingredient.confectionType,
    expiration: ingredient.expirationDate,
    quantity: ingredient.quantity ?? null,
    unit: ingredient.unit ?? 'pcs',
    ripeness: ingredient.ripeness ?? null,
    isOpen: ingredient.isOpen ?? false,
    isFrozen: ingredient.isFrozen ?? false,
    brand: ingredient.brand ?? '',
    barcode: ingredient.barcode ?? '',
    consumedPercentage: ingredient.consumedPercentage ?? 0,
    dietaryTags: ingredient.dietaryTags ?? [],
  };
};

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'setText':
      return {
        ...state,
        [action.field]: action.value,
      };

    case 'setCategory':
      return { ...state, category: action.value };

    case 'setLocation':
      return { ...state, location: action.value };

    case 'setConfection': {
      const newConfection = action.value;
      const canBeFrozen = isFreshConfection(newConfection) || newConfection === 'packaged';

      return {
        ...state,
        confection: newConfection,
        isFrozen: canBeFrozen ? state.isFrozen : false,
        ripeness: isFreshConfection(newConfection) ? state.ripeness : null,
      };
    }

    case 'setQuantity':
      return { ...state, quantity: action.value };

    case 'setUnit':
      return { ...state, unit: action.value };

    case 'setRipeness':
      return { ...state, ripeness: action.value };

    case 'setOpen':
      return { ...state, isOpen: action.value };

    case 'setFrozen': {
      const isNowFrozen = action.value;

      if (!isNowFrozen) {
        return {
          ...state,
          isFrozen: false,
          expiration: getTodayDateString(),
          location: state.location === 'freezer' ? null : state.location,
        };
      }

      return {
        ...state,
        isFrozen: true,
        location: state.location || 'freezer',
      };
    }

    case 'setConsumedPercentage':
      return { ...state, consumedPercentage: action.value };

    case 'toggleDietaryTag':
      return {
        ...state,
        dietaryTags: state.dietaryTags.includes(action.value)
        ? state.dietaryTags.filter((tag) => tag !== action.value)
        : [...state.dietaryTags, action.value],
  };  

    case 'prefill':
      return {
        ...state,
        name: action.value.name ?? '',
        brand: action.value.brand ?? '',
        category: action.value.category ?? null,
        barcode: action.value.barcode ?? '',
      };

    case 'reset':
      return emptyFormState();
  }
};

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  placeholder,
  onChange,
}) => {
  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.placeholder}
      />
    </>
  );
};

const SwitchRow: React.FC<SwitchRowProps> = ({
  icon,
  title,
  description,
  value,
  onChange,
}) => {
  return (
    <View style={styles.formSwitchRow}>
      <View style={styles.formSwitchContent}>
        <MaterialCommunityIcons name={icon} size={24} color="#334155" />

        <View style={{ flex: 1 }}>
          <Text style={styles.switchRowTitle}>{title}</Text>
          <Text style={styles.formSwitchDescription}>{description}</Text>
        </View>
      </View>

      <Switch value={value} onValueChange={onChange} />
    </View>
  );
};

interface DietaryCheckboxGroupProps {
  selected: DietaryTag[];
  onToggle: (tag: DietaryTag) => void;
}

const DietaryCheckboxGroup: React.FC<DietaryCheckboxGroupProps> = ({ selected, onToggle }) => {
  return (
    <View style={styles.dietaryBox}>
      {DIETARY_OPTIONS.map((option) => {
        const isChecked = selected.includes(option.value);

        return (
          <TouchableOpacity
            key={option.value}
            style={styles.dietaryRow}
            onPress={() => onToggle(option.value)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
              {isChecked ? <Ionicons name="checkmark" size={14} color={COLORS.white} /> : null}
            </View>
            <Text style={styles.dietaryLabel}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const colorForRipeness = (index: number): string => {
  const safeIndex = Math.min(Math.max(index, 0), ripenessColors.length - 1);
  return ripenessColors[safeIndex];
};

interface RipenessSelectorProps {
  value: RipenessStatus | null;
  onChange: (value: RipenessStatus | null) => void;
}

const RipenessSelector: React.FC<RipenessSelectorProps> = ({ value, onChange }) => {
  const selectedIndex = value
    ? RIPENESS_LEVELS.findIndex((option) => option.value === value)
    : -1;

  const isSelected = selectedIndex >= 0;
  const fillWidth = isSelected
    ? (`${((selectedIndex + 1) / RIPENESS_LEVELS.length) * 100}%` as `${number}%`)
    : '0%';

  const handleSelect = (optionValue: RipenessStatus) => {
    if (value === optionValue) {
      onChange(null);
    } else {
      onChange(optionValue);
    }
}

  return (
    <>
      <Text style={styles.label}>Ripeness</Text>

      <View style={styles.ripenessSection}>
        <View style={styles.ripenessTrackFrame}>
          {/* grey tracker */}
          <View style={styles.ripenessTrack} />

          {/* ACTIVE COLOURED BAR: only is ISSELECTED is active */}
          {isSelected ? (
            <View
              style={[
                styles.ripenessFill,
                {
                  width: fillWidth,
                  backgroundColor: colorForRipeness(selectedIndex),
                },
              ]}
            />
          ) : null}

          {/* Labels and Buttons */}
          <View style={styles.ripenessOptionsRow}>
            {RIPENESS_LEVELS.map((option, index) => {
              const selected = value === option.value;
              const color = colorForRipeness(index);

              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(option.value)}
                  style={styles.ripenessOption}
                >
                  <View
                    style={[
                      styles.ripenessDot,
                      {
                        backgroundColor: selected ? color : '#f8fafc',
                        borderColor: selected ? color : '#cbd5e1',
                        shadowColor: selected ? color : 'transparent',
                        shadowOpacity: selected ? 0.4 : 0,
                        shadowRadius: selected ? 6 : 0,
                        shadowOffset: { width: 0, height: 2 },
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.ripenessDotText,
                      {
                        color: selected ? '#0f172a' : '#64748b',
                        fontWeight: selected ? '700' : '500',
                      },
                    ]}
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
  const [form, dispatch] = useReducer(
    formReducer,
    initialData,
    formStateFromIngredient
  );

  useEffect(() => {
    if (!prefillData) {
      return;
    }

    dispatch({ type: 'prefill', value: prefillData });
  }, [prefillData]);

  const setText = (field: TextField) => {
    return (value: string): void => {
      dispatch({ type: 'setText', field, value });
    };
  };

  const saveIngredient = (): void => {
    
    if (!form.name.trim()) {
      if (Platform.OS === 'web') {
          alert('Attention: Please enter a name for the ingredient.');
      } else {
          Alert.alert('Attention', 'Please enter a name for the ingredient.');
      }
      return;
    }

    if (isPastExpiration(form.expiration)) {
      if (Platform.OS === 'web') {
        alert('Invalid Date: The expiration date cannot be in the past.');
      } else {
        Alert.alert('Invalid Date', 'The expiration date cannot be in the past.');
      }
      return;
    }

    const ingredient = buildIngredientFromDraft({
      id: initialData?.id ?? Date.now().toString(),
      name: form.name,
      category: form.category,
      location: form.location,
      confectionType: form.confection,
      expiration: form.expiration,
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      quantity: form.quantity,
      unit: form.unit,
      consumedPercentage: form.consumedPercentage,
      ripeness: isFreshConfection(form.confection) ? form.ripeness : null,
      isOpen: form.isOpen,
      isFrozen: form.isFrozen,
      barcode: form.barcode,
      brand: form.brand,
      dietaryTags: form.dietaryTags, 
      previousIngredient: initialData ?? null,
    });

    onSave(ingredient);

    if (!isEdit) {
      dispatch({ type: 'reset' });
    }
  };

  return (
    <ScrollView
        style={[styles.formPadding, { flex: 1 }]}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

      <View style = {styles.formFieldsDistance}>  
        <FormInput 
          label="Name* (e.g. Lettuce)"
          value={form.name}
          onChange={setText('name')}
          placeholder="Ingredient Name"
        />
      </View>

      <View style = {styles.formFieldsDistance}>  
          <FormInput
            label="Brand (e.g. Esselunga, Primia)"
            value={form.brand}
            onChange={setText('brand')}
            placeholder="Optional brand"
          />
      </View>

      <View style = {styles.formFieldsDistance}>   
          <FormInput
            label="Barcode (numeric)"
            value={form.barcode}
            onChange={setText('barcode')}
            placeholder="Optional barcode"
      />
      
      </View>
      
        <Text style={styles.label}>Category</Text>
          <ChipSelector
            options={CATEGORIES}
            selectedValue={form.category}
            onSelect={(value) => dispatch({ type: 'setCategory', value })}
        />

        <Text style={styles.label}>Location</Text>
          <ChipSelector
            options={LOCATIONS}
            selectedValue={form.location}
            onSelect={(value) => dispatch({ type: 'setLocation', value })}
        />

        <Text style={styles.label}>Confection</Text>
          <ChipSelector
            options={CONFECTIONS}
            selectedValue={form.confection}
            onSelect={(value) => dispatch({ type: 'setConfection', value })}
        />

        <View style={styles.formHelperRow}>
          <Ionicons name="information-circle-outline" size={16} color="#64748b" />
            <Text style={styles.formHelperText}>
              Fresh ingredients have a Ripeness Status that is checked automatically every 3 days. 
            </Text>
        </View>

        {isFreshConfection(form.confection) ? (
            <RipenessSelector
              value={form.ripeness}
              onChange={(value) => dispatch({ type: 'setRipeness', value })}
            />
        ) : null}

        <Text style={styles.label}>Dietary Needs</Text>
        <DietaryCheckboxGroup
            selected={form.dietaryTags}
            onToggle={(value) => dispatch({ type: 'toggleDietaryTag', value })}
        />

        <EstimateDatePicker
          value={form.expiration}
          onChange={setText('expiration')}
        />

        <QuantityControl
            value={form.quantity}
            unit={form.unit}
            consumedPercentage={form.consumedPercentage}
            onChangeQuantity={(value) => dispatch({ type: 'setQuantity', value })}
            onChangeUnit={(value) => dispatch({ type: 'setUnit', value })}
            onChangeConsumed={(value) =>
              dispatch({ type: 'setConsumedPercentage', value })
            }
        />
        <View style={styles.formSwitchGroup}>
          <View style={styles.controlContainer}>
           <SwitchRow
              icon="food-variant"
              title="Open"
              description='Open ingredients are automatically included in "expiring soon".'
              value={form.isOpen}
              onChange={(value) => dispatch({ type: 'setOpen', value })}
            /> 
          </ View>  

          { isFreshConfection(form.confection) || form.confection === 'packaged' ? (
          <View style={styles.controlContainer}>
              <SwitchRow
              icon="snowflake"
              title="Frozen"
              description="Frozen ingredients are moved to freezer and can last up to 6 months."
              value={form.isFrozen}
              onChange={(value) => dispatch({ type: 'setFrozen', value })}
            />  
            </View>
            ) : null}
          </View>  

          <TouchableOpacity style={styles.mainButton} onPress={saveIngredient}>
            <Text style={styles.buttonText}>
              {isEdit ? 'Update Ingredient' : 'Add Ingredient'}
            </Text>
          </TouchableOpacity>

          {isEdit && onCancel ? (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}

          {isEdit && onDelete ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onDelete}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Delete Ingredient</Text>
            </TouchableOpacity>
          ) : null}

    </ScrollView>
  );
};
