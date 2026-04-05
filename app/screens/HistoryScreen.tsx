import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { fetchEntries } from '../lib/db';

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Entry {
  id: string;
  date: string;
  pain: number;
  energy: number;
  mood: number;
  sleepHrs: number;
  sleepQuality: number;
  notes: string;
  medications: string[];
  foodTags: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wellnessScore(entry: Entry): number {
  return Math.round(((10 - entry.pain) + entry.energy + entry.mood) / 3);
}

function scoreToColor(score: number): string {
  if (score >= 8) return C.mint;
  if (score >= 6) return C.teal;
  if (score >= 4) return C.amber;
  if (score >= 2) return C.coral;
  return '#F44336';
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function getLastNDays(n: number): string[] {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

// ─── Pulse Ring ───────────────────────────────────────────────────────────────

function PulseRing({ size, color, style }: { size: number; color: string; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.3, duration: 3500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 3500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.06, duration: 3500, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 3500, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[{
      width: size, height: size,
      borderRadius: size / 2,
      borderWidth: 1,
      borderColor: color,
      opacity,
      transform: [{ scale }],
    }, style]} />
  );
}

// ─── Screen Header ────────────────────────────────────────────────────────────

function ScreenHeader({ totalLogged, avgWellness }: {
  totalLogged: number;
  avgWellness: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={headerStyles.outer}>
      {/* Decorative elements */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <PulseRing size={120} color={C.teal} style={headerStyles.ring1} />
        <PulseRing size={70} color={C.lavender} style={headerStyles.ring2} />

        {/* Dot grid */}
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => (
            <View key={`${row}-${col}`} style={{
              position: 'absolute',
              top: 10 + row * 18,
              right: 14 + col * 18,
              width: 2, height: 2,
              borderRadius: 1,
              backgroundColor: C.teal,
              opacity: 0.12,
            }} />
          ))
        )}

        {/* Molecular nodes */}
        {[
          { top: 18, left: width * 0.55, color: C.amber },
          { top: 44, left: width * 0.65, color: C.teal },
          { top: 28, left: width * 0.48, color: C.lavender },
        ].map((d, i) => (
          <View key={i} style={{
            position: 'absolute',
            top: d.top, left: d.left - 20,
            width: 5, height: 5,
            borderRadius: 2.5,
            backgroundColor: d.color,
            opacity: 0.35,
          }} />
        ))}

        {/* Heartbeat */}
        <View style={headerStyles.hbWrap}>
          {[0, 3, 7, 2, 18, 32, 18, 2, 7, 3, 0, 3, 0].map((h, i) => (
            <View key={i} style={[headerStyles.hbBar, {
              height: Math.max(2, h),
              opacity: h > 10 ? 0.55 : 0.12,
            }]} />
          ))}
        </View>
      </View>

      {/* Content */}
      <Animated.View style={[headerStyles.content, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <View style={headerStyles.labelRow}>
          <View style={headerStyles.labelPill}>
            <Text style={headerStyles.labelText}>YOUR HISTORY</Text>
          </View>
        </View>

        <Text style={headerStyles.title}>HEALTH{'\n'}TIMELINE</Text>

        <View style={headerStyles.accentRow}>
          <View style={headerStyles.accentLine} />
          <Text style={headerStyles.accentDiamond}>◆</Text>
          <View style={headerStyles.accentLine} />
        </View>

        {/* Quick stats */}
        <View style={headerStyles.statsRow}>
          <View style={headerStyles.statItem}>
            <Text style={[headerStyles.statNum, { color: C.teal }]}>{totalLogged}</Text>
            <Text style={headerStyles.statLabel}>ENTRIES LOGGED</Text>
          </View>
          <View style={headerStyles.statSep} />
          <View style={headerStyles.statItem}>
            <Text style={[headerStyles.statNum, { color: scoreToColor(avgWellness) }]}>
              {avgWellness}/10
            </Text>
            <Text style={headerStyles.statLabel}>AVG WELLNESS</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Calendar Heatmap ─────────────────────────────────────────────────────────

function CalendarHeatmap({ entries }: { entries: Entry[] }) {
  const entryMap = Object.fromEntries(entries.map((e) => [e.date, e]));
  const days = getLastNDays(35);
  const weeks: (Entry | null)[][] = [];

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7).map((d) => entryMap[d] ?? null));
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={heatStyles.card}>
      <View style={heatStyles.titleRow}>
        <Text style={heatStyles.title}>5-WEEK OVERVIEW</Text>
        <View style={heatStyles.titleLine} />
      </View>

      <View style={heatStyles.row}>
        {dayLabels.map((d, i) => (
          <Text key={i} style={heatStyles.dayLabel}>{d}</Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={heatStyles.row}>
          {week.map((entry, di) => {
            const score = entry ? wellnessScore(entry) : null;
            const color = score !== null ? scoreToColor(score) : null;
            return (
              <View key={di} style={[
                heatStyles.cell,
                {
                  backgroundColor: color ? color + '25' : C.bgCardAlt,
                  borderColor: color ? color + '50' : C.border,
                },
              ]}>
                {color && <View style={[heatStyles.cellDot, { backgroundColor: color }]} />}
              </View>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={heatStyles.legendRow}>
        <Text style={heatStyles.legendLabel}>WORSE</Text>
        {['#F44336', C.coral, C.amber, C.teal, C.mint].map((c) => (
          <View key={c} style={[heatStyles.legendCell, {
            backgroundColor: c + '50',
            borderColor: c + '80',
          }]} />
        ))}
        <Text style={heatStyles.legendLabel}>BETTER</Text>
      </View>
    </View>
  );
}

// ─── Entry Card ───────────────────────────────────────────────────────────────

function EntryCard({ entry, index }: { entry: Entry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const score = wellnessScore(entry);
  const color = scoreToColor(score);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={[styles.cardBar, { backgroundColor: color }]} />
        <View style={styles.cardInner}>
          {/* Header */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.scoreBadge, {
                backgroundColor: color + '20',
                borderColor: color + '60',
              }]}>
                <Text style={[styles.scoreNum, { color }]}>{score}</Text>
              </View>
              <View>
                <Text style={styles.cardDate}>{formatDisplayDate(entry.date)}</Text>
                <Text style={styles.cardScoreLabel}>WELLNESS {score}/10</Text>
              </View>
            </View>
            <View style={[styles.expandBtn, expanded && { borderColor: C.teal + '60' }]}>
              <Text style={[styles.expandBtnText, expanded && { color: C.teal }]}>
                {expanded ? '▲' : '▼'}
              </Text>
            </View>
          </View>

          {/* Metric pills */}
          <View style={styles.metricPills}>
            {[
              { emoji: '🤕', val: entry.pain, color: C.coral },
              { emoji: '⚡', val: entry.energy, color: C.amber },
              { emoji: '😊', val: entry.mood, color: C.mint },
              { emoji: '😴', val: entry.sleepHrs, color: C.teal, suffix: 'h' },
            ].map((m, i) => (
              <View key={i} style={[styles.metricPill, { backgroundColor: m.color + '18' }]}>
                <Text style={styles.metricPillEmoji}>{m.emoji}</Text>
                <Text style={[styles.metricPillVal, { color: m.color }]}>
                  {m.val}{m.suffix ?? ''}
                </Text>
              </View>
            ))}
          </View>

          {/* Expanded detail */}
          {expanded && (
            <View style={styles.detail}>
              <View style={styles.detailDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>SLEEP QUALITY</Text>
                <Text style={styles.detailValue}>{entry.sleepQuality}/10</Text>
              </View>

              {entry.medications.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>MEDICATIONS</Text>
                  <Text style={styles.detailValue}>{entry.medications.join(', ')}</Text>
                </View>
              )}

              {entry.foodTags.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>FOOD & DRINK</Text>
                  <Text style={styles.detailValue}>{entry.foodTags.join(', ')}</Text>
                </View>
              )}

              {entry.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesIcon}>◆</Text>
                  <Text style={styles.notesText}>{entry.notes}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📅</Text>
      <Text style={styles.emptyTitle}>NO ENTRIES YET</Text>
      <View style={styles.emptyAccentRow}>
        <View style={styles.emptyLine} />
        <Text style={styles.emptyDiamond}>◆</Text>
        <View style={styles.emptyLine} />
      </View>
      <Text style={styles.emptySub}>
        Head to the Log tab and save your first entry. It'll show up here.
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadEntries() {
    try {
      const data = await fetchEntries();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadEntries(); }, []);

  const totalLogged = entries.length;
  const avgWellness = entries.length
    ? Math.round(entries.reduce((sum, e) => sum + wellnessScore(e), 0) / entries.length)
    : 0;

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color={C.teal} size="large" />
        <Text style={styles.loadingText}>LOADING HISTORY</Text>
        <Text style={styles.loadingDots}>◆ ◆ ◆</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadEntries(); }}
          tintColor={C.teal}
        />
      }
    >
      <ScreenHeader totalLogged={totalLogged} avgWellness={avgWellness} />

      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <CalendarHeatmap entries={entries} />

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>PAST ENTRIES</Text>
            <View style={styles.sectionLine} />
            <Text style={styles.sectionCount}>{entries.length}</Text>
          </View>
          <Text style={styles.sectionSub}>Pull down to refresh · Tap to expand</Text>

          {entries.map((entry, index) => (
            <EntryCard key={entry.id} entry={entry} index={index} />
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const headerStyles = StyleSheet.create({
  outer: {
    backgroundColor: C.bgCard,
    borderRadius: 24,
    marginBottom: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    position: 'relative',
  },
  ring1: { position: 'absolute', top: -30, right: -30 },
  ring2: { position: 'absolute', top: 20, right: 20 },
  hbWrap: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  hbBar: { width: 3, backgroundColor: C.teal, borderRadius: 2 },
  content: { padding: 22, paddingBottom: 20 },
  labelRow: { marginBottom: 12 },
  labelPill: {
    alignSelf: 'flex-start',
    backgroundColor: C.teal + '12',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.teal + '30',
  },
  labelText: {
    color: C.teal,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: C.textWhite,
    letterSpacing: 4,
    lineHeight: 38,
  },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  accentLine: { height: 1, width: 30, backgroundColor: C.teal, opacity: 0.5 },
  accentDiamond: { fontSize: 8, color: C.teal, opacity: 0.8 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 1.5,
  },
  statSep: { width: 1, height: 30, backgroundColor: C.border },
});

const heatStyles = StyleSheet.create({
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  title: {
    fontSize: 11,
    fontWeight: '900',
    color: C.textMid,
    letterSpacing: 2.5,
  },
  titleLine: { flex: 1, height: 1, backgroundColor: C.border },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 9,
    color: C.textDim,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cell: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDot: { width: 8, height: 8, borderRadius: 4 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  legendCell: {
    width: 16, height: 16,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendLabel: {
    fontSize: 9,
    color: C.textDim,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingTop: 12 },

  loadingState: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: C.textMid,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 8,
  },
  loadingDots: {
    color: C.teal,
    fontSize: 10,
    letterSpacing: 4,
    opacity: 0.5,
  },

  // Section
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: C.textWhite,
    letterSpacing: 3,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.border },
  sectionCount: {
    fontSize: 11,
    fontWeight: '700',
    color: C.teal,
    letterSpacing: 1,
  },
  sectionSub: {
    fontSize: 11,
    color: C.textDim,
    fontWeight: '500',
    marginBottom: 14,
    letterSpacing: 0.3,
  },

  // Entry card
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardBar: { width: 3 },
  cardInner: { flex: 1, padding: 14 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  scoreBadge: {
    width: 40, height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: { fontSize: 16, fontWeight: '900' },
  cardDate: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textWhite,
    letterSpacing: -0.2,
  },
  cardScoreLabel: {
    fontSize: 9,
    color: C.textDim,
    marginTop: 2,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  expandBtn: {
    width: 28, height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandBtnText: { fontSize: 9, color: C.textDim, fontWeight: '700' },
  metricPills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metricPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricPillEmoji: { fontSize: 11 },
  metricPillVal: { fontSize: 12, fontWeight: '800' },

  // Expanded
  detail: { marginTop: 10 },
  detailDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 9,
    color: C.textDim,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  detailValue: {
    fontSize: 12,
    color: C.textMid,
    flex: 1,
    textAlign: 'right',
  },
  notesBox: {
    backgroundColor: C.bgCardAlt,
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  notesIcon: { fontSize: 8, color: C.teal, marginTop: 4 },
  notesText: {
    fontSize: 12,
    color: C.textMid,
    lineHeight: 18,
    flex: 1,
    fontStyle: 'italic',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyEmoji: { fontSize: 44, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.textWhite,
    letterSpacing: 4,
    marginBottom: 10,
  },
  emptyAccentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  emptyLine: { height: 1, width: 40, backgroundColor: C.teal, opacity: 0.4 },
  emptyDiamond: { fontSize: 8, color: C.teal },
  emptySub: {
    fontSize: 13,
    color: C.textDim,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});