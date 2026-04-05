import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { getStreak, recordLog, StreakData } from '../lib/storage';
import { saveEntry } from '../lib/db';

const { width } = Dimensions.get('window');

// ─── Theme ────────────────────────────────────────────────────────────────────

const C = {
  bg:        '#060E1E',
  bgCard:    '#0D1B30',
  bgCardAlt: '#0A1525',
  border:    '#1A3050',
  navy:      '#1E3A5F',
  teal:      '#4ECDC4',
  coral:     '#FF6B6B',
  amber:     '#FFA552',
  mint:      '#6BCB77',
  lavender:  '#A78BFA',
  textWhite: '#F0F8FF',
  textMid:   '#7A99B8',
  textDim:   '#2D4A6A',
};

const METRICS = {
  pain:         { color: C.coral,    bg: '#FF6B6B12', label: 'PAIN LEVEL',    emoji: '🤕', low: 'None',    high: 'Severe'  },
  energy:       { color: C.amber,    bg: '#FFA55212', label: 'ENERGY LEVEL',  emoji: '⚡', low: 'Drained', high: 'Wired'   },
  mood:         { color: C.mint,     bg: '#6BCB7712', label: 'MOOD',          emoji: '😊', low: 'Low',     high: 'Great'   },
  sleepHrs:     { color: C.teal,     bg: '#4ECDC412', label: 'HOURS SLEPT',   emoji: '🕐', low: '0h',      high: '12h'     },
  sleepQuality: { color: C.lavender, bg: '#A78BFA12', label: 'SLEEP QUALITY', emoji: '✨', low: 'Poor',    high: 'Perfect' },
};

interface LogEntry {
  pain: number;
  energy: number;
  mood: number;
  sleepHrs: number;
  sleepQuality: number;
  notes: string;
  medications: string[];
  foodTags: string[];
}

// ─── Animated Pulse Ring ──────────────────────────────────────────────────────

function PulseRing({ size, color, style }: { size: number; color: string; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.35, duration: 3000, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 3000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.08, duration: 3000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 3000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: color,
        opacity,
        transform: [{ scale }],
      }, style]}
    />
  );
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────

function HeroBanner({ streak }: { streak: StreakData }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'GOOD MORNING' :
    hour < 17 ? 'GOOD AFTERNOON' :
    'GOOD EVENING';

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={heroStyles.outer}>
      {/* Decorative background elements */}
      <View style={heroStyles.decorLayer} pointerEvents="none">
        <PulseRing size={140} color={C.teal} style={heroStyles.ring1} />
        <PulseRing size={80} color={C.lavender} style={heroStyles.ring2} />

        {/* Molecular dots */}
        {[
          { top: 12, left: width * 0.6, color: C.teal },
          { top: 40, left: width * 0.72, color: C.lavender },
          { top: 70, left: width * 0.58, color: C.amber },
          { top: 20, left: width * 0.85, color: C.teal },
        ].map((dot, i) => (
          <View key={i} style={{
            position: 'absolute',
            top: dot.top,
            left: dot.left - 20,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: dot.color,
            opacity: 0.4,
          }} />
        ))}

        {/* Dot grid */}
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 4 }).map((_, col) => (
            <View key={`${row}-${col}`} style={{
              position: 'absolute',
              top: 8 + row * 18,
              right: 16 + col * 18,
              width: 2,
              height: 2,
              borderRadius: 1,
              backgroundColor: C.teal,
              opacity: 0.12,
            }} />
          ))
        )}

        {/* Heartbeat bars */}
        <View style={heroStyles.hbWrap}>
          {[0, 3, 6, 2, 12, 24, 12, 2, 6, 3, 0, 3, 6, 2, 0].map((h, i) => (
            <View key={i} style={[heroStyles.hbBar, {
              height: Math.max(2, h),
              opacity: h > 8 ? 0.6 : 0.15,
            }]} />
          ))}
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[heroStyles.content, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        {/* Date pill */}
        <View style={heroStyles.datePill}>
          <Text style={heroStyles.datePillText}>{dateStr}</Text>
        </View>

        {/* Greeting */}
        <Text style={heroStyles.greeting}>{greeting}</Text>
        <View style={heroStyles.accentRow}>
          <View style={heroStyles.accentLine} />
          <Text style={heroStyles.accentDiamond}>◆</Text>
          <View style={heroStyles.accentLine} />
        </View>
        <Text style={heroStyles.subGreeting}>Take 60 seconds to check in.</Text>

        {/* Stats */}
        <View style={heroStyles.statsBar}>
          <View style={heroStyles.statItem}>
            <Text style={[heroStyles.statNum, { color: C.teal }]}>{streak.currentStreak}</Text>
            <Text style={heroStyles.statLabel}>DAY STREAK</Text>
          </View>
          <View style={heroStyles.statSep} />
          <View style={heroStyles.statItem}>
            <Text style={[heroStyles.statNum, { color: C.amber }]}>{streak.longestStreak}</Text>
            <Text style={heroStyles.statLabel}>BEST</Text>
          </View>
          <View style={heroStyles.statSep} />
          <View style={heroStyles.statItem}>
            <Text style={[heroStyles.statNum, { color: C.lavender }]}>
              {streak.currentStreak >= 7 ? '✓' : `${Math.max(7 - streak.currentStreak, 0)}`}
            </Text>
            <Text style={heroStyles.statLabel}>
              {streak.currentStreak >= 7 ? 'INSIGHTS ON' : 'TO INSIGHTS'}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function Section({ emoji, title, subtitle }: {
  emoji: string; title: string; subtitle?: string;
}) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionIconBox}>
        <Text style={styles.sectionIcon}>{emoji}</Text>
      </View>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
      </View>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ─── Metric Slider ────────────────────────────────────────────────────────────

