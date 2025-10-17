import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  BottomSheetHandle,
  BottomSheetModal,
  BottomSheetView
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Season } from '../services/SeasonService';

interface PaymentOptionsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  season: Season | null;
  onPayNow: (season: Season) => void;
  onPayLater: (season: Season) => void;
}

export const PaymentOptionsBottomSheet: React.FC<PaymentOptionsBottomSheetProps> = ({
  visible,
  onClose,
  season,
  onPayNow,
  onPayLater,
}) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // snap point for the bottom sheet
  const snapPoints = useMemo(() => ['50%'], []);

  // handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  // present modal when visible is true
  useEffect(() => {
    if (visible && season) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible, season]);

  // backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}    
        opacity={0.5}
        onPress={onClose}
      />
    ),
    [onClose]
  );


  const handlePayNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (season) {
      onPayNow(season);
      onClose();
    }
  };

const handlePayLater = async () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
 if (!season) return;
  onPayLater(season); // calls the function in parent
  onClose();
};

  if (!season) return null;

  const entryFee = typeof season.entryFee === 'string' 
    ? `RM${parseFloat(season.entryFee).toFixed(2)}`
    : `RM${season.entryFee.toFixed(2)}`;

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      handleComponent={(props) => (
        <View style={styles.handleContainer}>
          <BottomSheetHandle {...props} />
        </View>
      )}
      backgroundStyle={styles.bottomSheetBackground}
      style={styles.bottomSheetContainer}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Payment Options</Text>
          <Text style={styles.seasonName}>{season.name}</Text>
        </View>

        {/* Entry Fee Display */}
        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>Entry Fee</Text>
          <Text style={styles.feeAmount}>{entryFee}</Text>
        </View>

        {/* Payment Options */}
        <View style={styles.paymentOptionsContainer}>
          {/* Pay Now Button */}
          <TouchableOpacity 
            style={styles.payNowButton}
            onPress={handlePayNow}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="card" size={20} color="#FFFFFF" />
              <Text style={styles.payNowButtonText}>Pay Now</Text>
            </View>
          </TouchableOpacity>

          {/* Pay Later Button */}
          <TouchableOpacity 
            style={styles.payLaterButton}
            onPress={handlePayLater}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="time" size={20} color="#863A73" />
              <Text style={styles.payLaterButtonText}>Pay Later</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Development Notice */}
        <View style={styles.devNoticeContainer}>
          <Ionicons name="information-circle" size={16} color="#6B7280" />
          <Text style={styles.devNoticeText}>
            Dev Only: use Pay Later to complete registration without payment (check TODO)
          </Text>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  handleContainer: {
    paddingTop: 8,
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  seasonName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  feeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#863A73',
  },
  paymentOptionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  payNowButton: {
    backgroundColor: '#863A73',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#863A73',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  payLaterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#863A73',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  payLaterButtonText: {
    color: '#863A73',
    fontSize: 16,
    fontWeight: '600',
  },
  devNoticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  devNoticeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
});
