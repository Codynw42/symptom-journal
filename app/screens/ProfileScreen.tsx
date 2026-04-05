import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomField {
  id: string;
  label: string;
  type: 'scale' | 'boolean' | 'text';
}

interface NotificationSettings {
  enabled: boolean;
  time: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({
  label,
  subtitle,
  right,
}: {
  label: string;
  subtitle?: string;
  right: React.ReactNode;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

function CustomFieldRow({
  field,
  onRemove,
}: {
  field: CustomField;
  onRemove: () => void;
}) {
  const typeLabel = { scale: '0–10 Scale', boolean: 'Yes / No', text: 'Free text' }[field.type];
  const typeColor = { scale: '#6C63FF', boolean: '#4CAF50', text: '#FFC107' }[field.type];

  return (
    <View style={styles.customFieldRow}>
      <View style={styles.customFieldLeft}>
        <Text style={styles.customFieldLabel}>{field.label}</Text>
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '22' }]}>
          <Text style={[styles.typeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    enabled: true,
    time: '8:00 PM',
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([
    { id: '1', label: 'Stress', type: 'scale' },
    { id: '2', label: 'Exercised today', type: 'boolean' },
  ]);

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomField['type']>('scale');
  const [showAddField, setShowAddField] = useState(false);

  const NOTIFICATION_TIMES = [
    '7:00 AM', '8:00 AM', '9:00 AM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM',
  ];

  function handleAddField() {
    const label = newFieldLabel.trim();
    if (!label) return;
    if (customFields.find((f) => f.label.toLowerCase() === label.toLowerCase())) {
      Alert.alert('Already exists', 'You already have a field with that name.');
      return;
    }
    setCustomFields((prev) => [
      ...prev,
      { id: Date.now().toString(), label, type: newFieldType },
    ]);
    setNewFieldLabel('');
    setNewFieldType('scale');
    setShowAddField(false);
  }

  function handleRemoveField(id: string) {
    Alert.alert(
      'Remove field?',
      'This will remove the field from future entries. Past data is unaffected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setCustomFields((prev) => prev.filter((f) => f.id !== id)),
        },
      ]
    );
  }

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => {} },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.userName}>Your Account</Text>
        <Text style={styles.userEmail}>user@email.com</Text>
      </View>

      {/* Notifications */}
      <SectionHeader title="Daily Reminder" />
      <View style={styles.card}>
        <SettingRow
          label="Reminder enabled"
          subtitle="Get nudged to log each day"
          right={
            <Switch
              value={notifications.enabled}
              onValueChange={(v) =>
                setNotifications((prev) => ({ ...prev, enabled: v }))
              }
              trackColor={{ false: '#ddd', true: '#6C63FF' }}
              thumbColor="#fff"
            />
          }
        />

        {notifications.enabled && (
          <>
            <View style={styles.divider} />
            <Text style={styles.timePickerLabel}>Reminder time</Text>
            <View style={styles.timeGrid}>
              {NOTIFICATION_TIMES.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeChip,
                    notifications.time === time && styles.timeChipActive,
                  ]}
                  onPress={() =>
                    setNotifications((prev) => ({ ...prev, time }))
                  }
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      notifications.time === time && styles.timeChipTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Custom Fields */}
      <SectionHeader title="Custom Tracking Fields" />
      <Text style={styles.sectionSubtitle}>
        Add anything you want to track that isn't in the default log.
      </Text>

      <View style={styles.card}>
        {customFields.length === 0 && (
          <Text style={styles.emptyText}>No custom fields yet.</Text>
        )}
        {customFields.map((field, index) => (
          <View key={field.id}>
            {index > 0 && <View style={styles.divider} />}
            <CustomFieldRow
              field={field}
              onRemove={() => handleRemoveField(field.id)}
            />
          </View>
        ))}

        {/* Add field form */}
        {showAddField && (
          <>
            <View style={styles.divider} />
            <Text style={styles.addFieldLabel}>Field name</Text>
            <TextInput
              style={styles.addFieldInput}
              value={newFieldLabel}
              onChangeText={setNewFieldLabel}
              placeholder="e.g. Anxiety, Steps walked, Nausea..."
              placeholderTextColor="#aaa"
              autoFocus
            />
            <Text style={styles.addFieldLabel}>Field type</Text>
            <View style={styles.typeRow}>
              {(['scale', 'boolean', 'text'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    newFieldType === type && styles.typeChipActive,
                  ]}
                  onPress={() => setNewFieldType(type)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      newFieldType === type && styles.typeChipTextActive,
                    ]}
                  >
                    {type === 'scale' ? '0–10 Scale' : type === 'boolean' ? 'Yes / No' : 'Free text'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.addFieldButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddField(false);
                  setNewFieldLabel('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveFieldButton}
                onPress={handleAddField}
              >
                <Text style={styles.saveFieldButtonText}>Add field</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {!showAddField && (
          <>
            {customFields.length > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              style={styles.addFieldTrigger}
              onPress={() => setShowAddField(true)}
            >
              <Text style={styles.addFieldTriggerText}>＋ Add custom field</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Data & Privacy */}
      <SectionHeader title="Data & Privacy" />
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => Alert.alert('Export', 'PDF export coming soon!')}
        >
          <Text style={styles.actionText}>📄 Export my data</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() =>
            Alert.alert(
              'Delete all data',
              'This will permanently delete all your entries and insights. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete everything', style: 'destructive', onPress: () => {} },
              ]
            )
          }
        >
          <Text style={[styles.actionText, { color: '#F44336' }]}>
            🗑️ Delete all my data
          </Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Symptom Journal v0.1.0</Text>

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

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EAE9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 32,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  userEmail: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 2,
  },

  // Section
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 28,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 10,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },

  // Time picker
  timePickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  timeChipActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#6C63FF',
  },
  timeChipText: {
    fontSize: 13,
    color: '#555',
  },
  timeChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Custom fields
  customFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customFieldLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  typeBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  removeButton: {
    padding: 6,
  },
  removeButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Add field form
  addFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  addFieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 14,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  typeChipActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#EAE9FF',
  },
  typeChipText: {
    fontSize: 12,
    color: '#555',
  },
  typeChipTextActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  addFieldButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '600',
  },
  saveFieldButton: {
    flex: 1,
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveFieldButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  addFieldTrigger: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  addFieldTriggerText: {
    color: '#6C63FF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  actionChevron: {
    fontSize: 20,
    color: '#ccc',
  },

  // Sign out
  signOutButton: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    color: '#F44336',
    fontWeight: '700',
    fontSize: 15,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#ccc',
    marginTop: 20,
  },
});