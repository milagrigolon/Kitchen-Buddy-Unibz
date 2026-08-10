import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { Header } from '../components/Header';
import { IngredientForm } from '../components/IngredientForm';
import { useIngredients } from '../context/AppContext';
import { COLORS, styles } from '../theme/styles';
import { Ingredient } from '../types';
import { fetchProductByBarcode } from '../services/openFoodFacts';

/**
 * AddScreen provides the entry form for adding a new ingredient.
 * It also includes the barcode action placeholder required by the pair project scope.
 */
export const AddScreen: React.FC = () => {
  const { addIngredient } = useIngredients();
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [prefillData, setPrefillData] = useState<Awaited<ReturnType<typeof fetchProductByBarcode>>>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = (ingredient: Ingredient): void => {
    addIngredient(ingredient);
    setShowSuccess(true);
  };

  const handleScanBarcode = (): void => {
    setIsScannerVisible(true);
  };

  const handleBarcodeScanned = async (barcode: string): Promise<void> => {
    const suggestion = await fetchProductByBarcode(barcode);

    if (!suggestion) {
      Alert.alert('Barcode scan', 'No product information was found for this barcode.');
      setIsScannerVisible(false);
      return;
    }

    setPrefillData({
      ...suggestion,
      barcode,
    });
    setIsScannerVisible(false);
  };

  if (showSuccess) {
    return (
      <View style={styles.flex1}>
        <Header />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: COLORS.primaryLight,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <MaterialCommunityIcons name="check" size={52} color={COLORS.primary} />
          </View>

          <Text style={{ fontSize: 26, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 }}>
            Ingredient added
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24 }}>
            Your ingredient has been added successfully.
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 18,
              paddingVertical: 14,
              paddingHorizontal: 28,
              width: '100%',
              alignItems: 'center',
            }}
            onPress={() => setShowSuccess(false)}
          >
            <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16 }}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex1}>
      <Header />
      <Text style={styles.sectionTitle}>Add ingredient</Text>
      <IngredientForm onSave={handleSave} isEdit={false} prefillData={prefillData} />
      <View style={styles.formPadding}>
        <TouchableOpacity style={styles.mainButton} onPress={handleScanBarcode}>
          <Text style={styles.buttonText}>Scan barcode</Text>
        </TouchableOpacity>
      </View>

      <BarcodeScannerModal
        visible={isScannerVisible}
        onClose={() => setIsScannerVisible(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </View>
  );
};
