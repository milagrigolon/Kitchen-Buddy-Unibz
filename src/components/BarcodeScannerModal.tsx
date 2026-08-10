import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from './BackButton';
import { COLORS } from '../theme/styles';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

/**
 * BarcodeScannerModal renders a full-screen camera overlay to scan product barcodes.
 * Features a dedicated overlay header with a clear Back button to exit camera mode.
 */
export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onBarcodeScanned,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!visible) {
      setScanned(false);
      return;
    }

    let isMounted = true;

    const askForPermission = async (): Promise<void> => {
      await requestPermission();

      if (isMounted) {
        setScanned(false);
      }
    };

    void askForPermission();

    return () => {
      isMounted = false;
    };
  }, [requestPermission, visible]);

  const handleScan = (result: { data: string }): void => {
    if (scanned) {
      return;
    }

    setScanned(true);
    onBarcodeScanned(result.data);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <BackButton onPress={onClose} title="Go back" />

        {permission?.granted ? (
          <View style={styles.cameraContainer}>
            <CameraView
              onBarcodeScanned={handleScan}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
              }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ) : (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>
              Camera access is required to scan a barcode.
            </Text>
            <TouchableOpacity style={styles.fallbackButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={20} color="#0f172a" />
              <Text style={styles.fallbackButtonText}>Back to Form</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  cameraContainer: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#0f172a',
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  fallbackButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
});