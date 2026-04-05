import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { fetchEntries } from '../lib/db';
import { generateInsights, InsightsResult, Insight } from '../lib/claude';
import { getStreak, StreakData } from '../lib/storage';

// ─── Theme ────────────────────────────────────────────────────────────────────

const C = {
  bg:        '#0A1628',
  bgCard:    '#111F35',
  bgCardAlt: '#0F1A2E',
  border:    '#1E3352',
  navy:      '#1E3A5F',
  teal:      '#4ECDC4',
  coral:     '#FF6B6B',
  amber:     '#FFA552',
  mint:      '#6BCB77',
  lavender:  '#A78BFA',
  textWhite: '#F0F8FF',
  textMid:   '#7A99B8',
  textDim:   '#3D5A7A',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confidenceColor(confidence: Insight['confidence']): string {
  return { high: C.mint, medium: C.amber, low: C.textMid }[confidence];
}

function confidenceLabel(confidence: Insight['confidence']): string {
  return { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }[confidence];
}

function trendIcon(trend: Insight['trend']): string {
  return { positive: '📈', negative: '📉', neutral: '➡️' }[trend];
}

function trendColor(trend: Insight['trend']): string {
  return { positive: C.mint, negative: C.coral, neutral: C.textMid }[trend];
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  emoji, label, value, color,
}: {
  emoji: string;
  label: string;
  value: string;
  color: string;
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
      <View style={styles.digestHeader}>
        <View style={styles.digestIconBox}>
          <Text style={styles.digestIcon}>📋</Text>
        </View>
        <View>
          <Text style={styles.digestTitle}>Weekly Digest</Text>
          <Text style={styles.digestSub}>Your past 7 days at a glance</Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <StatCard emoji="🤕" label="Pain" value={result.avgPain.toFixed(1)} color={C.coral} />
        <StatCard emoji="⚡" label="Energy" value={result.avgEnergy.toFixed(1)} color={C.amber} />
        <StatCard emoji="😊" label="Mood" value={result.avgMood.toFixed(1)} color={C.mint} />
        <StatCard emoji="😴" label="Sleep" value={`${result.avgSleep.toFixed(1)}h`} color={C.teal} />
      </View>

      <View style={styles.digestTextBox}>
        <Text style={styles.digestText}>{result.digest}</Text>
      </View>
    </View>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: Insight }) {
  const [expanded, setExpanded] = useState(false);
  const color = confidenceColor(insight.confidence);
  const tc = trendColor(insight.trend);

  return (
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
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>

        <View style={styles.insightMeta}>
          {insight.variables.map((v) => (
            <View key={v} style={styles.varTag}>
              <Text style={styles.varTagText}>{v}</Text>
            </View>
          ))}
          <View style={[styles.confBadge, { backgroundColor: color + '20', borderColor: color + '50' }]}>
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
  );
}

// ─── Progress / Empty State ───────────────────────────────────────────────────

