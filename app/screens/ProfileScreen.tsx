import { useEffect, useRef, useState } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { fetchCurrentUser, signOut, fetchEntries } from '../lib/db';
import { generateAndSharePDF } from '../lib/pdf';

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

interface CustomField {
  id: string;
  label: string;
  type: 'scale' | 'boolean' | 'text';
}

interface NotificationSettings {
  enabled: boolean;
  time: string;
}

// ─── Pulse Ring ───────────────────────────────────────────────────────────────

function PulseRing({ size, color, style }: { size: number; color: string; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.3, duration: 3400, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 3400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.06, duration: 3400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 3400, useNativeDriver: true }),
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

function ScreenHeader({ email }: { email: string }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const initial = email?.[0]?.toUpperCase() ?? '?';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={headerStyles.outer}>
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <PulseRing size={130} color={C.mint} style={headerStyles.ring1} />
        <PulseRing size={70} color={C.teal} style={headerStyles.ring2} />

        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => (
            <View key={`${row}-${col}`} style={{
              position: 'absolute',
              top: 10 + row * 18,
              right: 14 + col * 18,
              width: 2, height: 2,
              borderRadius: 1,
              backgroundColor: C.mint,
              opacity: 0.1,
            }} />
          ))
        )}

        {[
          { top: 16, left: width * 0.5, color: C.mint },
          { top: 42, left: width * 0.62, color: C.teal },
          { top: 26, left: width * 0.44, color: C.amber },
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
          {[0, 2, 5, 2, 14, 26, 14, 2, 5, 2, 0, 2, 0].map((h, i) => (
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
        <View style={headerStyles.avatarRow}>
          <View style={headerStyles.avatarOuter}>
            <View style={headerStyles.avatarRing} />
            <View style={headerStyles.avatarRingInner} />
            <View style={headerStyles.avatar}>
              <Text style={headerStyles.avatarInitial}>{initial}</Text>
            </View>
          </View>
          <View style={headerStyles.avatarInfo}>
            <View style={headerStyles.labelPill}>
              <Text style={headerStyles.labelText}>◆ MEMBER</Text>
            </View>
            <Text style={headerStyles.email}>{email || '...'}</Text>
          </View>
        </View>

        <View style={headerStyles.accentRow}>
          <View style={headerStyles.accentLine} />
          <Text style={headerStyles.accentDiamond}>◆</Text>
          <View style={headerStyles.accentLine} />
        </View>

        <Text style={headerStyles.title}>YOUR{'\n'}PROFILE</Text>
      </Animated.View>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function Section({ emoji, title, subtitle }: {
  emoji: string; title: string; subtitle?: string;
}) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionIconBox}>
        <Text style={styles.sectionIcon}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
      </View>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ─── Custom Field Row ─────────────────────────────────────────────────────────

function CustomFieldRow({ field, onRemove }: {
  field: CustomField; onRemove: () => void;
}) {
  const cfg = {
    scale:   { label: '0–10 SCALE', color: C.teal },
    boolean: { label: 'YES / NO',   color: C.mint },
    text:    { label: 'FREE TEXT',  color: C.amber },
  }[field.type];

  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLeft}>
        <View style={[styles.fieldDot, { backgroundColor: cfg.color }]} />
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <View style={[styles.fieldBadge, {
          backgroundColor: cfg.color + '18',
          borderColor: cfg.color + '40',
        }]}>
          <Text style={[styles.fieldBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.fieldRemoveBtn}>
        <Text style={styles.fieldRemoveText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen({ onSignOut }: { onSignOut?: () => void }) {
  const [user, setUser] = useState<{ email: string; $id: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const TIMES = [
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

  async function handleExport() {
    setExporting(true);
    try {
      const entries = await fetchEntries();
      if (entries.length === 0) {
        Alert.alert('No data yet', 'Log at least one entry before exporting.');
        return;
      }
      await generateAndSharePDF(entries, 30);
    } catch (e: any) {
      Alert.alert('Export failed', e.message ?? 'Could not generate PDF.');
    } finally {
      setExporting(false);
    }
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
      <ScreenHeader email={loadingUser ? '...' : (user?.email ?? 'Unknown')} />

      {/* Notifications */}
      <Section emoji="🔔" title="DAILY REMINDER" subtitle="Never miss a log" />
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingLabel}>Reminder enabled</Text>
            <Text style={styles.settingSub}>Get nudged to log each day</Text>
          </View>
          <Switch
            value={notifications.enabled}
            onValueChange={(v) => setNotifications((p) => ({ ...p, enabled: v }))}
            trackColor={{ false: C.border, true: C.teal + '60' }}
            thumbColor={notifications.enabled ? C.teal : C.textDim}
          />
        </View>

        {notifications.enabled && (
          <>
            <View style={styles.divider} />
            <Text style={styles.timeLabel}>REMINDER TIME</Text>
            <View style={styles.timeGrid}>
              {TIMES.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeChip,
                    notifications.time === time && styles.timeChipActive,
                  ]}
                  onPress={() => setNotifications((p) => ({ ...p, time }))}
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
      <Section emoji="⚙️" title="CUSTOM FIELDS" subtitle="Track anything beyond the defaults" />
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
            <Text style={styles.addLabel}>FIELD NAME</Text>
            <TextInput
              style={styles.addInput}
              value={newFieldLabel}
              onChangeText={setNewFieldLabel}
              placeholder="e.g. Anxiety, Steps walked..."
              placeholderTextColor={C.textDim}
              autoFocus
            />
            <Text style={styles.addLabel}>FIELD TYPE</Text>
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
                    {type === 'scale' ? '0–10' : type === 'boolean' ? 'YES/NO' : 'TEXT'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.addBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowAddField(false); setNewFieldLabel(''); }}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddField}>
                <Text style={styles.saveBtnText}>ADD FIELD</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {!showAddField && (
          <>
            {customFields.length > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              style={styles.addTrigger}
              onPress={() => setShowAddField(true)}
            >
              <Text style={styles.addTriggerText}>◆ ADD CUSTOM FIELD</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Data & Privacy */}
      <Section emoji="🔒" title="DATA & PRIVACY" />
      <View style={styles.card}>

        {/* Export */}
        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleExport}
          disabled={exporting}
        >
          <View style={[styles.actionIconBox, {
            borderColor: C.teal + '40',
            backgroundColor: C.teal + '10',
          }]}>
            {exporting
              ? <ActivityIndicator size="small" color={C.teal} />
              : <Text style={styles.actionIcon}>📄</Text>
            }
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionLabel}>
              {exporting ? 'Generating PDF...' : 'Export my data'}
            </Text>
            <Text style={styles.actionSub}>Download a PDF report for your doctor</Text>
          </View>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Delete */}
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
          <View style={[styles.actionIconBox, {
            borderColor: C.coral + '40',
            backgroundColor: C.coral + '10',
          }]}>
            <Text style={styles.actionIcon}>🗑️</Text>
          </View>
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
        activeOpacity={0.85}
      >
        {signingOut ? (
          <ActivityIndicator color={C.coral} />
        ) : (
          <Text style={styles.signOutText}>◆ SIGN OUT ◆</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.version}>◆ SYMPTOM JOURNAL V0.1.0 ◆</Text>
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
  hbBar: { width: 3, backgroundColor: C.mint, borderRadius: 2 },
  content: { padding: 22, paddingBottom: 20 },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarOuter: {
    width: 64, height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: 64, height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: C.mint + '50',
  },
  avatarRingInner: {
    position: 'absolute',
    width: 52, height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: C.mint + '25',
    backgroundColor: C.mint + '05',
  },
  avatar: {
    width: 42, height: 42,
    borderRadius: 14,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.mint + '60',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '900',
    color: C.mint,
  },
  avatarInfo: { flex: 1 },
  labelPill: {
    alignSelf: 'flex-start',
    backgroundColor: C.mint + '12',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.mint + '30',
    marginBottom: 6,
  },
  labelText: {
    color: C.mint,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },
  email: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textWhite,
    letterSpacing: -0.2,
  },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  accentLine: { height: 1, width: 30, backgroundColor: C.mint, opacity: 0.5 },
  accentDiamond: { fontSize: 8, color: C.mint, opacity: 0.8 },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: C.textWhite,
    letterSpacing: 4,
    lineHeight: 38,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingTop: 12 },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionIconBox: {
    width: 32, height: 32,
    borderRadius: 10,
    backgroundColor: C.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionIcon: { fontSize: 15 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: C.textWhite,
    letterSpacing: 3,
  },
  sectionSub: {
    fontSize: 11,
    color: C.textDim,
    marginTop: 1,
    fontWeight: '500',
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: C.border },

  card: {
    backgroundColor: C.bgCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: { flex: 1, marginRight: 12 },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textWhite,
  },
  settingSub: { fontSize: 11, color: C.textDim, marginTop: 2 },

  timeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textDim,
    letterSpacing: 2,
    marginBottom: 10,
  },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    backgroundColor: C.teal + '18',
  },
  timeChipText: { fontSize: 12, color: C.textMid, fontWeight: '500' },
  timeChipTextActive: { color: C.teal, fontWeight: '800' },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldDot: { width: 6, height: 6, borderRadius: 3, opacity: 0.7 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: C.textWhite },
  fieldBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  fieldBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  fieldRemoveBtn: { padding: 6 },
  fieldRemoveText: { color: C.textDim, fontSize: 12 },
  emptyText: {
    fontSize: 13,
    color: C.textDim,
    textAlign: 'center',
    paddingVertical: 8,
  },

  addLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textDim,
    letterSpacing: 2,
    marginBottom: 8,
  },
  addInput: {
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
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
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
  typeChipText: { fontSize: 10, color: C.textMid, fontWeight: '700', letterSpacing: 1 },
  typeChipTextActive: { color: C.teal },
  addBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { color: C.textMid, fontWeight: '800', fontSize: 11, letterSpacing: 2 },
  saveBtn: {
    flex: 1,
    backgroundColor: C.teal,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: C.bg, fontWeight: '900', fontSize: 11, letterSpacing: 2 },
  addTrigger: { alignItems: 'center', paddingVertical: 4 },
  addTriggerText: { color: C.teal, fontWeight: '800', fontSize: 12, letterSpacing: 2 },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBox: {
    width: 38, height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionIcon: { fontSize: 18 },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 14, fontWeight: '700', color: C.textWhite },
  actionSub: { fontSize: 11, color: C.textDim, marginTop: 1 },
  actionChevron: { fontSize: 20, color: C.textDim },

  signOutBtn: {
    marginTop: 28,
    borderWidth: 1.5,
    borderColor: C.coral + '50',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: C.coral + '08',
  },
  signOutText: { color: C.coral, fontWeight: '900', fontSize: 13, letterSpacing: 3 },
  version: {
    textAlign: 'center',
    fontSize: 9,
    color: C.textDim,
    marginTop: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
});