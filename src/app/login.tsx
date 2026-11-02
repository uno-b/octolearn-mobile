import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { content } from '@/content';
import { mn } from '@/i18n/mn';
import { useProgressStore } from '@/store/progressStore';
import { colors, fonts, radius, size, space, type } from '@/theme';

const LOGO_SIZE = 112;
const LOGO_IMAGE_SIZE = 88;
const LOGO_BOB = 6;
const LOGO_BOB_MS = 1200;
const NAME_MAX_LENGTH = 20;
const INPUT_BORDER = 2;

const logo = require('@/assets/images/splash-icon.png');

export default function LoginScreen() {
  const signIn = useProgressStore((s) => s.signIn);
  const [name, setName] = useState(content.user.name);
  const [focused, setFocused] = useState(false);
  const canStart = name.trim().length > 0;

  const submit = () => {
    if (canStart) signIn(name);
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Logo />
          <View style={styles.wordmark}>
            <AppText variant="display" color={colors.coralText}>
              {mn.login.brandFirst}
            </AppText>
            <AppText variant="display" color={colors.primaryDark}>
              {mn.login.brandSecond}
            </AppText>
          </View>
          <AppText color={colors.textSec} align="center">
            {mn.login.tagline}
          </AppText>
          <View style={styles.form}>
            <AppText variant="label">{mn.login.nameLabel}</AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={submit}
              placeholder={mn.login.namePlaceholder}
              placeholderTextColor={colors.textMuted}
              maxLength={NAME_MAX_LENGTH}
              maxFontSizeMultiplier={1.3}
              returnKeyType="go"
              autoCorrect={false}
              accessibilityLabel={mn.login.nameLabel}
              style={[
                styles.input,
                { borderColor: focused ? colors.primary : colors.borderStrong },
              ]}
            />
            <Button label={mn.login.start} onPress={submit} disabled={!canStart} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Logo() {
  const reduceMotion = useReducedMotion();
  const bob = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    bob.set(withRepeat(withTiming(-LOGO_BOB, { duration: LOGO_BOB_MS }), -1, true));
  }, [bob, reduceMotion]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.get() }] }));

  return (
    <Animated.View style={[styles.logo, style]}>
      <Image source={logo} style={styles.logoImage} contentFit="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTint,
  },
  logoImage: { width: LOGO_IMAGE_SIZE, height: LOGO_IMAGE_SIZE },
  wordmark: { flexDirection: 'row' },
  form: { alignSelf: 'stretch', gap: space.sm, marginTop: space.xl },
  input: {
    ...type.headline,
    fontFamily: fonts.semibold,
    height: size.btn,
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
    borderWidth: INPUT_BORDER,
    borderRadius: radius.btn,
    color: colors.text,
    backgroundColor: colors.surface,
  },
});
