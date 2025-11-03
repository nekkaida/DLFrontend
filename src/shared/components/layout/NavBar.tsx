import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  NavBarChatIcon, 
  NavBarLeagueIcon, 
  NavBarConnectIcon, 
  NavBarMyGamesIcon, 
  NavBarFriendlyIcon 
} from '@/shared/components/icons';

const { width } = Dimensions.get('window');

interface NavBarProps {
  activeTab?: number;
  onTabPress?: (tabIndex: number) => void;
  badgeCounts?: {
    connect?: number;
    friendly?: number;
    leagues?: number;
    myGames?: number;
    chat?: number;
  };
  sport?: 'pickleball' | 'tennis' | 'padel';
}

export default function NavBar({ activeTab = 2, onTabPress, badgeCounts, sport = 'pickleball' }: NavBarProps) {
  // Get safe area insets
  const insets = useSafeAreaInsets();

  // Detect if Android device has gesture navigation
  // Gesture navigation typically has bottom insets > 0 on Android
  // Button navigation typically has bottom insets = 0 on Android
  const hasAndroidGestureNav = Platform.OS === 'android' && insets.bottom > 0;

  // Only apply safe area adjustments if Android has gesture navigation
  const shouldApplySafeArea = hasAndroidGestureNav;

  // Debug log to show what activeTab prop is received
  console.log(`NavBar: Received activeTab prop: ${activeTab}`);

  const tabs = [
    { label: 'Connect', index: 0 },
    { label: 'Friendly', index: 1 },
    { label: 'Leagues', index: 2 },
    { label: 'My Games', index: 3 },
    { label: 'Chat', index: 4 },
  ];

  const handleTabPress = (tabIndex: number) => {
    // Placeholder function that doesn't return anything
    // You can add actual navigation logic here later
    console.log(`NavBar: Tab ${tabIndex} pressed`);

    if (onTabPress) {
      onTabPress(tabIndex);
    }
  };

  // Debug logging for render
  console.log(`NavBar: Rendering with activeTab: ${activeTab}, safe area bottom: ${insets.bottom}px, gesture nav: ${hasAndroidGestureNav}`);

  const getSelectedColor = (sport: 'pickleball' | 'tennis' | 'padel'): string => {
    switch (sport) {
      case 'tennis':
        return '#4A7D00';
      case 'padel':
        return '#1B72C0';
      case 'pickleball':
      default:
        return '#933FF2';
    }
  };

  const selectedColor = getSelectedColor(sport);

  return (
    <View
      style={[
        styles.navBar,
        shouldApplySafeArea && {
          // Apply safe area adjustments only for Android gesture navigation
          height: 50 + insets.bottom,
          paddingBottom: insets.bottom,
        }
      ]}
      onLayout={(event) => {
        const { x, y, width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout;
        console.log('=== NavBar Layout Debug ===');
        console.log(`NavBar layout:`, {
          x,
          y,
          width: layoutWidth,
          height: layoutHeight
        });
        console.log(`NavBar actual bottom position: ${y + layoutHeight}px`);
        console.log(`Screen height: ${Dimensions.get('window').height}px`);
        console.log(`Distance from screen bottom: ${Dimensions.get('window').height - (y + layoutHeight)}px`);
        console.log('========================');
      }}
    >
      {/* Tabs Container */}
      <View
        style={styles.tabsContainer}
        onLayout={(event) => {
          const { x, y, width: tabsWidth, height: tabsHeight } = event.nativeEvent.layout;
          console.log('=== Tabs Container Layout Debug ===');
          console.log(`Tabs container layout:`, {
            x,
            y,
            width: tabsWidth,
            height: tabsHeight
          });
          console.log('==================================');
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.index === activeTab;
          // Get badge count for this tab
          let badgeCount = 0;
          if (badgeCounts) {
            switch(tab.index) {
              case 0: badgeCount = badgeCounts.connect || 0; break;
              case 1: badgeCount = badgeCounts.friendly || 0; break;
              case 2: badgeCount = badgeCounts.leagues || 0; break;
              case 3: badgeCount = badgeCounts.myGames || 0; break;
              case 4: badgeCount = badgeCounts.chat || 0; break;
            }
          }
          // console.log(`NavBar: Tab ${tab.index} (${tab.label}) isActive: ${isActive}`); // Commented out to reduce console spam
          return (
            <TouchableOpacity
              key={tab.index}
              style={styles.tab}
              onPress={() => handleTabPress(tab.index)}
              onPressIn={() => console.log(`Tab ${tab.index} pressed IN`)}
              onPressOut={() => console.log(`Tab ${tab.index} pressed OUT`)}
              activeOpacity={0.3}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.iconContainer}>
                {(() => {
                  const iconColor = isActive ? selectedColor : '#BABABA';
                  switch(tab.index) {
                    case 0: // Connect
                      return <NavBarConnectIcon width={24} height={24} fill={iconColor} />;
                    case 1: // Friendly
                      return <NavBarFriendlyIcon width={24} height={24} fill={iconColor} />;
                    case 2: // Leagues
                      return <NavBarLeagueIcon width={24} height={24} fill={iconColor} />;
                    case 3: // My Games
                      return <NavBarMyGamesIcon width={24} height={24} fill={iconColor} />;
                    case 4: // Chat
                      return <NavBarChatIcon width={24} height={24} fill={iconColor} />;
                    default:
                      return null;
                  }
                })()}
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? selectedColor : '#BABABA',
                    fontWeight: isActive ? '500' : '400'
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Home Indicator */}
      {/* <View style={styles.homeIndicator}>
        <View style={styles.homeIndicatorBar} />
      </View> */}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: width,
    height: 83,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -0.5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 8,
    zIndex: 9999,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 49,
    zIndex: 10000, // High z-index for tabs container
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 0,
    height: 49,
    position: 'relative',
    zIndex: 10000, // Ensure individual tabs are above everything
  },

  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },

  tabLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    letterSpacing: -0.24,
  },
  homeIndicator: {
    width: '100%',
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIndicatorBar: {
    width: 134,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 100,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
