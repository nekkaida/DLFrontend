import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Image,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PREVIEW_SIZE = Math.min(SCREEN_WIDTH * 0.7, 300);

// Responsive helpers
const sw = (pct: number) => SCREEN_WIDTH * (pct / 100);
const sh = (pct: number) => SCREEN_HEIGHT * (pct / 100);

interface CircularImageCropperProps {
  visible: boolean;
  imageUri: string;
  onCropComplete: (croppedUri: string) => void;
  onCancel: () => void;
}

/**
 * Simple preview modal that shows how the cropped image will look
 * as a circular profile picture. The actual cropping is done by
 * expo-image-picker's native editor (square aspect ratio).
 */
const CircularImageCropper: React.FC<CircularImageCropperProps> = ({
  visible,
  imageUri,
  onCropComplete,
  onCancel,
}) => {
  const handleConfirm = () => {
    // Image is already cropped by expo-image-picker, just confirm
    onCropComplete(imageUri);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        {/* Header - Title only */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile Picture Preview</Text>
        </View>

        {/* Preview Area */}
        <View style={styles.previewArea}>
          <Text style={styles.instructionText}>
            This is how your profile picture will look
          </Text>

          {/* Circular Preview */}
          <View style={styles.circularPreviewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.circularPreview}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.hintText}>
            Tip: Make sure your face is centered in the photo
          </Text>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleConfirm} style={styles.doneButton}>
            <Text style={styles.doneText}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: sw(5),
    paddingTop: Platform.select({ ios: sh(3), android: sh(2) }),
    paddingBottom: sh(1.5),
    marginTop: sh(6),
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  previewArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 30,
    textAlign: 'center',
  },
  circularPreviewContainer: {
    marginBottom: 30,
  },
  circularPreview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: PREVIEW_SIZE / 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  hintText: {
    color: '#AAAAAA',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: Platform.select({ ios: 40, android: 30 }),
    paddingTop: 20,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  doneButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: '#FE9F4D',
  },
  doneText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CircularImageCropper;
