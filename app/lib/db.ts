import { databases, account, ID, Query, DB_ID, COLLECTIONS } from './appwrite';
import { Permission, Role } from 'react-native-appwrite';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const user = await account.get();
  return user.$id;
}

function userPermissions(userId: string) {
  return [
    Permission.read(Role.user(userId)),
    Permission.create(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Entries ──────────────────────────────────────────────────────────────────

export interface EntryPayload {
  pain: number;
  energy: number;
  mood: number;
  sleepHrs: number;
  sleepQuality: number;
  notes: string;
  medications: string[];
  foodTags: string[];
}

export async function saveEntry(payload: EntryPayload): Promise<void> {
  const userId = await getUserId();
  const date = todayString();
  const perms = userPermissions(userId);

  // Check if entry already exists for today
  const existing = await databases.listDocuments(DB_ID, COLLECTIONS.entries, [
    Query.equal('user_id', userId),
    Query.equal('date', date),
  ]);

  let entryId: string;

  if (existing.documents.length > 0) {
    // Update existing entry
    entryId = existing.documents[0].$id;
    await databases.updateDocument(DB_ID, COLLECTIONS.entries, entryId, {
      pain:          payload.pain,
      energy:        payload.energy,
      mood:          payload.mood,
      sleep_hrs:     payload.sleepHrs,
      sleep_quality: payload.sleepQuality,
      notes:         payload.notes,
    });

    // Delete old tags and medications so we can re-create fresh
    const oldTags = await databases.listDocuments(DB_ID, COLLECTIONS.foodTags, [
      Query.equal('entry_id', entryId),
    ]);
    for (const doc of oldTags.documents) {
      await databases.deleteDocument(DB_ID, COLLECTIONS.foodTags, doc.$id);
    }

    const oldMeds = await databases.listDocuments(DB_ID, COLLECTIONS.medications, [
      Query.equal('entry_id', entryId),
    ]);
    for (const doc of oldMeds.documents) {
      await databases.deleteDocument(DB_ID, COLLECTIONS.medications, doc.$id);
    }

  } else {
    // Create new entry
    const entry = await databases.createDocument(
      DB_ID,
      COLLECTIONS.entries,
      ID.unique(),
      {
        user_id:       userId,
        date,
        pain:          payload.pain,
        energy:        payload.energy,
        mood:          payload.mood,
        sleep_hrs:     payload.sleepHrs,
        sleep_quality: payload.sleepQuality,
        notes:         payload.notes,
      },
      perms
    );
    entryId = entry.$id;
  }

  // Save food tags
  for (const tag of payload.foodTags) {
    await databases.createDocument(
      DB_ID,
      COLLECTIONS.foodTags,
      ID.unique(),
      { entry_id: entryId, user_id: userId, tag },
      perms
    );
  }

  // Save medications
  for (const name of payload.medications) {
    await databases.createDocument(
      DB_ID,
      COLLECTIONS.medications,
      ID.unique(),
      { entry_id: entryId, user_id: userId, name, taken: true },
      perms
    );
  }
}

// ─── Fetch entries ────────────────────────────────────────────────────────────

export async function fetchEntries() {
  const userId = await getUserId();

  const entriesDocs = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.entries,
    [
      Query.equal('user_id', userId),
      Query.orderDesc('date'),
      Query.limit(90),
    ]
  );

  // Fetch tags and medications for each entry
  const entries = await Promise.all(
    entriesDocs.documents.map(async (doc) => {
      const tags = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.foodTags,
        [Query.equal('entry_id', doc.$id)]
      );
      const meds = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.medications,
        [Query.equal('entry_id', doc.$id)]
      );

      return {
        id:           doc.$id,
        date:         doc.date,
        pain:         doc.pain,
        energy:       doc.energy,
        mood:         doc.mood,
        sleepHrs:     doc.sleep_hrs,
        sleepQuality: doc.sleep_quality,
        notes:        doc.notes ?? '',
        foodTags:     tags.documents.map((t: any) => t.tag),
        medications:  meds.documents.map((m: any) => m.name),
      };
    })
  );

  return entries;
}

// ─── Fetch current user ───────────────────────────────────────────────────────

export async function fetchCurrentUser() {
  return await account.get();
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signOut() {
  await account.deleteSession('current');
}