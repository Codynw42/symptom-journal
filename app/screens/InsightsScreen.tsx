import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Insight {
  id: string;
  title: string;
  description: string;
  variables: string[];
  confidence: 'high' | 'medium' | 'low';
  trend: 'positive' | 'negative' | 'neutral';
}

interface WeeklySummary {
  avgPain: number;
  avgEnergy: number;
  avgMood: number;
  avgSleep: number;
  digest: string;
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_SUMMARY: WeeklySummary = {
  avgPain: 4.1,
  avgEnergy: 5.7,
  avgMood: 6.4,
  avgSleep: 6.8,
  digest:
    'This week was mixed. Your best days followed nights with 8+ hours of sleep, and your worst days correlated with alcohol the night before. Energy was consistently low on Wednesdays — worth watching if that continues next week.',
};

const DUMMY_INSIGHTS: Insight[] = [
  {
    id: '1',
    title: 'Poor sleep is driving your pain scores',
    description:
      'On days following less than 6 hours of sleep, your pain scores average 6.8 — nearly double your baseline of 3.5 on well-rested days. This pattern has held across 9 of the last 14 days.',
    variables: ['Sleep hours', 'Pain'],
    confidence: 'high',
    trend: 'negative',
  },
  {
    id: '2',
    title: 'Alcohol reliably tanks your mood the next day',
    description:
      'Every time you logged alcohol, your mood score the following day dropped by an average of 3.2 points. This has happened consistently across all 5 occurrences in the past 30 days.',
    variables: ['Alcohol', 'Mood'],
    confidence: 'high',
    trend: 'negative',
  },
  {
    id: '3',
    title: 'Your energy is improving week over week',
    description:
      'Average energy this week is 5.7 compared to 4.1 last week — a 39% improvement. The change lines up with you logging more consistent sleep times.',
    variables: ['Energy', 'Sleep quality'],
    confidence: 'medium',
    trend: 'positive',
  },
  {
    id: '4',
    title: 'Wednesday energy dip — possible pattern',
    description:
      'Your energy scores on Wednesdays have averaged 3.2 over the past 4 weeks, compared to your weekly average of 5.7. Only 4 data points so far — keep logging to confirm.',
    variables: ['Energy', 'Day of week'],
    confidence: 'low',
    trend: 'negative',
  },
  {
    id: '5',
    title: 'Vitamin D correlates with better mood',
    description:
      'On days you logged Vitamin D, your mood averaged 7.1. On days without it, mood averaged 5.4. Correlation is promising but more data is needed to rule out confounding factors.',
    variables: ['Vitamin D', 'Mood'],
    confidence: 'medium',
    trend: 'positive',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confidenceColor(confidence: Insight['confidence']): string {
  return { high: '#4CAF50', medium: '#FFC107', low: '#90A4AE' }[confidence];
}

function confidenceLabel(confidence: Insight['confidence']): string {
  return { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' }[confidence];
}

function trendIcon(trend: Insight['trend']): string {
  return { positive: '📈', negative: '📉', neutral: '➡️' }[trend];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  emoji,
  color,
}: {
  label: string;
  value: string;
  emoji: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function WeeklyDigest({ summary }: { summary: WeeklySummary }) {
  return (
    <View style={styles.digestCard}>
      <Text style={styles.digestTitle}>📋 Weekly Digest</Text>
      <View style={styles.statRow}>
        <StatCard
          label="Pain"
          value={summary.avgPain.toFixed(1)}
          emoji="🤕"
          color="#F44336"
        />
        <StatCard
          label="Energy"
          value={summary.avgEnergy.toFixed(1)}
          emoji="⚡"
          color="#FFC107"
        />
        <StatCard
          label="Mood"
          value={summary.avgMood.toFixed(1)}
          emoji="😊"
          color="#4CAF50"
        />
        <StatCard
          label="Sleep"
          value={`${summary.avgSleep.toFixed(1)}h`}
          emoji="😴"
          color="#6C63FF"
        />
      </View>
      <Text style={styles.digestText}>{summary.digest}</Text>
    </View>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const [expanded, setExpanded] = useState(false);
  const color = confidenceColor(insight.confidence);

  return (
    <TouchableOpacity
      style={styles.insightCard}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.insightHeader}>
        <Text style={styles.trendIcon}>{trendIcon(insight.trend)}</Text>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {/* Variables */}
      <View style={styles.variableRow}>
        {insight.variables.map((v) => (
          <View key={v} style={styles.variableTag}>
            <Text style={styles.variableText}>{v}</Text>
          </View>
        ))}
        <View style={[styles.confidenceBadge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.confidenceText, { color }]}>
            {confidenceLabel(insight.confidence)}
          </Text>
        </View>
      </View>

      {/* Expanded */}
      {expanded && (
        <View style={styles.insightDetail}>
          <View style={styles.divider} />
          <Text style={styles.insightDescription}>{insight.description}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function EmptyState({ onGenerate, loading }: { onGenerate: () => void; loading: boolean }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🧠</Text>
      <Text style={styles.emptyTitle}>Not enough data yet</Text>
      <Text style={styles.emptySubtitle}>
        Log at least 7 days of entries and Claude will start finding patterns in your data.
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const [loading, setLoading] = useState(false);
  const [hasData] = useState(true); // flip to false to see empty state

  function handleRefresh() {
    // Claude API call will go here
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Your Insights</Text>
          <Text style={styles.subheading}>Last updated today</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.refreshText}>↻ Refresh</Text>
          )}
        </TouchableOpacity>
      </View>

      {!hasData ? (
        <EmptyState onGenerate={handleRefresh} loading={loading} />
      ) : (
        <>
          <WeeklyDigest summary={DUMMY_SUMMARY} />

          <Text style={styles.sectionHeader}>Patterns Detected</Text>
          <Text style={styles.sectionSubheader}>
            Tap any card to read the full finding
          </Text>

          {DUMMY_INSIGHTS.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}

          <View style={styles.footerNote}>
            <Text style={styles.footerNoteText}>
              🤖 Insights are generated by Claude AI based on your logged data.
              Always consult a healthcare professional before making medical decisions.
            </Text>
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7FB',
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  subheading: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  refreshText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 28,
    marginBottom: 4,
  },
  sectionSubheader: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 14,
  },

  // Weekly digest
  digestCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  digestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderTopWidth: 3,
    paddingTop: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  statEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
  },
  digestText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Insight cards
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  trendIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  insightTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 20,
  },
  chevron: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 3,
  },
  variableRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  variableTag: {
    backgroundColor: '#EAE9FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  variableText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '500',
  },
  confidenceBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  insightDetail: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  insightDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Footer
  footerNote: {
    backgroundColor: '#EAE9FF',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  footerNoteText: {
    fontSize: 12,
    color: '#6C63FF',
    lineHeight: 18,
  },
});