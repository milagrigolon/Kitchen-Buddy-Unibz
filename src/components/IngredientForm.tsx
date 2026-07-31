// Reusable form used both for creating a new ingredient and for editing an
// existing one. It keeps the form state local and delegates the object-building
// logic to the helper layer.

import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ChipSelector } from './ChipSelector';
import { CATEGORIES, LOCATIONS, CONFECTIONS } from '../utils/constants';
import { Ingredient, Category, Location, ConfectionType } from '../types';
import { styles } from '../theme/styles';
import { buildIngredientFromDraft } from '../utils/helpers';

interface IngredientFormProps {
    initialData?: Ingredient | null;
    onSave: (ingredient: Ingredient) => void;
    isEdit: boolean;
    onCancel?: () => void;
}

// IngredientForm renders the editable ingredient fields and submits the final
// data back to the parent screen through the onSave callback.
export const IngredientForm: React.FC<IngredientFormProps> = ({
    initialData,
    onSave,
    isEdit,
    onCancel,
}) => {
    // Component state is kept local and explicit.
    const [name, setName] = useState<string>(initialData?.name ?? '');
    const [category, setCategory] = useState<Category | null>(initialData?.category ?? null);
    const [location, setLocation] = useState<Location | null>(initialData?.location ?? null);
    const [confection, setConfection] = useState<ConfectionType | null>(initialData?.confectionType ?? null);
    const [expiration, setExpiration] = useState<string>(initialData?.expirationDate ?? '');

    // handlePress validates the required fields and then converts the form
    // draft into a complete Ingredient object using the shared helper.
    const handlePress = (): void => {
        if (!name.trim()) {
            Alert.alert('Attention!! ', 'Please enter a name for the ingredient.');
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
        });

        onSave(savedIngredient);

        // Reset only when the user is adding a new ingredient.
        if (!isEdit) {
            setName('');
            setCategory(null);
            setLocation(null);
            setConfection(null);
            setExpiration('');
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
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ingredient Name"
            />

            <Text style={styles.label}>Category</Text>
            <ChipSelector
                options={CATEGORIES}
                selectedValue={category}
                onSelect={(val) => setCategory(val)}
            />

            <Text style={styles.label}>Location</Text>
            <ChipSelector
                options={LOCATIONS}
                selectedValue={location}
                onSelect={(val) => setLocation(val)}
            />

            <Text style={styles.label}>Confection</Text>
            <ChipSelector
                options={CONFECTIONS}
                selectedValue={confection}
                onSelect={(val) => setConfection(val)}
            />

            <Text style={styles.label}>Expiration (example: 1 week, 10 days, 1 month)</Text>
            <TextInput
                style={styles.input}
                value={expiration}
                onChangeText={setExpiration}
                placeholder="DD/MM/YYYY"
            />

            <TouchableOpacity
                style={[styles.mainButton, { backgroundColor: buttonColor }]}
                onPress={handlePress}
            >
                <Text style={styles.buttonText}>
                    {isEdit ? 'Update Ingredient' : 'Add Ingredient'}
                </Text>
            </TouchableOpacity>

            {isEdit && onCancel && (
                <TouchableOpacity
                    style={[styles.mainButton, { backgroundColor: '#94a3b8', marginTop: 8 }]}
                    onPress={onCancel}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
};