function ProgressState({ streak }: { streak: StreakData }) {
  const DAYS_NEEDED = 7;
  const progress = Math.min(streak.currentStreak / DAYS_NEEDED, 1);
  const daysLeft = Math.max(DAYS_NEEDED - streak.currentStreak, 0);

  function encouragement(): string {
    if (streak.currentStreak === 0) return 'Log today to get started!';
    if (streak.currentStreak === 1) return 'Great start! Come back tomorrow.';
    if (streak.currentStreak === 2) return 'Two days in. Building momentum 💪';
    if (streak.currentStreak === 3) return 'Halfway there. Don\'t stop now!';
    if (streak.currentStreak < 7) return `${daysLeft} more days — you\'re so close!`;
    return 'Generating your first insights...';
  }

  return (
    <View style={styles.progressOuter}>
      {/* Hero */}
      <View style={styles.progressHero}>
        <View style={styles.progressBlobBig} />
        <View style={styles.progressBlobSmall} />
        <Text style={styles.progressEmoji}>🧠</Text>
        <Text style={styles.progressTitle}>Insights are coming</Text>
        <Text style={styles.progressSub}>
          Log every day and Claude will find patterns in your data that you'd never notice yourself.
        </Text>
      </View>

      {/* Progress card */}
      <View style={styles.progressCard}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>
            🔥 {streak.currentStreak} / {DAYS_NEEDED} days logged
          </Text>
          <Text style={styles.progressDaysLeft}>
            {daysLeft === 0 ? 'Ready!' : `${daysLeft} to go`}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.markerRow}>
          {Array.from({ length: DAYS_NEEDED }).map((_, i) => (
            <View key={i} style={styles.markerWrap}>
              <View style={[
                styles.marker,
                i < streak.currentStreak && styles.markerFilled,
              ]} />
              {i < streak.currentStreak && (
                <Text style={styles.markerCheck}>✓</Text>
              )}
            </View>
          ))}
        </View>

        <Text style={styles.encouragement}>{encouragement()}</Text>
      </View>

      {/* What to expect */}
      <View style={styles.expectCard}>
        <Text style={styles.expectTitle}>What Claude will find</Text>
        {[
          { icon: '🔗', text: 'Correlations between sleep and pain scores' },
          { icon: '⏱️', text: 'Lagged effects — did food on Monday affect Tuesday?' },
          { icon: '📅', text: 'Weekly cycles and patterns in your data' },
          { icon: '💊', text: 'Which medications correlate with better days' },
        ].map((item, i) => (
          <View key={i} style={styles.expectRow}>
            <Text style={styles.expectIcon}>{item.icon}</Text>
            <Text style={styles.expectText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [result, setResult] = useState<InsightsResult | null>(null);
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, lastLoggedDate: null, longestStreak: 0 });
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
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }));
    } catch (e: any) {
      setError('Could not generate insights. Check your connection and try again.');
      console.error('Claude API error:', e);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (hasEnoughData && !result) {
      handleGenerate();
    }
  }, [entries]);

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color={C.teal} size="large" />
        <Text style={styles.loadingText}>Loading your data...</Text>
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
          onRefresh={handleRefresh}
          tintColor={C.teal}
        />
      }
    >
      {!hasEnoughData ? (
        <ProgressState streak={streak} />
      ) : (
        <>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.heading}>AI Insights</Text>
              {lastUpdated && (
                <Text style={styles.subheading}>Updated {lastUpdated}</Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.refreshBtn, generating && styles.refreshBtnDisabled]}
              onPress={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color={C.bg} />
              ) : (
                <Text style={styles.refreshBtnText}>↻ Refresh</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Generating state */}
          {generating && (
            <View style={styles.generatingCard}>
              <ActivityIndicator color={C.teal} />
              <View>
                <Text style={styles.generatingTitle}>Claude is analyzing your data</Text>
                <Text style={styles.generatingSub}>Looking for patterns across {entries.length} entries...</Text>
              </View>
            </View>
          )}

          {/* Error state */}
          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Results */}
          {result && !generating && (
            <>
              <WeeklyDigest result={result} />

              <Text style={styles.sectionHeader}>Patterns Detected</Text>
              <Text style={styles.sectionSub}>
                Tap any card to read the full finding
              </Text>

              {result.insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}

              <View style={styles.disclaimer}>
                <Text style={styles.disclaimerText}>
                  🤖 Insights generated by Claude AI. Always consult a healthcare professional before making medical decisions.
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

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.bgCardAlt,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 2,
    marginHorizontal: 3,
  },
  emoji: { fontSize: 16, marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 10, color: C.textDim, fontWeight: '500', marginTop: 2 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingTop: 12 },
  loadingState: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: C.textMid, fontSize: 14, fontWeight: '500' },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: C.textWhite,
    letterSpacing: -0.8,
  },
  subheading: { fontSize: 11, color: C.textDim, marginTop: 3, fontWeight: '500' },
  refreshBtn: {
    backgroundColor: C.teal,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  refreshBtnDisabled: { opacity: 0.6 },
  refreshBtnText: { color: C.bg, fontWeight: '800', fontSize: 13 },

  // Generating
  generatingCard: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: C.teal + '40',
    marginBottom: 16,
  },
  generatingTitle: { fontSize: 14, fontWeight: '700', color: C.textWhite },
  generatingSub: { fontSize: 12, color: C.textDim, marginTop: 2 },

  // Error
  errorCard: {
    backgroundColor: C.coral + '15',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.coral + '40',
    marginBottom: 16,
  },
  errorText: { color: C.coral, fontSize: 13, fontWeight: '600' },

  // Digest card
  digestCard: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  digestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  digestIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  digestIcon: { fontSize: 18 },
  digestTitle: { fontSize: 16, fontWeight: '700', color: C.textWhite },
  digestSub: { fontSize: 11, color: C.textDim, marginTop: 1 },
  statRow: { flexDirection: 'row', marginBottom: 14 },
  digestTextBox: {
    backgroundColor: C.bgCardAlt,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  digestText: {
    fontSize: 13,
    color: C.textMid,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Section
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textWhite,
    letterSpacing: -0.5,
    marginTop: 24,
    marginBottom: 4,
  },
  sectionSub: { fontSize: 11, color: C.textDim, fontWeight: '500', marginBottom: 14 },

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
  insightTrendIcon: { fontSize: 16, marginTop: 1 },
  insightTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: C.textWhite,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  chevron: { fontSize: 10, color: C.textDim, marginTop: 3 },
  insightMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  varTag: {
    backgroundColor: C.navy,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  varTagText: { color: C.textMid, fontSize: 11, fontWeight: '600' },
  confBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  confText: { fontSize: 11, fontWeight: '600' },
  insightDetail: { marginTop: 12 },
  detailDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  insightDesc: {
    fontSize: 13,
    color: C.textMid,
    lineHeight: 20,
  },

  // Disclaimer
  disclaimer: {
    backgroundColor: C.navy,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  disclaimerText: { fontSize: 11, color: C.textDim, lineHeight: 17 },

  // Progress / empty state
  progressOuter: { gap: 14 },
  progressHero: {
    backgroundColor: C.navy,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: C.border,
  },
  progressBlobBig: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: C.teal,
    opacity: 0.06,
    top: -60,
    right: -40,
  },
  progressBlobSmall: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.lavender,
    opacity: 0.08,
    bottom: -20,
    left: 20,
  },
  progressEmoji: { fontSize: 48, marginBottom: 12 },
  progressTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textWhite,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  progressSub: {
    fontSize: 13,
    color: C.textDim,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  progressCard: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: { fontSize: 13, fontWeight: '700', color: C.textWhite },
  progressDaysLeft: { fontSize: 13, color: C.teal, fontWeight: '700' },
  progressTrack: {
    height: 8,
    backgroundColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.teal,
    borderRadius: 4,
  },
  markerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  markerWrap: { alignItems: 'center', justifyContent: 'center' },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.bgCardAlt,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  markerFilled: {
    backgroundColor: C.teal + '25',
    borderColor: C.teal,
  },
  markerCheck: {
    position: 'absolute',
    fontSize: 12,
    color: C.teal,
    fontWeight: '800',
  },
  encouragement: {
    fontSize: 13,
    color: C.teal,
    fontWeight: '700',
    textAlign: 'center',
  },
  expectCard: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  expectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textWhite,
    marginBottom: 4,
  },
  expectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expectIcon: { fontSize: 18, width: 28 },
  expectText: { fontSize: 13, color: C.textMid, fontWeight: '500', flex: 1, lineHeight: 18 },
});