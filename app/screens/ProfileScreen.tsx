import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { fetchCurrentUser, signOut } from '../lib/db';

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

function SectionHeader({ emoji, title, subtitle }: {
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
        {subtitle && <Text style={styles.settingSub}>{subtitle}</Text>}
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
  const typeConfig = {
    scale:   { label: '0–10 Scale', color: C.teal },
    boolean: { label: 'Yes / No',   color: C.mint },
    text:    { label: 'Free text',  color: C.amber },
  }[field.type];

  return (
    <View style={styles.customFieldRow}>
      <View style={styles.customFieldLeft}>
        <Text style={styles.customFieldLabel}>{field.label}</Text>
        <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '20', borderColor: typeConfig.color + '50' }]}>
          <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
            {typeConfig.label}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen({ onSignOut }: { onSignOut?: () => void }) {
  const [user, setUser] = useState<{ email: string; $id: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

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

  useEffect(() => {
    fetchCurrentUser()
      .then((u) => setUser({ email: u.email, $id: u.$id }))
      .catch(() => setUser(null))
      .finally(() => setLoadingUser(false));
  }, []);

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

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
            onSignOut?.();
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Could not sign out.');
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar section */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatarBlob} />
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        </View>
        {loadingUser ? (
          <ActivityIndicator color={C.teal} style={{ marginTop: 12 }} />
        ) : (
          <>
            <Text style={styles.userName}>{user?.email ?? 'Unknown'}</Text>
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>✦ Symptom Journal Member</Text>
            </View>
          </>
        )}
      </View>

      {/* Notifications */}
      <SectionHeader emoji="🔔" title="Daily Reminder" subtitle="Never miss a log" />
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
              trackColor={{ false: C.border, true: C.teal + '80' }}
              thumbColor={notifications.enabled ? C.teal : C.textDim}
            />
          }
        />

        {notifications.enabled && (
          <>
            <View style={styles.divider} />
            <Text style={styles.timeLabel}>Reminder time</Text>
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
                  <Text style={[
                    styles.timeChipText,
                    notifications.time === time && styles.timeChipTextActive,
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Custom Fields */}
      <SectionHeader
        emoji="⚙️"
        title="Custom Fields"
        subtitle="Track anything beyond the defaults"
      />
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

        {showAddField && (
          <>
            <View style={styles.divider} />
            <Text style={styles.addFieldLabel}>Field name</Text>
            <TextInput
              style={styles.addFieldInput}
              value={newFieldLabel}
              onChangeText={setNewFieldLabel}
              placeholder="e.g. Anxiety, Steps walked..."
              placeholderTextColor={C.textDim}
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
                  <Text style={[
                    styles.typeChipText,
                    newFieldType === type && styles.typeChipTextActive,
                  ]}>
                    {type === 'scale' ? '0–10' : type === 'boolean' ? 'Yes/No' : 'Text'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.addFieldBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowAddField(false); setNewFieldLabel(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddField}>
                <Text style={styles.saveBtnText}>Add field</Text>
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
      <SectionHeader emoji="🔒" title="Data & Privacy" />
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => Alert.alert('Coming soon', 'PDF export will be available in the next update.')}
        >
          <Text style={styles.actionIcon}>📄</Text>
          <View style={styles.actionText}>
            <Text style={styles.actionLabel}>Export my data</Text>
            <Text style={styles.actionSub}>Download a PDF report for your doctor</Text>
          </View>
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
          <Text style={styles.actionIcon}>🗑️</Text>
          <View style={styles.actionText}>
            <Text style={[styles.actionLabel, { color: C.coral }]}>Delete all my data</Text>
            <Text style={styles.actionSub}>Permanently removes all entries</Text>
          </View>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={handleSignOut}
        disabled={signingOut}
      >
        {signingOut ? (
          <ActivityIndicator color={C.coral} />
        ) : (
          <Text style={styles.signOutText}>Sign out</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.version}>Symptom Journal v0.1.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingTop: 12 },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  avatarOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 90,
  },
  avatarBlob: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: C.teal,
    opacity: 0.15,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.teal + '60',
  },
  avatarEmoji: {
    fontSize: 28,
    fontWeight: '800',
    color: C.teal,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textWhite,
    marginTop: 14,
    letterSpacing: -0.3,
  },
  userBadge: {
    backgroundColor: C.teal + '15',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 6,
    borderWidth: 1,
    borderColor: C.teal + '30',
  },
  userBadgeText: {
    fontSize: 11,
    color: C.teal,
    fontWeight: '600',
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
  },

  // Card
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: { flex: 1, marginRight: 12 },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textWhite,
  },
  settingSub: {
    fontSize: 11,
    color: C.textDim,
    marginTop: 2,
  },

  // Time picker
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMid,
    marginBottom: 10,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: C.bgCardAlt,
  },
  timeChipActive: {
    borderColor: C.teal,
    backgroundColor: C.teal + '20',
  },
  timeChipText: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '500',
  },
  timeChipTextActive: {
    color: C.teal,
    fontWeight: '700',
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
    color: C.textWhite,
  },
  typeBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  removeBtn: { padding: 6 },
  removeBtnText: { color: C.textDim, fontSize: 13 },
  emptyText: {
    fontSize: 13,
    color: C.textDim,
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Add field form
  addFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMid,
    marginBottom: 8,
  },
  addFieldInput: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: C.textWhite,
    backgroundColor: C.bgCardAlt,
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
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: C.bgCardAlt,
  },
  typeChipActive: {
    borderColor: C.teal,
    backgroundColor: C.teal + '15',
  },
  typeChipText: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: C.teal,
    fontWeight: '700',
  },
  addFieldBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: C.textMid,
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: C.teal,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: C.bg,
    fontWeight: '800',
    fontSize: 14,
  },
  addFieldTrigger: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  addFieldTriggerText: {
    color: C.teal,
    fontWeight: '700',
    fontSize: 14,
  },

  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: { fontSize: 20 },
  actionText: { flex: 1 },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textWhite,
  },
  actionSub: {
    fontSize: 11,
    color: C.textDim,
    marginTop: 1,
  },
  actionChevron: {
    fontSize: 20,
    color: C.textDim,
  },

  // Sign out
  signOutBtn: {
    marginTop: 28,
    borderWidth: 1.5,
    borderColor: C.coral + '60',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: C.coral + '10',
  },
  signOutText: {
    color: C.coral,
    fontWeight: '800',
    fontSize: 15,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: C.textDim,
    marginTop: 20,
    fontWeight: '500',
  },
});