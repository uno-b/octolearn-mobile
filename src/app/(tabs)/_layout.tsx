import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/Icon';
import { mn } from '@/i18n/mn';
import { colors, fonts } from '@/theme';

const ACTIVE_TINT = colors.primaryDark;
const INACTIVE_TINT = colors.lockedIcon;
const TAB_LABEL_SIZE = 12;

function tabIcon(active: IconName, inactive: IconName) {
  return function TabIcon({ focused, size }: { focused: boolean; size: number }) {
    return (
      <Icon
        name={focused ? active : inactive}
        color={focused ? ACTIVE_TINT : INACTIVE_TINT}
        size={size}
      />
    );
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // The bar has a fixed height, so scaled labels would be clipped.
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: TAB_LABEL_SIZE },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: mn.tabs.home, tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: mn.tabs.profile,
          tabBarIcon: tabIcon('person-circle', 'person-circle-outline'),
        }}
      />
    </Tabs>
  );
}
