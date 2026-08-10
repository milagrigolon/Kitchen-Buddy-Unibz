import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, COLORS } from '../theme/styles';

interface BackButtonProps {
    onPress: () => void;
    title?: string;
}

/**
 * BackButton acts as a dedicated orange top header for detail/form screens.
 * Features an integrated back arrow and custom title (defaults to "Go back").
 */
export const BackButton: React.FC<BackButtonProps> = ({
    onPress,
    title = 'Go back',
}) => {
    return (
        <View style={styles.backButtonContainer}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={styles.backButtonIcon}
            >
                <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            </TouchableOpacity>

            <Text style={styles.backButtonTitle}>
                {title}
            </Text>
        </View>
    );
};