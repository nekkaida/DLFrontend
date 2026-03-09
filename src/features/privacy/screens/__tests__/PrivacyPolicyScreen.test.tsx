import React from 'react';
import { ScrollView } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }: any) => React.createElement(Text, null, name),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children, style, ...props }: any) =>
      React.createElement(View, { style, ...props }, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }),
  };
});

import PrivacyPolicyScreen from '../PrivacyPolicyScreen';

describe('PrivacyPolicyScreen change password modal', () => {
  const scrollToMock = jest.fn();

  beforeAll(() => {
    ScrollView.prototype.scrollTo = scrollToMock;
    global.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    }) as typeof requestAnimationFrame;
    global.cancelAnimationFrame = jest.fn();
  });

  beforeEach(() => {
    scrollToMock.mockClear();
  });

  it('renders the change password flow inside a keyboard-avoiding container', () => {
    const { getByText, getByTestId } = render(<PrivacyPolicyScreen />);

    fireEvent.press(getByText('Change'));

    expect(getByTestId('change-password-keyboard-container')).toBeTruthy();
    expect(getByTestId('change-password-scroll')).toBeTruthy();
  });

  it('scrolls the confirm password field into view when it receives focus', () => {
    const { getByText, getByTestId, getByLabelText } = render(<PrivacyPolicyScreen />);

    fireEvent.press(getByText('Change'));
    scrollToMock.mockClear();

    fireEvent(getByTestId('change-password-confirm-group'), 'layout', {
      nativeEvent: { layout: { y: 420 } },
    });
    fireEvent(getByLabelText('Confirm New Password'), 'focus');

    expect(scrollToMock).toHaveBeenCalled();

    const lastCall = scrollToMock.mock.calls.at(-1)?.[0];
    expect(lastCall).toEqual(
      expect.objectContaining({
        animated: true,
      })
    );
    expect(lastCall?.y).toBeGreaterThan(0);
  });
});
