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
    weekday: 'short',
    month: 'short',
    day: 'numeric',
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

// ─── Calendar Heatmap ────────────────────────────────────────────────────────

function CalendarHeatmap({ entries }: { entries: Entry[] }) {
  const entryMap = Object.fromEntries(entries.map((e) => [e.date, e]));
  const days = getLastNDays(35);
  const weeks: (Entry | null)[][] = [];

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(
      days.slice(i, i + 7).map((d) => entryMap[d] ?? null)
    );
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const totalLogged = entries.length;
  const avgWellness = entries.length
    ? Math.round(entries.reduce((sum, e) => sum + wellnessScore(e), 0) / entries.length)
    : 0;

  return (
    <View style={heatStyles.card}>
      {/* Header */}
      <View style={heatStyles.headerRow}>
        <View>
          <Text style={heatStyles.title}>Last 5 Weeks</Text>
          <Text style={heatStyles.subtitle}>Your wellness at a glance</Text>
        </View>
        <View style={heatStyles.statsRow}>
          <View style={heatStyles.statBox}>
            <Text style={[heatStyles.statNum, { color: C.teal }]}>{totalLogged}</Text>
            <Text style={heatStyles.statLabel}>logged</Text>
          </View>
          <View style={heatStyles.statBox}>
            <Text style={[heatStyles.statNum, { color: scoreToColor(avgWellness) }]}>
              {avgWellness}
            </Text>
            <Text style={heatStyles.statLabel}>avg score</Text>
          </View>
        </View>
      </View>

      {/* Day labels */}
      <View style={heatStyles.row}>
        {dayLabels.map((d, i) => (
          <Text key={i} style={heatStyles.dayLabel}>{d}</Text>
        ))}
      </View>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <View key={wi} style={heatStyles.row}>
          {week.map((entry, di) => {
            const score = entry ? wellnessScore(entry) : null;
            const color = score !== null ? scoreToColor(score) : null;
            return (
              <View
                key={di}
                style={[
                  heatStyles.cell,
                  {
                    backgroundColor: color ? color + '30' : C.bgCardAlt,
                    borderColor: color ? color + '60' : C.border,
                  },
                ]}
              >
                {color && (
                  <View style={[heatStyles.cellDot, { backgroundColor: color }]} />
                )}
              </View>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={heatStyles.legendRow}>
        <Text style={heatStyles.legendLabel}>Worse</Text>
        {['#F44336', C.coral, C.amber, C.teal, C.mint].map((c) => (
          <View key={c} style={[heatStyles.legendCell, { backgroundColor: c + '60', borderColor: c }]} />
        ))}
        <Text style={heatStyles.legendLabel}>Better</Text>
      </View>
    </View>
  );
}

// ─── Entry Card ───────────────────────────────────────────────────────────────

function EntryCard({ entry }: { entry: Entry }) {
  const [expanded, setExpanded] = useState(false);
  const score = wellnessScore(entry);
  const color = scoreToColor(score);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.8}
    >
      {/* Left color bar */}
      <View style={[styles.cardBar, { backgroundColor: color }]} />

      <View style={styles.cardInner}>
        {/* Header row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.scoreBadge, { backgroundColor: color + '25', borderColor: color + '60' }]}>
              <Text style={[styles.scoreNum, { color }]}>{score}</Text>
            </View>
            <View>
              <Text style={styles.cardDate}>{formatDisplayDate(entry.date)}</Text>
              <Text style={styles.cardSubdate}>Wellness score {score}/10</Text>
            </View>
          </View>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>

        {/* Metric pills */}
        <View style={styles.metricPills}>
          <View style={[styles.metricPill, { backgroundColor: C.coral + '20' }]}>
            <Text style={styles.metricPillText}>🤕 {entry.pain}</Text>
          </View>
          <View style={[styles.metricPill, { backgroundColor: C.amber + '20' }]}>
            <Text style={styles.metricPillText}>⚡ {entry.energy}</Text>
          </View>
          <View style={[styles.metricPill, { backgroundColor: C.mint + '20' }]}>
            <Text style={styles.metricPillText}>😊 {entry.mood}</Text>
          </View>
          <View style={[styles.metricPill, { backgroundColor: C.teal + '20' }]}>
            <Text style={styles.metricPillText}>😴 {entry.sleepHrs}h</Text>
          </View>
        </View>

        {/* Expanded detail */}
        {expanded && (
          <View style={styles.detail}>
            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sleep quality</Text>
              <Text style={styles.detailValue}>{entry.sleepQuality}/10</Text>
            </View>

            {entry.medications.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Medications</Text>
                <Text style={styles.detailValue}>
                  {entry.medications.join(', ')}
                </Text>
              </View>
            )}

            {entry.foodTags.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Food & drink</Text>
                <Text style={styles.detailValue}>
                  {entry.foodTags.join(', ')}
                </Text>
              </View>
            )}

            {entry.notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesQuote}>📓</Text>
                <Text style={styles.notesText}>{entry.notes}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>📅</Text>
      <Text style={styles.emptyTitle}>No entries yet</Text>
      <Text style={styles.emptySubtitle}>
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

  useEffect(() => {
    loadEntries();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadEntries();
  }

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color={C.teal} size="large" />
        <Text style={styles.loadingText}>Loading your history...</Text>
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
      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <CalendarHeatmap entries={entries} />
          <Text style={styles.sectionHeader}>Past Entries</Text>
          <Text style={styles.sectionSub}>Pull down to refresh · Tap to expand</Text>
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const heatStyles = StyleSheet.create({
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textWhite,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: C.textDim,
    marginTop: 2,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    color: C.textDim,
    fontWeight: '500',
    marginTop: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 10,
    color: C.textDim,
    fontWeight: '700',
  },
  cell: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  legendCell: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendLabel: {
    fontSize: 10,
    color: C.textDim,
    fontWeight: '500',
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    padding: 16,
    paddingTop: 12,
  },
  loadingState: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: C.textMid,
    fontSize: 14,
    fontWeight: '500',
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
  sectionSub: {
    fontSize: 11,
    color: C.textDim,
    fontWeight: '500',
    marginBottom: 14,
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
  cardBar: {
    width: 4,
  },
  cardInner: {
    flex: 1,
    padding: 14,
  },
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
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textWhite,
    letterSpacing: -0.2,
  },
  cardSubdate: {
    fontSize: 11,
    color: C.textDim,
    marginTop: 1,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 10,
    color: C.textDim,
  },
  metricPills: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  metricPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  metricPillText: {
    fontSize: 12,
    color: C.textWhite,
    fontWeight: '600',
  },

  // Expanded detail
  detail: {
    marginTop: 10,
  },
  detailDivider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: C.textDim,
    fontWeight: '600',
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
  notesQuote: {
    fontSize: 14,
  },
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
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.textWhite,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.textDim,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
});