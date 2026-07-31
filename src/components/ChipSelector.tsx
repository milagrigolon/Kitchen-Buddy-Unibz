// Small reusable selector for chip-style values such as category, location, and confection.
// Turns a list of options into a compact tappable control

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, FontAwesome6, Ionicons } from '@expo/vector-icons';
import { styles } from '../theme/styles';

interface Option {
    label: string;
    value: string;
    icon?: string;
    iconFamily?: 'material' | 'fontawesome' | 'ionicons'; // tells where to get the icon
}

interface ChipSelectorProps {
    options: readonly Option[] | Option[];
    selectedValue: string | null | undefined;
    onSelect: (value: any) => void;
}

// ChipSelector renders the option badges and toggles the current selection.
// When a chip is already selected, pressing it clears the value.
export const ChipSelector: React.FC<ChipSelectorProps> = ({
    options,
    selectedValue,
    onSelect,
}) => {
    // Select the correct icon component based on the iconFamily (3 different options)
    const renderIcon = (option: Option, isSelected: boolean) => {
        if (!option.icon) return null;

        const color = isSelected ? '#ffffff' : '#2563eb';
        const size = 16;
        const style = { marginRight: 6 };

        if (option.iconFamily === 'fontawesome') {
            return <FontAwesome6 name={option.icon} size={size} color={color} style={style} />;
        }

        if (option.iconFamily === 'ionicons') {
            return <Ionicons name={option.icon as any} size={size} color={color} style={style} />;
        }

        // Default: MaterialCommunityIcons
        return <MaterialCommunityIcons name={option.icon as any} size={size} color={color} style={style} />;
    };

    return (
        <View style={styles.chipGroup}>
            {options.map((option) => {
                const isSelected = selectedValue === option.value;

                return (
                    <TouchableOpacity
                        key={option.value}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => {
                            if (isSelected) {
                                onSelect(null);
                            } else {
                                onSelect(option.value);
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        {renderIcon(option, isSelected)}
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};