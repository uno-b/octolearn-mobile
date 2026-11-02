import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StateView } from '@/components/StateView';
import { mn } from '@/i18n/mn';
import { colors } from '@/theme';

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StateView
        kind="empty"
        title={mn.common.notFound}
        actionLabel={mn.common.goHome}
        onAction={() => router.replace('/')}
      />
    </SafeAreaView>
  );
}
