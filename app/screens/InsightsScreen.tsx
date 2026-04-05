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
import { generateInsights, InsightsResult, Insight } from '../lib/claude';
import { getStreak, StreakData } from '../lib/storage';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function confidenceColor(c: Insight['confidence']): string {
  return { high: C.mint, medium: C.amber, low: C.textMid }[c];
}

function confidenceLabel(c: Insight['confidence']): string {
  return { high: 'HIGH CONFIDENCE', medium: 'MED CONFIDENCE', low: 'LOW CONFIDENCE' }[c];
}

function trendIcon(t: Insight['trend']): string {
  return { positive: '📈', negative: '📉', neutral: '➡️' }[t];
}

function trendColor(t: Insight['trend']): string {
  return { positive: C.mint, negative: C.coral, neutral: C.textMid }[t];
}

// ─── Pulse Ring ───────────────────────────────────────────────────────────────

function PulseRing({ size, color, style }: { size: number; color: string; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.3, duration: 3200, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 3200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.06, duration: 3200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 3200, useNativeDriver: true }),
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

function ScreenHeader({
  hasData,
  onRefresh,
  generating,
  lastUpdated,
}: {
  hasData: boolean;
  onRefresh: () => void;
  generating: boolean;
  lastUpdated: string | null;
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
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <PulseRing size={130} color={C.lavender} style={headerStyles.ring1} />
        <PulseRing size={75} color={C.teal} style={headerStyles.ring2} />

        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => (
            <View key={`${row}-${col}`} style={{
              position: 'absolute',
              top: 10 + row * 18,
              right: 14 + col * 18,
              width: 2, height: 2,
              borderRadius: 1,
              backgroundColor: C.lavender,
              opacity: 0.1,
            }} />
          ))
        )}

        {[
          { top: 16, left: width * 0.52, color: C.lavender },
          { top: 42, left: width * 0.63, color: C.teal },
          { top: 26, left: width * 0.45, color: C.amber },
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

        <View style={headerStyles.hbWrap}>
          {[0, 2, 5, 2, 16, 28, 16, 2, 5, 2, 0, 2, 0].map((h, i) => (
            <View key={i} style={[headerStyles.hbBar, {
              height: Math.max(2, h),
              opacity: h > 10 ? 0.55 : 0.12,
            }]} />
          ))}
        </View>
      </View>

      <Animated.View style={[headerStyles.content, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        <View style={headerStyles.labelRow}>
          <View style={headerStyles.labelPill}>
            <Text style={headerStyles.labelText}>◆ POWERED BY CLAUDE AI</Text>
          </View>
        </View>

        <Text style={headerStyles.title}>PATTERN{'\n'}ANALYSIS</Text>

        <View style={headerStyles.accentRow}>
          <View style={headerStyles.accentLine} />
          <Text style={headerStyles.accentDiamond}>◆</Text>
          <View style={headerStyles.accentLine} />
        </View>

        <Text style={headerStyles.subtitle}>
          {hasData
            ? 'Claude has analyzed your health data and found the following patterns.'
            : 'Log 7 days of entries to unlock AI-powered health pattern detection.'}
        </Text>

        {hasData && (
          <View style={headerStyles.bottomRow}>
            {lastUpdated && (
              <Text style={headerStyles.updatedText}>UPDATED {lastUpdated.toUpperCase()}</Text>
            )}
            <TouchableOpacity
              style={[headerStyles.refreshBtn, generating && { opacity: 0.6 }]}
              onPress={onRefresh}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color={C.bg} />
              ) : (
                <Text style={headerStyles.refreshBtnText}>↻ REFRESH</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ emoji, label, value, color }: {
  emoji: string; label: string; value: string; color: string;
}) {
  return (
    <View style={[statStyles.card, { borderTopColor: color }]}>
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

// ─── Weekly Digest ────────────────────────────────────────────────────────────

function WeeklyDigest({ result }: { result: InsightsResult }) {
  return (
    <View style={styles.digestCard}>
      <View style={styles.digestTitleRow}>
        <Text style={styles.digestTitle}>WEEKLY DIGEST</Text>
        <View style={styles.digestLine} />
      </View>
      <View style={styles.statRow}>
        <StatCard emoji="🤕" label="PAIN" value={result.avgPain.toFixed(1)} color={C.coral} />
        <StatCard emoji="⚡" label="ENERGY" value={result.avgEnergy.toFixed(1)} color={C.amber} />
        <StatCard emoji="😊" label="MOOD" value={result.avgMood.toFixed(1)} color={C.mint} />
        <StatCard emoji="😴" label="SLEEP" value={`${result.avgSleep.toFixed(1)}h`} color={C.teal} />
      </View>
      <View style={styles.digestTextBox}>
        <Text style={styles.digestQuote}>◆</Text>
        <Text style={styles.digestText}>{result.digest}</Text>
      </View>
    </View>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const color = confidenceColor(insight.confidence);
  const tc = trendColor(insight.trend);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={styles.insightCard}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={[styles.insightBar, { backgroundColor: tc }]} />
        <View style={styles.insightInner}>
          <View style={styles.insightHeaderRow}>
            <Text style={styles.insightTrendIcon}>{trendIcon(insight.trend)}</Text>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <View style={[styles.expandBtn, expanded && { borderColor: C.teal + '60' }]}>
              <Text style={[styles.expandBtnText, expanded && { color: C.teal }]}>
                {expanded ? '▲' : '▼'}
              </Text>
            </View>
          </View>

          <View style={styles.insightMeta}>
            {insight.variables.map((v) => (
              <View key={v} style={styles.varTag}>
                <Text style={styles.varTagText}>{v}</Text>
              </View>
            ))}
            <View style={[styles.confBadge, {
              backgroundColor: color + '18',
              borderColor: color + '40',
            }]}>
              <Text style={[styles.confText, { color }]}>
                {confidenceLabel(insight.confidence)}
              </Text>
            </View>
          </View>

          {expanded && (
            <View style={styles.insightDetail}>
              <View style={styles.detailDivider} />
              <Text style={styles.insightDesc}>{insight.description}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Progress State ───────────────────────────────────────────────────────────

function ProgressState({ streak }: { streak: StreakData }) {
  const DAYS_NEEDED = 7;
  const progress = Math.min(streak.currentStreak / DAYS_NEEDED, 1);
  const daysLeft = Math.max(DAYS_NEEDED - streak.currentStreak, 0);

  function encouragement(): string {
    if (streak.currentStreak === 0) return 'Log today to get started.';
    if (streak.currentStreak === 1) return 'Great start. Come back tomorrow.';
    if (streak.currentStreak === 2) return 'Two days in. Building momentum.';
    if (streak.currentStreak === 3) return 'Halfway there. Don\'t stop now.';
    if (streak.currentStreak < 7) return `${daysLeft} more days — you\'re close.`;
    return 'Generating your first insights...';
  }

  return (
    <View style={progressStyles.outer}>
      <View style={progressStyles.card}>
        <View style={progressStyles.labelRow}>
          <Text style={progressStyles.label}>
            🔥 {streak.currentStreak} / {DAYS_NEEDED} DAYS LOGGED
          </Text>
          <Text style={progressStyles.daysLeft}>
            {daysLeft === 0 ? 'READY' : `${daysLeft} TO GO`}
          </Text>
        </View>

        <View style={progressStyles.track}>
          <View style={[progressStyles.fill, { width: `${progress * 100}%` }]} />
        </View>

        <View style={progressStyles.markerRow}>
          {Array.from({ length: DAYS_NEEDED }).map((_, i) => (
            <View key={i} style={progressStyles.markerWrap}>
              <View style={[
                progressStyles.marker,
                i < streak.currentStreak && progressStyles.markerFilled,
              ]}>
                {i < streak.currentStreak && (
                  <Text style={progressStyles.markerCheck}>✓</Text>
                )}
              </View>
              <Text style={progressStyles.markerNum}>{i + 1}</Text>
            </View>
          ))}
        </View>

        <View style={progressStyles.accentRow}>
          <View style={progressStyles.accentLine} />
          <Text style={progressStyles.encouragement}>{encouragement()}</Text>
          <View style={progressStyles.accentLine} />
        </View>
      </View>

      <View style={progressStyles.expectCard}>
        <View style={progressStyles.expectTitleRow}>
          <Text style={progressStyles.expectTitle}>WHAT CLAUDE WILL FIND</Text>
          <View style={progressStyles.expectLine} />
        </View>
        {[
          { icon: '🔗', text: 'Correlations between sleep and pain scores' },
          { icon: '⏱️', text: 'Lagged effects — did food on Monday affect Tuesday?' },
          { icon: '📅', text: 'Weekly cycles and patterns in your data' },
          { icon: '💊', text: 'Which medications correlate with better days' },
        ].map((item, i) => (
          <View key={i} style={progressStyles.expectRow}>
            <View style={progressStyles.expectIconBox}>
              <Text style={progressStyles.expectIcon}>{item.icon}</Text>
            </View>
            <Text style={progressStyles.expectText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Generating State ─────────────────────────────────────────────────────────

function GeneratingCard({ entryCount }: { entryCount: number }) {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.generatingCard}>
      <Animated.View style={[styles.generatingDot, { opacity: pulse }]} />
      <View style={styles.generatingText}>
        <Text style={styles.generatingTitle}>ANALYZING YOUR DATA</Text>
        <Text style={styles.generatingSub}>
          Claude is scanning {entryCount} entries for patterns...
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [result, setResult] = useState<InsightsResult | null>(null);
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0, lastLoggedDate: null, longestStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasEnoughData = entries.length >= 7;

  async function loadData() {
    try {
      const [fetchedEntries, fetchedStreak] = await Promise.all([
        fetchEntries(),
        getStreak(),
      ]);
      setEntries(fetchedEntries);
      setStreak(fetchedStreak);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleGenerate() {
    if (!hasEnoughData || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const insights = await generateInsights(entries.slice(0, 30));
      setResult(insights);
      setLastUpdated(new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }));
    } catch (e: any) {
      setError('Could not generate insights. Check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (hasEnoughData && !result) handleGenerate();
  }, [entries]);

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color={C.lavender} size="large" />
        <Text style={styles.loadingText}>LOADING INSIGHTS</Text>
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
          onRefresh={() => { setRefreshing(true); loadData(); }}
          tintColor={C.lavender}
        />
      }
    >
      <ScreenHeader
        hasData={hasEnoughData}
        onRefresh={handleGenerate}
        generating={generating}
        lastUpdated={lastUpdated}
      />

      {!hasEnoughData ? (
        <ProgressState streak={streak} />
      ) : (
        <>
          {generating && <GeneratingCard entryCount={entries.length} />}

          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {result && !generating && (
            <>
              <WeeklyDigest result={result} />

              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>PATTERNS DETECTED</Text>
                <View style={styles.sectionLine} />
                <Text style={styles.sectionCount}>{result.insights.length}</Text>
              </View>
              <Text style={styles.sectionSub}>Tap any card to read the full finding</Text>

              {result.insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} index={i} />
              ))}

              <View style={styles.disclaimer}>
                <Text style={styles.disclaimerIcon}>◆</Text>
                <Text style={styles.disclaimerText}>
                  Insights generated by Claude AI. Always consult a healthcare professional before making medical decisions.
                </Text>
              </View>
            </>
          )}
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
  },
  ring1: { position: 'absolute', top: -30, right: -30 },
  ring2: { position: 'absolute', top: 20, right: 20 },
  hbWrap: {
    position: 'absolute',
    bottom: 18, right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  hbBar: { width: 3, backgroundColor: C.lavender, borderRadius: 2 },
  content: { padding: 22, paddingBottom: 20 },
  labelRow: { marginBottom: 12 },
  labelPill: {
    alignSelf: 'flex-start',
    backgroundColor: C.lavender + '12',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.lavender + '30',
  },
  labelText: {
    color: C.lavender,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
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
  accentLine: { height: 1, width: 30, backgroundColor: C.lavender, opacity: 0.5 },
  accentDiamond: { fontSize: 8, color: C.lavender, opacity: 0.8 },
  subtitle: {
    fontSize: 13,
    color: C.textDim,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  updatedText: {
    fontSize: 9,
    color: C.textDim,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  refreshBtn: {
    backgroundColor: C.teal,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  refreshBtnText: {
    color: C.bg,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1.5,
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.bgCardAlt,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 2,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  emoji: { fontSize: 16, marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  label: {
    fontSize: 8,
    color: C.textDim,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 1.5,
  },
});

const progressStyles = StyleSheet.create({
  outer: { gap: 12 },
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textWhite,
    letterSpacing: 1.5,
  },
  daysLeft: {
    fontSize: 10,
    color: C.teal,
    fontWeight: '800',
    letterSpacing: 2,
  },
  track: {
    height: 6,
    backgroundColor: C.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  fill: {
    height: '100%',
    backgroundColor: C.teal,
    borderRadius: 3,
  },
  markerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  markerWrap: { alignItems: 'center', gap: 4 },
  marker: {
    width: 32, height: 32,
    borderRadius: 10,
    backgroundColor: C.bgCardAlt,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerFilled: {
    backgroundColor: C.teal + '20',
    borderColor: C.teal,
  },
  markerCheck: { fontSize: 12, color: C.teal, fontWeight: '900' },
  markerNum: {
    fontSize: 8,
    color: C.textDim,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accentLine: { flex: 1, height: 1, backgroundColor: C.border },
  encouragement: {
    fontSize: 11,
    color: C.teal,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  expectCard: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  expectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  expectTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: C.textMid,
    letterSpacing: 2.5,
  },
  expectLine: { flex: 1, height: 1, backgroundColor: C.border },
  expectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  expectIconBox: {
    width: 32, height: 32,
    borderRadius: 10,
    backgroundColor: C.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  expectIcon: { fontSize: 15 },
  expectText: {
    fontSize: 13,
    color: C.textMid,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
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
    color: C.lavender,
    fontSize: 10,
    letterSpacing: 4,
    opacity: 0.5,
  },

  // Generating
  generatingCard: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: C.lavender + '40',
    marginBottom: 14,
  },
  generatingDot: {
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: C.lavender,
  },
  generatingText: { flex: 1 },
  generatingTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: C.textWhite,
    letterSpacing: 2,
  },
  generatingSub: {
    fontSize: 12,
    color: C.textDim,
    marginTop: 3,
  },

  // Error
  errorCard: {
    backgroundColor: C.coral + '12',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.coral + '40',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorIcon: { fontSize: 16 },
  errorText: {
    color: C.coral,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },

  // Digest
  digestCard: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  digestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  digestTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: C.textMid,
    letterSpacing: 2.5,
  },
  digestLine: { flex: 1, height: 1, backgroundColor: C.border },
  statRow: { flexDirection: 'row', marginBottom: 14 },
  digestTextBox: {
    backgroundColor: C.bgCardAlt,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    gap: 10,
  },
  digestQuote: { fontSize: 8, color: C.lavender, marginTop: 4 },
  digestText: {
    fontSize: 13,
    color: C.textMid,
    lineHeight: 20,
    fontStyle: 'italic',
    flex: 1,
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
    color: C.lavender,
    letterSpacing: 1,
  },
  sectionSub: {
    fontSize: 11,
    color: C.textDim,
    fontWeight: '500',
    marginBottom: 14,
    letterSpacing: 0.3,
  },

  // Insight card
  insightCard: {
    backgroundColor: C.bgCard,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  insightBar: { width: 3 },
  insightInner: { flex: 1, padding: 14 },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  insightTrendIcon: { fontSize: 15, marginTop: 1 },
  insightTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: C.textWhite,
    lineHeight: 20,
    letterSpacing: -0.2,
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
  insightMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  varTag: {
    backgroundColor: C.navy,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  varTagText: {
    color: C.textMid,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  confBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  confText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  insightDetail: { marginTop: 12 },
  detailDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  insightDesc: {
    fontSize: 13,
    color: C.textMid,
    lineHeight: 20,
  },

  // Disclaimer
  disclaimer: {
    backgroundColor: C.bgCard,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  disclaimerIcon: { fontSize: 8, color: C.lavender, marginTop: 4 },
  disclaimerText: {
    fontSize: 11,
    color: C.textDim,
    lineHeight: 17,
    flex: 1,
    letterSpacing: 0.2,
  },
});