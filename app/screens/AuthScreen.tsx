import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { account } from '../lib/appwrite';
import { ID } from '../lib/appwrite';

const { width, height } = Dimensions.get('window');

// ─── Theme ────────────────────────────────────────────────────────────────────

const C = {
  bg:        '#060E1E',
  bgCard:    '#0D1B30',
  border:    '#1A3050',
  borderGlow:'#4ECDC460',
  teal:      '#4ECDC4',
  tealDim:   '#4ECDC430',
  tealGlow:  '#4ECDC415',
  coral:     '#FF6B6B',
  amber:     '#FFA552',
  lavender:  '#A78BFA',
  textWhite: '#F0F8FF',
  textMid:   '#7A99B8',
  textDim:   '#2D4A6A',
};

// ─── Animated Orb ─────────────────────────────────────────────────────────────

function FloatingOrb({
  size,
  color,
  top,
  left,
  duration,
  delay,
}: {
  size: number;
  color: string;
  top: number;
  left: number;
  duration: number;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.8, 0.4],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

// ─── Pulse Ring ───────────────────────────────────────────────────────────────

function PulseRing({
  size,
  color,
  top,
  left,
  delay,
}: {
  size: number;
  color: string;
  top: number;
  left: number;
  delay: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.4,
            duration: 2800,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 2800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.1,
            duration: 2800,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 2800,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: top - size / 2,
        left: left - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// ─── Molecular Node ───────────────────────────────────────────────────────────

function MolecularNode({
  x, y, color,
}: {
  x: number;
  y: number;
  color: string;
}) {
  return (
    <>
      <View style={{
        position: 'absolute',
        top: y,
        left: x,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: color,
        opacity: 0.5,
      }} />
      <View style={{
        position: 'absolute',
        top: y + 3,
        left: x + 6,
        width: 28,
        height: 1,
        backgroundColor: color,
        opacity: 0.2,
      }} />
    </>
  );
}

// ─── Background Scene ─────────────────────────────────────────────────────────

function BackgroundScene() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Large glow orbs */}
      <FloatingOrb size={280} color={C.teal + '08'} top={-80} left={-60} duration={5000} delay={0} />
      <FloatingOrb size={200} color={C.lavender + '08'} top={height * 0.3} left={width * 0.6} duration={6500} delay={1200} />
      <FloatingOrb size={160} color={C.teal + '06'} top={height * 0.7} left={-40} duration={7000} delay={800} />

      {/* Pulse rings */}
      <PulseRing size={120} color={C.teal} top={height * 0.12} left={width * 0.8} delay={0} />
      <PulseRing size={80} color={C.lavender} top={height * 0.55} left={width * 0.1} delay={1500} />
      <PulseRing size={60} color={C.teal} top={height * 0.82} left={width * 0.75} delay={800} />

      {/* Molecular nodes */}
      <MolecularNode x={width * 0.7} y={height * 0.08} color={C.teal} />
      <MolecularNode x={width * 0.15} y={height * 0.18} color={C.lavender} />
      <MolecularNode x={width * 0.8} y={height * 0.45} color={C.amber} />
      <MolecularNode x={width * 0.05} y={height * 0.65} color={C.teal} />
      <MolecularNode x={width * 0.6} y={height * 0.78} color={C.lavender} />
      <MolecularNode x={width * 0.25} y={height * 0.88} color={C.coral} />

      {/* Fine dot grid — top right corner */}
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 6 }).map((_, col) => (
          <View
            key={`${row}-${col}`}
            style={{
              position: 'absolute',
              top: 60 + row * 22,
              left: width - 140 + col * 22,
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: C.teal,
              opacity: 0.15,
            }}
          />
        ))
      )}

      {/* Heartbeat line */}
      <View style={bgStyles.heartbeatWrap}>
        {[0, 4, 8, 2, 14, 28, 14, 2, 8, 4, 0, 4, 8, 2, 0].map((h, i) => (
          <View
            key={i}
            style={[
              bgStyles.heartbeatBar,
              { height: Math.max(2, h), opacity: h > 10 ? 0.5 : 0.15 },
            ]}
          />
        ))}
      </View>

      {/* Bottom gradient fade */}
      <View style={bgStyles.bottomFade} />
    </View>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={inputStyles.group}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={[
        inputStyles.inputWrap,
        focused && inputStyles.inputWrapFocused,
      ]}>
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textDim}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {focused && <View style={inputStyles.focusLine} />}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type AuthMode = 'login' | 'signup';

