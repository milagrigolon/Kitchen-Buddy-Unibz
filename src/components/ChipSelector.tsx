import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, styles } from '../theme/styles';

interface Option {
    label: string;
    value: string;
    icon?: string;
    iconFamily?: 'material' | 'fontawesome' | 'ionicons';
}

interface ChipSelectorProps<T extends string> {
    options: readonly Option[] | Option[];
    selectedValue: T | null | undefined;
    onSelect: (value: T | null) => void;
}

const iconStyle = { marginRight: 6 };

const renderOptionIcon = (option: Option, isSelected: boolean): React.ReactNode => {
    if (!option.icon) {
        return null;
    }

    const color = isSelected ? '#ffffff' : COLORS.primary;

    if (option.iconFamily === 'fontawesome') {
        return (
            <FontAwesome6
                name={option.icon}
                size={16}
                color={color}
                style={iconStyle}
            />
        );
    }

    if (option.iconFamily === 'ionicons') {
        return (
            <Ionicons
                name={option.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color={color}
                style={iconStyle}
            />
        );
    }

    return (
        <MaterialCommunityIcons
            name={option.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={16}
            color={color}
            style={iconStyle}
        />
    );
};

/**
 * Reusable selector used for category, location, confection and similar choices.
 */
export const ChipSelector = <T extends string>({
    options,
    selectedValue,
    onSelect,
}: ChipSelectorProps<T>): React.ReactElement => {
    const handleSelect = (option: Option): void => {
        if (selectedValue === option.value) {
            onSelect(null);
            return;
        }

        onSelect(option.value as T);
    };

    return (
        <View style={styles.chipGroup}>
            {options.map((option) => {
                const isSelected = selectedValue === option.value;

                return (
                    <TouchableOpacity
                        key={option.value}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => handleSelect(option)}
                        activeOpacity={0.7}
                    >
                        {renderOptionIcon(option, isSelected)}

                        <Text style={isSelected ? styles.chipTextSelected : styles.chipText}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};
