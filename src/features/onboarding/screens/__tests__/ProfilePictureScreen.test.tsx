import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Store edges for testing
let capturedEdges: string[] | undefined;

// Mock dependencies before importing the component
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, edges, style, ...props }: any) => {
      // Capture edges for testing
      capturedEdges = edges;
      return <View testID="safe-area-view" style={style} {...props}>{children}</View>;
    },
    useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  };
});

jest.mock('sonner-native', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../../../lib/auth-client', () => ({
  useSession: () => ({
    data: {
      user: { id: 'test-user-id' },
    },
  }),
  authClient: {
    $fetch: jest.fn(),
  },
}));

jest.mock('../../services/api', () => ({
  questionnaireAPI: {
    updateOnboardingStep: jest.fn(),
    completeOnboarding: jest.fn(),
  },
}));

jest.mock('../../../../config/network', () => ({
  getBackendBaseURL: () => 'http://localhost:3000',
}));

jest.mock('../../../../shared/hooks/useProfileImageUpload', () => ({
  useProfileImageUpload: () => ({
    profileImage: null,
    isUploadingImage: false,
    showCropper: false,
    selectedImageUri: null,
    setProfileImage: jest.fn(),
    pickImageFromLibrary: jest.fn(),
    openCamera: jest.fn(),
    handleCropComplete: jest.fn(),
    handleCropCancel: jest.fn(),
    handleEditImage: jest.fn(),
  }),
}));

jest.mock('../../components', () => ({
  CircularImageCropper: () => null,
}));

// Mock SVG icons
jest.mock('../../../../../assets/icons/allset-arrow.svg', () => 'AllSetArrowIcon');

import ProfilePictureScreen from '../ProfilePictureScreen';

// Minimum touch target size per Apple HIG (44pt) and Android (48dp)
const MINIMUM_TOUCH_TARGET = 44;

describe('ProfilePictureScreen', () => {
  beforeEach(() => {
    capturedEdges = undefined;
  });

  describe('SafeAreaView configuration', () => {
    it('should include bottom edge in SafeAreaView for gesture navigation devices', () => {
      render(<ProfilePictureScreen />);

      // SafeAreaView should protect bottom edge for devices with home indicators
      // Currently only has ['top'], which causes button to be hidden on notched devices
      expect(capturedEdges).toBeDefined();
      expect(capturedEdges).toContain('bottom');
    });
  });

  describe('All Set button accessibility', () => {
    // Helper to find the TouchableOpacity ancestor
    const findTouchableAncestor = (node: any): any => {
      if (!node) return null;
      // Check if this node has onPress (TouchableOpacity characteristic)
      if (node.props?.onPress) return node;
      // Otherwise, traverse up
      return findTouchableAncestor(node.parent);
    };

    it('should have a minimum touch target size of 44x44 points', () => {
      const { getByText } = render(<ProfilePictureScreen />);

      const allSetText = getByText('All set');
      const touchable = findTouchableAncestor(allSetText);
      const buttonStyle = touchable?.props.style;

      // Flatten style array if needed
      const flatStyle = Array.isArray(buttonStyle)
        ? Object.assign({}, ...buttonStyle.filter(Boolean))
        : buttonStyle || {};

      // Button should have explicit minimum dimensions for accessibility
      const minHeight = flatStyle.minHeight || flatStyle.height || 0;
      const minWidth = flatStyle.minWidth || flatStyle.width || 0;

      expect(minHeight).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
      expect(minWidth).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
    });

    it('should have hitSlop defined for easier touch registration', () => {
      const { getByText } = render(<ProfilePictureScreen />);

      // Find the TouchableOpacity containing "All set"
      const allSetText = getByText('All set');
      const touchable = findTouchableAncestor(allSetText);

      // hitSlop should be defined to expand touch area
      expect(touchable?.props.hitSlop).toBeDefined();
    });

    it('should have adequate padding for touch target', () => {
      const { getByText } = render(<ProfilePictureScreen />);

      const allSetText = getByText('All set');
      const touchable = findTouchableAncestor(allSetText);
      const buttonStyle = touchable?.props.style;

      const flatStyle = Array.isArray(buttonStyle)
        ? Object.assign({}, ...buttonStyle.filter(Boolean))
        : buttonStyle || {};

      // Button should have padding for larger touch area
      const verticalPadding = (flatStyle.paddingVertical || 0) +
                              (flatStyle.paddingTop || 0) +
                              (flatStyle.paddingBottom || 0);
      const horizontalPadding = (flatStyle.paddingHorizontal || 0) +
                                (flatStyle.paddingLeft || 0) +
                                (flatStyle.paddingRight || 0);

      expect(verticalPadding).toBeGreaterThan(0);
      expect(horizontalPadding).toBeGreaterThan(0);
    });

    it('should trigger handleComplete when All Set button is pressed', () => {
      const { getByText } = render(<ProfilePictureScreen />);

      const allSetText = getByText('All set');
      const touchable = findTouchableAncestor(allSetText);

      // Should be able to fire press event
      expect(() => fireEvent.press(touchable!)).not.toThrow();
    });
  });
});