export default function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Title fade in
  const titleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 900,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const titleTranslateY = titleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  function validate(): boolean {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return false;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      Alert.alert('Passwords don\'t match', 'Please make sure both passwords match.');
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === 'signup') {
        await account.create(ID.unique(), email, password);
      }
      await account.createEmailPasswordSession({ email, password });
      onLogin();
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BackgroundScene />

      <View style={styles.inner}>
        {/* Logo + Title */}
        <Animated.View style={[
          styles.titleSection,
          { opacity: titleAnim, transform: [{ translateY: titleTranslateY }] },
        ]}>
          {/* Icon mark */}
          <View style={styles.logoMark}>
            <View style={styles.logoRing} />
            <View style={styles.logoRingInner} />
            <Text style={styles.logoPlus}>✦</Text>
          </View>

          <Text style={styles.titleTop}>SYMPTOM</Text>
          <View style={styles.titleAccentRow}>
            <View style={styles.titleLineLeft} />
            <Text style={styles.titleAccent}>◆</Text>
            <View style={styles.titleLineRight} />
          </View>
          <Text style={styles.titleBottom}>JOURNAL</Text>
          <Text style={styles.tagline}>Know your body. Find your patterns.</Text>
        </Animated.View>

        {/* Auth Card */}
        <Animated.View style={[
          styles.card,
          { opacity: cardAnim, transform: [{ translateY: cardTranslateY }] },
        ]}>
          {/* Mode tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                Sign in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                Create account
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardBody}>
            <InputField
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />

            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              secureTextEntry
            />

            {mode === 'signup' && (
              <InputField
                label="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your password"
                secureTextEntry
              />
            )}

            {mode === 'login' && (
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={C.bg} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {mode === 'login' ? 'Sign in' : 'Create account'}
                  </Text>
                  <Text style={styles.submitArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>🔒 End-to-end encrypted · Never sold</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const bgStyles = StyleSheet.create({
  heartbeatWrap: {
    position: 'absolute',
    bottom: height * 0.28,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  heartbeatBar: {
    width: 3,
    backgroundColor: C.teal,
    borderRadius: 2,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: C.bg,
    opacity: 0.6,
  },
});

const inputStyles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMid,
    marginBottom: 6,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  inputWrap: {
    backgroundColor: C.bgCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: 'hidden',
  },
  inputWrapFocused: {
    borderColor: C.teal + '80',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: C.textWhite,
  },
  focusLine: {
    height: 2,
    backgroundColor: C.teal,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 1,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  // Title
  titleSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoMark: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: C.teal + '50',
  },
  logoRingInner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.teal + '30',
    backgroundColor: C.teal + '08',
  },
  logoPlus: {
    fontSize: 18,
    color: C.teal,
  },
  titleTop: {
    fontSize: 42,
    fontWeight: '900',
    color: C.textWhite,
    letterSpacing: 10,
    textAlign: 'center',
  },
  titleAccentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 6,
  },
  titleLineLeft: {
    height: 1,
    width: 50,
    backgroundColor: C.teal,
    opacity: 0.5,
  },
  titleLineRight: {
    height: 1,
    width: 50,
    backgroundColor: C.teal,
    opacity: 0.5,
  },
  titleAccent: {
    fontSize: 10,
    color: C.teal,
    opacity: 0.8,
  },
  titleBottom: {
    fontSize: 42,
    fontWeight: '900',
    color: C.teal,
    letterSpacing: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    color: C.textDim,
    marginTop: 12,
    letterSpacing: 0.5,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: C.bgCard + 'EE',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  modeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modeTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: C.teal,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textDim,
    letterSpacing: 0.3,
  },
  modeTabTextActive: {
    color: C.teal,
  },
  cardBody: {
    padding: 22,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -6,
  },
  forgotText: {
    fontSize: 12,
    color: C.teal,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: C.teal,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: C.teal,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: C.bg,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  submitArrow: {
    color: C.bg,
    fontSize: 16,
    fontWeight: '800',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: C.textDim,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});