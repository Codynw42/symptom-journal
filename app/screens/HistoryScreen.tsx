import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  pain: number;
  energy: number;
  mood: number;
  sleepHrs: number;
  sleepQuality: number;
  notes: string;
  medications: string[];
  foodTags: string[];
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_ENTRIES: Entry[] = [
  {
    id: '1',
    date: '2026-04-05',
    pain: 3,
    energy: 7,
    mood: 8,
    sleepHrs: 7.5,
    sleepQuality: 8,
    notes: 'Felt pretty good today. Went for a walk.',
    medications: ['Vitamin D'],
    foodTags: ['coffee', 'salad'],
  },
  {
    id: '2',
    date: '2026-04-04',
    pain: 6,
    energy: 4,
    mood: 5,
    sleepHrs: 5,
    sleepQuality: 4,
    notes: 'Bad night sleep. Headache most of the day.',
    medications: ['Ibuprofen', 'Vitamin D'],
    foodTags: ['coffee', 'alcohol', 'pizza'],
  },
  {
    id: '3',
    date: '2026-04-03',
    pain: 2,
    energy: 8,
    mood: 9,
    sleepHrs: 8,
    sleepQuality: 9,
    notes: 'Great day. Full night of sleep made a huge difference.',
    medications: ['Vitamin D'],
    foodTags: ['water', 'salad', 'fruit'],
  },
  {
    id: '4',
    date: '2026-04-02',
    pain: 5,
    energy: 5,
    mood: 6,
    sleepHrs: 6,
    sleepQuality: 5,
    notes: '',
    medications: [],
    foodTags: ['coffee', 'fast food'],
  },
  {
    id: '5',
    date: '2026-04-01',
    pain: 7,
    energy: 3,
    mood: 4,
    sleepHrs: 4.5,
    sleepQuality: 3,
    notes: 'Rough day. Pain was bad in the morning.',
    medications: ['Ibuprofen'],
    foodTags: ['alcohol', 'coffee'],
  },
  {
    id: '6',
    date: '2026-03-31',
    pain: 1,
    energy: 9,
    mood: 9,
    sleepHrs: 9,
    sleepQuality: 9,
    notes: 'Best day in weeks.',
    medications: ['Vitamin D'],
    foodTags: ['water', 'fruit', 'vegetables'],
  },
  {
    id: '7',
    date: '2026-03-30',
    pain: 4,
    energy: 6,
    mood: 7,
    sleepHrs: 7,
    sleepQuality: 7,
    notes: '',
    medications: ['Vitamin D'],
    foodTags: ['coffee'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Overall wellness score — higher pain is bad, higher energy/mood is good
function wellnessScore(entry: Entry): number {
  return Math.round(
    ((10 - entry.pain) + entry.energy + entry.mood) / 3
  );
}

function scoreToColor(score: number): string {
  if (score >= 8) return '#4CAF50'; // green
  if (score >= 6) return '#8BC34A'; // light green
  if (score >= 4) return '#FFC107'; // amber
  if (score >= 2) return '#FF7043'; // orange
  return '#F44336';                 // red
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Calendar Heatmap ────────────────────────────────────────────────────────

function CalendarHeatmap({ entries }: { entries: Entry[] }) {
  const entryMap = Object.fromEntries(
    entries.map((e) => [e.date, e])
  );

  // Build last 35 days (5 weeks)
  const days: (Entry | null)[] = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push(entryMap[key] ?? null);
  }

  const weeks: (Entry | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.heatmapContainer}>
      <Text style={styles.heatmapTitle}>Last 5 Weeks</Text>

      {/* Day labels */}
      <View style={styles.heatmapRow}>
        {dayLabels.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.heatmapRow}>
          {week.map((entry, di) => {
            const score = entry ? wellnessScore(entry) : null;
            return (
              <View
                key={di}
                style={[
                  styles.heatmapCell,
                  {
                    backgroundColor: score !== null
                      ? scoreToColor(score)
                      : '#EBEBEB',
                  },
                ]}
              />
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.legendRow}>
        <Text style={styles.legendLabel}>Worse</Text>
        {['#F44336', '#FF7043', '#FFC107', '#8BC34A', '#4CAF50'].map((c) => (
          <View key={c} style={[styles.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={styles.legendLabel}>Better</Text>
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
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.scoreCircle, { backgroundColor: color }]}>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
          <Text style={styles.cardDate}>{formatDisplayDate(entry.date)}</Text>
        </View>
        <View style={styles.cardStats}>
          <Text style={styles.cardStat}>🤕 {entry.pain}</Text>
          <Text style={styles.cardStat}>⚡ {entry.energy}</Text>
          <Text style={styles.cardStat}>😊 {entry.mood}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </View>

      {/* Expanded Detail */}
      {expanded && (
        <View style={styles.cardDetail}>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sleep</Text>
            <Text style={styles.detailValue}>
              {entry.sleepHrs}hrs · Quality {entry.sleepQuality}/10
            </Text>
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
              <Text style={styles.notesText}>"{entry.notes}"</Text>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const sorted = [...DUMMY_ENTRIES].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <CalendarHeatmap entries={DUMMY_ENTRIES} />
      <Text style={styles.sectionHeader}>Past Entries</Text>
      {sorted.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
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
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 28,
    marginBottom: 12,
  },

  // Heatmap
  heatmapContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  heatmapTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    color: '#aaa',
    fontWeight: '600',
  },
  heatmapCell: {
    width: 36,
    height: 36,
    borderRadius: 8,
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
  },
  legendLabel: {
    fontSize: 11,
    color: '#aaa',
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  scoreCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cardStats: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  cardStat: {
    fontSize: 12,
    color: '#777',
  },
  chevron: {
    fontSize: 12,
    color: '#aaa',
  },
  cardDetail: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#555',
    flex: 1,
    textAlign: 'right',
  },
  notesBox: {
    backgroundColor: '#F7F7FB',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  notesText: {
    fontSize: 13,
    color: '#777',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});