function MetricSlider({
  metricKey, value, onChange, min = 0, max = 10,
}: {
  metricKey: keyof typeof METRICS;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const m = METRICS[metricKey];
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <View style={[styles.metricCard, { borderLeftColor: m.color }]}>
      <View style={styles.metricTop}>
        <View style={[styles.metricLabelPill, { backgroundColor: m.bg }]}>
          <Text style={styles.metricEmoji}>{m.emoji}</Text>
          <Text style={[styles.metricLabel, { color: m.color }]}>{m.label}</Text>
        </View>
        <View style={[styles.metricValueBox, { backgroundColor: m.color }]}>
          <Text style={styles.metricValueNum}>{value}</Text>
          <Text style={styles.metricValueMax}>/{max}</Text>
        </View>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={m.color}
        maximumTrackTintColor={C.border}
        thumbTintColor={m.color}
      />

      <View style={styles.metricFooter}>
        <Text style={styles.metricFooterText}>{m.low}</Text>
        <View style={styles.metricTrack}>
          <View style={[styles.metricFill, { width: `${pct}%`, backgroundColor: m.color + '40' }]} />
        </View>
        <Text style={styles.metricFooterText}>{m.high}</Text>
      </View>
    </View>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ tags, onAdd, onRemove, placeholder, color }: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  color: string;
}) {
  const [input, setInput] = useState('');

  function handleAdd() {
    const t = input.trim();
    if (!t || tags.includes(t)) return;
    onAdd(t);
    setInput('');
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.tagRow}>
        <TextInput
          style={styles.tagInput}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor={C.textDim}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.tagAddBtn, { backgroundColor: color + '20', borderColor: color + '50' }]}
          onPress={handleAdd}
        >
          <Text style={[styles.tagAddText, { color }]}>＋</Text>
        </TouchableOpacity>
      </View>
      {tags.length > 0 && (
        <View style={styles.tagPills}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagPill, { borderColor: color + '50', backgroundColor: color + '12' }]}
              onPress={() => onRemove(tag)}
            >
              <Text style={[styles.tagPillText, { color }]}>{tag}</Text>
              <Text style={[styles.tagX, { color: color + '80' }]}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LogScreen() {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0, lastLoggedDate: null, longestStreak: 0,
  });

  const [entry, setEntry] = useState<LogEntry>({
    pain: 0, energy: 5, mood: 5,
    sleepHrs: 7, sleepQuality: 5,
    notes: '', medications: [], foodTags: [],
  });

  useEffect(() => { getStreak().then(setStreak); }, []);

  function update<K extends keyof LogEntry>(key: K, value: LogEntry[K]) {
    setEntry((prev) => ({ ...prev, [key]: value }));
  }

  function addTag(key: 'medications' | 'foodTags', tag: string) {
    update(key, [...entry[key], tag]);
  }

  function removeTag(key: 'medications' | 'foodTags', tag: string) {
    update(key, entry[key].filter((t) => t !== tag));
  }

  async function handleSubmit() {
    try {
      await saveEntry(entry);
      const updated = await recordLog();
      setStreak(updated);
      if (updated.currentStreak > 1) {
        Alert.alert(
          `${updated.currentStreak} day streak! 🔥`,
          updated.currentStreak === 7
            ? 'One week logged. AI insights are ready!'
            : "You're on a roll. Keep it up.",
          [{ text: "Let's go" }]
        );
      } else {
        Alert.alert('Logged ✓', 'Entry saved for today.', [{ text: 'OK' }]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Could not save entry.');
    }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <HeroBanner streak={streak} />

      {/* Symptoms */}
      <Section emoji="🩺" title="SYMPTOMS" subtitle="Drag to rate 0 – 10" />
      <MetricSlider metricKey="pain" value={entry.pain} onChange={(v) => update('pain', v)} />
      <MetricSlider metricKey="energy" value={entry.energy} onChange={(v) => update('energy', v)} />
      <MetricSlider metricKey="mood" value={entry.mood} onChange={(v) => update('mood', v)} />

      {/* Sleep */}
      <Section emoji="🌙" title="SLEEP" subtitle="How'd you sleep last night?" />
      <MetricSlider metricKey="sleepHrs" value={entry.sleepHrs} onChange={(v) => update('sleepHrs', v)} min={0} max={12} />
      <MetricSlider metricKey="sleepQuality" value={entry.sleepQuality} onChange={(v) => update('sleepQuality', v)} />

      {/* Medications */}
      <Section emoji="💊" title="MEDICATIONS" subtitle="What did you take today?" />
      <View style={styles.inputCard}>
        <TagInput
          tags={entry.medications}
          onAdd={(t) => addTag('medications', t)}
          onRemove={(t) => removeTag('medications', t)}
          placeholder="Type a medication and tap ＋"
          color={C.lavender}
        />
      </View>

      {/* Food */}
      <Section emoji="🍽️" title="FOOD & DRINK" subtitle="Anything that might matter" />
      <View style={styles.inputCard}>
        <TagInput
          tags={entry.foodTags}
          onAdd={(t) => addTag('foodTags', t)}
          onRemove={(t) => removeTag('foodTags', t)}
          placeholder="e.g. coffee, alcohol, gluten..."
          color={C.teal}
        />
      </View>

      {/* Notes */}
      <Section emoji="📓" title="JOURNAL" subtitle="Anything on your mind?" />
      <TextInput
        style={styles.notes}
        value={entry.notes}
        onChangeText={(v) => update('notes', v)}
        placeholder="How are you feeling? What happened today?"
        placeholderTextColor={C.textDim}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      {/* CTA */}
      <TouchableOpacity style={styles.cta} onPress={handleSubmit} activeOpacity={0.85}>
        <View style={styles.ctaInner}>
          <Text style={styles.ctaText}>SAVE TODAY'S ENTRY</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </View>
        <View style={styles.ctaGlow} />
      </TouchableOpacity>

      <Text style={styles.ctaNote}>◆ Private & encrypted ◆</Text>
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const heroStyles = StyleSheet.create({
  outer: {
    backgroundColor: '#0D1B30',
    borderRadius: 24,
    marginBottom: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    position: 'relative',
  },
  decorLayer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  ring1: {
    position: 'absolute',
    top: -40,
    right: -40,
  },
  ring2: {
    position: 'absolute',
    top: 30,
    right: 20,
  },
  hbWrap: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  hbBar: {
    width: 3,
    backgroundColor: C.teal,
    borderRadius: 2,
  },
  content: {
    padding: 22,
    paddingBottom: 20,
  },
  datePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(78,205,196,0.08)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.teal + '30',
    marginBottom: 14,
  },
  datePillText: {
    color: C.teal,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '900',
    color: C.textWhite,
    letterSpacing: 5,
    lineHeight: 34,
  },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  accentLine: {
    height: 1,
    width: 30,
    backgroundColor: C.teal,
    opacity: 0.5,
  },
  accentDiamond: {
    fontSize: 8,
    color: C.teal,
    opacity: 0.8,
  },
  subGreeting: {
    fontSize: 13,
    color: C.textDim,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 1,
  },
  statSep: {
    width: 1,
    height: 30,
    backgroundColor: C.border,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Section
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionIcon: { fontSize: 15 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: C.textWhite,
    letterSpacing: 3,
  },
  sectionSub: {
    fontSize: 11,
    color: C.textDim,
    marginTop: 1,
    fontWeight: '500',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
    marginLeft: 8,
  },

  // Metric card
  metricCard: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metricEmoji: { fontSize: 13 },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  metricValueBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 1,
  },
  metricValueNum: {
    fontSize: 17,
    fontWeight: '900',
    color: '#fff',
  },
  metricValueMax: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 36,
  },
  metricFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -4,
  },
  metricFooterText: {
    fontSize: 10,
    color: C.textDim,
    fontWeight: '600',
    letterSpacing: 0.3,
    width: 42,
  },
  metricTrack: {
    flex: 1,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Tag input
  tagRow: { flexDirection: 'row', gap: 8 },
  tagInput: {
    flex: 1,
    backgroundColor: C.bgCardAlt,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: C.textWhite,
  },
  tagAddBtn: {
    width: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  tagAddText: { fontSize: 20, fontWeight: '300' },
  tagPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagPillText: { fontSize: 13, fontWeight: '600' },
  tagX: { fontSize: 9, fontWeight: '700' },

  // Input card
  inputCard: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },

  // Notes
  notes: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: C.textWhite,
    minHeight: 120,
    lineHeight: 22,
    borderWidth: 1.5,
    borderColor: C.border,
  },

  // CTA
  cta: {
    borderRadius: 18,
    marginTop: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  ctaInner: {
    backgroundColor: C.teal,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaGlow: {
    position: 'absolute',
    bottom: -8,
    left: '20%',
    right: '20%',
    height: 20,
    backgroundColor: C.teal,
    opacity: 0.25,
    borderRadius: 10,
    filter: undefined,
  },
  ctaText: {
    color: C.bg,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  ctaArrow: {
    color: C.bg,
    fontSize: 18,
    fontWeight: '800',
  },
  ctaNote: {
    textAlign: 'center',
    fontSize: 11,
    color: C.textDim,
    marginTop: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
});