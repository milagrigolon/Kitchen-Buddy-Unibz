// src/components/ExpiringList.tsx
// List screen for the Expiring tab.
// It lets the user choose a time window and then shows only the ingredients
// that expire within that range.

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ingredient } from '../types';
import { styles } from '../theme/styles';
import { filterExpiringWithin } from '../utils/helpers';

interface ExpiringListProps {
    ingredients: Ingredient[];
}

// ExpiringList is a small query screen. It keeps the selected expiration window
// in local state and derives the matching items with a pure helper function.
export const ExpiringList: React.FC<ExpiringListProps> = ({ ingredients }) => {
    // daysThreshold is the user-selected horizon shown in the expiring screen.
    const [daysThreshold, setDaysThreshold] = useState<number>(7);

    // expiringIngredients is a memoized pure query derived from the shared
    // expiration helper. It updates whenever the ingredient collection or the
    // selected threshold changes.
    const expiringIngredients = useMemo(
        () => filterExpiringWithin(ingredients, daysThreshold),
        [ingredients, daysThreshold]
    );

    return (
        <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Ingredients Expiring Soon</Text>

            {/* Control "How soon" (Days Selector) */}
            <View style={styles.controlContainer}>
                <Text style={styles.controlLabel}>Show items expiring within:</Text>
                <View style={styles.buttonGroup}>
                    {[3, 7, 14].map((days) => (
                        <TouchableOpacity
                            key={days}
                            style={[
                                styles.specialButton,
                                daysThreshold === days && styles.specialButtonActive,
                            ]}
                            onPress={() => setDaysThreshold(days)}
                        >
                            <Text
                                style={[
                                    styles.specialButtonText,
                                    daysThreshold === days && styles.specialButtonTextActive,
                                ]}
                            >
                                {days} days
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Ingredients List */}
            {expiringIngredients.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        No ingredients expiring within {daysThreshold} days!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={expiringIngredients}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardRow}>
                                <Text style={styles.cardTitle}>{item.name}</Text>
                            </View>
                            <Text style={styles.cardLoc}>
                                {item.category || 'No cat.'} | {item.location || 'No loc.'}
                            </Text>
                            <Text style={styles.cardExp}>
                                Expires: {item.expirationDate}
                            </Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
};