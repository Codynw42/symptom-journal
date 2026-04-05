import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { getStreak, recordLog, StreakData } from '../lib/storage';

// ─── Theme ────────────────────────────────────────────────────────────────────

const C = {
  bg:         '#0A1628',
  bgCard:     '#111F35',
  bgCardAlt:  '#0F1A2E',
  border:     '#1E3352',
  navy:       '#1E3A5F',
  teal:       '#4ECDC4',
  coral:      '#FF6B6B',
  amber:      '#FFA552',
  mint:       '#6BCB77',
  lavender:   '#A78BFA',
  textWhite:  '#F0F8FF',
  textMid:    '#7A99B8',
  textDim:    '#3D5A7A',
  glow:       '#4ECDC420',
};

// ─── Metric config ────────────────────────────────────────────────────────────

const METRICS = {
  pain:         { color: C.coral,    bg: '#FF6B6B15', label: 'Pain level',    emoji: '🤕', low: 'None', high: 'Severe' },
  energy:       { color: C.amber,    bg: '#FFA55215', label: 'Energy level',  emoji: '⚡', low: 'Drained', high: 'Wired' },
  mood:         { color: C.mint,     bg: '#6BCB7715', label: 'Mood',          emoji: '😊', low: 'Low', high: 'Great' },
  sleepHrs:     { color: C.teal,     bg: '#4ECDC415', label: 'Hours slept',   emoji: '🕐', low: '0h', high: '12h' },
  sleepQuality: { color: C.lavender, bg: '#A78BFA15', label: 'Sleep quality', emoji: '✨', low: 'Poor', high: 'Perfect' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Hero Banner ──────────────────────────────────────────────────────────────

function HeroBanner({ streak }: { streak: StreakData }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening';

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const wellnessMessages = [
    'Take 60 seconds to check in.',
    'Your body is worth listening to.',
    'Patterns emerge from consistency.',
    'Small data, big insights.',
    'Another day, another data point.',
  ];
  const msg = wellnessMessages[new Date().getDay() % wellnessMessages.length];

  return (
    <View style={heroStyles.outer}>
      {/* Decorative background blobs */}
      <View style={heroStyles.blob1} />
      <View style={heroStyles.blob2} />
      <View style={heroStyles.blob3} />
      <View style={heroStyles.blobRing} />

      {/* Content */}
      <View style={heroStyles.inner}>
        <View style={heroStyles.topRow}>
          <View style={heroStyles.datePill}>
            <Text style={heroStyles.datePillText}>{dateStr}</Text>
          </View>
          {streak.currentStreak > 0 && (
            <View style={heroStyles.streakPill}>
              <Text style={heroStyles.streakPillText}>
                🔥 {streak.currentStreak}
              </Text>
            </View>
          )}
        </View>

        <Text style={heroStyles.greeting}>{greeting}</Text>
        <Text style={heroStyles.msg}>{msg}</Text>

        {/* Stats row */}
        <View style={heroStyles.statsRow}>
          <View style={heroStyles.stat}>
            <Text style={[heroStyles.statNum, { color: C.teal }]}>
              {streak.currentStreak}
            </Text>
            <Text style={heroStyles.statLabel}>day streak</Text>
          </View>
          <View style={heroStyles.statDivider} />
          <View style={heroStyles.stat}>
            <Text style={[heroStyles.statNum, { color: C.amber }]}>
              {streak.longestStreak}
            </Text>
            <Text style={heroStyles.statLabel}>personal best</Text>
          </View>
          <View style={heroStyles.statDivider} />
          <View style={heroStyles.stat}>
            <Text style={[heroStyles.statNum, { color: C.lavender }]}>7</Text>
            <Text style={heroStyles.statLabel}>days to insight</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function Section({ emoji, title, subtitle }: {
  emoji: string;
  title: string;
  subtitle?: string;
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
    </View>
  );
}

// ─── Metric Slider ────────────────────────────────────────────────────────────

function MetricSlider({
  metricKey,
  value,
  onChange,
  min = 0,
  max = 10,
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
        <View style={[styles.metricPill, { backgroundColor: m.bg }]}>
          <Text style={styles.metricEmoji}>{m.emoji}</Text>
          <Text style={[styles.metricLabel, { color: m.color }]}>{m.label}</Text>
        </View>
        <View style={[styles.metricBadge, { backgroundColor: m.color }]}>
          <Text style={styles.metricBadgeNum}>{value}</Text>
          <Text style={styles.metricBadgeMax}>/{max}</Text>
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
        <Text style={styles.metricFooterLabel}>{m.low}</Text>
        <View style={styles.metricTrack}>
          <View style={[styles.metricFill, {
            width: `${pct}%`,
            backgroundColor: m.color + '40',
          }]} />
        </View>
        <Text style={styles.metricFooterLabel}>{m.high}</Text>
      </View>
    </View>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({
  tags, onAdd, onRemove, placeholder, color,
}: {
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
          style={[styles.tagAddBtn, { backgroundColor: color + '25', borderColor: color + '60' }]}
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
              style={[styles.tagPill, { borderColor: color + '50', backgroundColor: color + '15' }]}
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
    currentStreak: 0,
    lastLoggedDate: null,
    longestStreak: 0,
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
    const updated = await recordLog();
    setStreak(updated);
    if (updated.currentStreak > 1) {
      Alert.alert(
        `${updated.currentStreak} day streak! 🔥`,
        updated.currentStreak === 7
          ? 'One week logged. Your first AI insights are ready!'
          : "You're on a roll. Keep it up.",
        [{ text: "Let's go" }]
      );
    } else {
      Alert.alert('Logged ✓', 'Entry saved for today.', [{ text: 'OK' }]);
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
      <Section emoji="🩺" title="Symptoms" subtitle="Drag to rate 0 – 10" />
      <MetricSlider metricKey="pain" value={entry.pain} onChange={(v) => update('pain', v)} />
      <MetricSlider metricKey="energy" value={entry.energy} onChange={(v) => update('energy', v)} />
      <MetricSlider metricKey="mood" value={entry.mood} onChange={(v) => update('mood', v)} />

      {/* Sleep */}
      <Section emoji="🌙" title="Sleep" subtitle="How'd you sleep last night?" />
      <MetricSlider metricKey="sleepHrs" value={entry.sleepHrs} onChange={(v) => update('sleepHrs', v)} min={0} max={12} />
      <MetricSlider metricKey="sleepQuality" value={entry.sleepQuality} onChange={(v) => update('sleepQuality', v)} />

      {/* Medications */}
      <Section emoji="💊" title="Medications" subtitle="What did you take today?" />
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
      <Section emoji="🍽️" title="Food & drink" subtitle="Anything that might matter" />
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
      <Section emoji="📓" title="Journal" subtitle="Anything on your mind?" />
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
        <Text style={styles.ctaText}>Save today's entry</Text>
        <Text style={styles.ctaArrow}>→</Text>
      </TouchableOpacity>

      <Text style={styles.ctaNote}>🔒 Private & encrypted</Text>
      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const heroStyles = StyleSheet.create({
  outer: {
    backgroundColor: C.navy,
    borderRadius: 24,
    marginBottom: 6,
    overflow: 'hidden',
    position: 'relative',
  },

  // Decorative blobs
  blob1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: C.teal,
    opacity: 0.08,
    top: -60,
    right: -40,
  },
  blob2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.lavender,
    opacity: 0.1,
    top: 20,
    right: 60,
  },
  blob3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.amber,
    opacity: 0.07,
    bottom: 20,
    right: 20,
  },
  blobRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: C.teal,
    opacity: 0.1,
    top: -30,
    right: 10,
  },

  inner: {
    padding: 22,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  datePillText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  streakPill: {
    backgroundColor: C.amber + '25',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.amber + '50',
  },
  streakPillText: {
    color: C.amber,
    fontSize: 12,
    fontWeight: '800',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 36,
  },
  msg: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionIcon: { fontSize: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textWhite,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 11,
    color: C.textDim,
    marginTop: 1,
    fontWeight: '500',
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
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metricEmoji: { fontSize: 13 },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 1,
  },
  metricBadgeNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
  },
  metricBadgeMax: {
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
  metricFooterLabel: {
    fontSize: 10,
    color: C.textDim,
    fontWeight: '500',
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
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
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
  tagAddText: {
    fontSize: 20,
    fontWeight: '300',
  },
  tagPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagX: {
    fontSize: 9,
    fontWeight: '700',
  },

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
    backgroundColor: C.teal,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    gap: 10,
    shadowColor: C.teal,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ctaText: {
    color: C.bg,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  ctaArrow: {
    color: C.bg,
    fontSize: 18,
    fontWeight: '800',
  },
  ctaNote: {
    textAlign: 'center',
    fontSize: 12,
    color: C.textDim,
    marginTop: 12,
    fontWeight: '500',
  },
});