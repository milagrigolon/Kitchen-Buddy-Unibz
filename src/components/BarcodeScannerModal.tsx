import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS } from '../theme/styles';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

/**
 * BarcodeScannerModal handles the camera permission request and shows a simple
 * scanner overlay for the add-ingredient workflow.
 */
export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ visible, onClose, onBarcodeScanned }) => {
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
        <View style={styles.header}>
          <Text style={styles.title}>Scan product barcode</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        {permission?.granted ? (
          <CameraView
            onBarcodeScanned={handleScan}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
            }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>
              Camera access is required to scan a barcode.
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Back</Text>
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
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  closeButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
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
    marginBottom: 16,
    color: '#0f172a',
  },
});
