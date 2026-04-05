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

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Streak Banner ────────────────────────────────────────────────────────────

function StreakBanner({ streak }: { streak: StreakData }) {
  const { currentStreak, longestStreak } = streak;

  return (
    <View style={streakStyles.container}>
      <View style={streakStyles.left}>
        <Text style={streakStyles.fire}>🔥</Text>
        <View>
          <Text style={streakStyles.count}>
            {currentStreak} day{currentStreak !== 1 ? 's' : ''}
          </Text>
          <Text style={streakStyles.label}>current streak</Text>
        </View>
      </View>
      <View style={streakStyles.divider} />
      <View style={streakStyles.right}>
        <Text style={streakStyles.bestCount}>{longestStreak}</Text>
        <Text style={streakStyles.label}>best streak</Text>
      </View>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SliderRow({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  emoji,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  emoji: string;
}) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>
          {emoji} {value}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#6C63FF"
        maximumTrackTintColor="#ddd"
        thumbTintColor="#6C63FF"
      />
      <View style={styles.sliderEndLabels}>
        <Text style={styles.sliderEndText}>{min}</Text>
        <Text style={styles.sliderEndText}>{max}</Text>
      </View>
    </View>
  );
}

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onAdd(trimmed);
    setInput('');
  }

  return (
    <View>
      <View style={styles.tagInputRow}>
        <TextInput
          style={styles.tagTextInput}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tagList}>
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={styles.tag}
            onPress={() => onRemove(tag)}
          >
            <Text style={styles.tagText}>{tag} ✕</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function LogScreen() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    lastLoggedDate: null,
    longestStreak: 0,
  });

  const [entry, setEntry] = useState<LogEntry>({
    pain: 0,
    energy: 5,
    mood: 5,
    sleepHrs: 7,
    sleepQuality: 5,
    notes: '',
    medications: [],
    foodTags: [],
  });

  useEffect(() => {
    getStreak().then(setStreak);
  }, []);

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
    console.log('Entry to save:', entry);

    if (updated.currentStreak > 1) {
      Alert.alert(
        `${updated.currentStreak} day streak! 🔥`,
        updated.currentStreak === 7
          ? 'One week logged. Your first AI insights are ready in the Insights tab!'
          : "You're on a roll. Keep it up.",
        [{ text: "Let's go" }]
      );
    } else {
      Alert.alert(
        'Entry saved! ✓',
        'Your symptoms have been logged for today.',
        [{ text: 'OK' }]
      );
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Date */}
      <Text style={styles.dateText}>{today}</Text>

      {/* Streak */}
      <StreakBanner streak={streak} />

      {/* How are you feeling */}
      <SectionHeader title="How are you feeling?" />

      <SliderRow
        label="Pain"
        value={entry.pain}
        onChange={(v) => update('pain', v)}
        emoji="🤕"
      />
      <SliderRow
        label="Energy"
        value={entry.energy}
        onChange={(v) => update('energy', v)}
        emoji="⚡"
      />
      <SliderRow
        label="Mood"
        value={entry.mood}
        onChange={(v) => update('mood', v)}
        emoji="😊"
      />

      {/* Sleep */}
      <SectionHeader title="Sleep" />

      <SliderRow
        label="Hours slept"
        value={entry.sleepHrs}
        onChange={(v) => update('sleepHrs', v)}
        min={0}
        max={12}
        emoji="🕐"
      />
      <SliderRow
        label="Sleep quality"
        value={entry.sleepQuality}
        onChange={(v) => update('sleepQuality', v)}
        emoji="😴"
      />

      {/* Medications */}
      <SectionHeader title="Medications taken today" />
      <TagInput
        tags={entry.medications}
        onAdd={(tag) => addTag('medications', tag)}
        onRemove={(tag) => removeTag('medications', tag)}
        placeholder="e.g. Ibuprofen, Vitamin D..."
      />

      {/* Food */}
      <SectionHeader title="Food & drink" />
      <TagInput
        tags={entry.foodTags}
        onAdd={(tag) => addTag('foodTags', tag)}
        onRemove={(tag) => removeTag('foodTags', tag)}
        placeholder="e.g. coffee, gluten, alcohol..."
      />

      {/* Notes */}
      <SectionHeader title="Anything else?" />
      <TextInput
        style={styles.notesInput}
        value={entry.notes}
        onChangeText={(v) => update('notes', v)}
        placeholder="Free notes — symptoms, events, anything worth remembering..."
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={4}
      />

      {/* Submit */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Save today's entry</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const streakStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fire: {
    fontSize: 28,
  },
  count: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF7043',
  },
  label: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  right: {
    alignItems: 'center',
  },
  bestCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6C63FF',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7FB',
  },
  content: {
    padding: 20,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C63FF',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 28,
    marginBottom: 12,
  },
  sliderRow: {
    marginBottom: 16,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#555',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderEndLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderEndText: {
    fontSize: 11,
    color: '#aaa',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tagTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#EAE9FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: '#6C63FF',
    fontSize: 13,
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 40,
  },
});