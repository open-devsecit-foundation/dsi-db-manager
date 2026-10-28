---
name: db-manager
description: Enterprise-grade offline-first database manager with dual local/server sync, millisecond conflict resolution, and multi-backend support (DSIAPI, Supabase, Firebase RTDB, Firestore, Neon, Direct MySQL, MongoDB).
---

# `db-manager` AI Agent Skill Guide

This document instructs AI agents and developers on how to configure, operate, extend, and troubleshoot the `db-manager` library.

---

## 1. Overview & Capabilities

`db-manager` is an offline-first database synchronization library designed for Web (Next.js/React), Desktop (Electron), and Server (Node.js) applications.

### Key Capabilities:
- **Zero-Downtime Offline Storage**: Performs all reads and writes against high-speed local storage (`IndexedDB` in browsers, `FileStorage` in Electron/Node, or `MemoryStorage`). The UI never hangs or errors when the network drops.
- **7 Pluggable Remote Backends**:
  1. `DsiApiAdapter`: High-performance DevSecIt Rust API Engine (`dsiapi`) with auto-table generation and Bearer token management.
  2. `SupabaseAdapter`: Supabase PostgREST + Realtime backend.
  3. `FirebaseRtdbAdapter`: Firebase Realtime Database REST backend.
  4. `FirestoreAdapter`: Google Cloud Firestore v1 REST backend.
  5. `NeonAdapter`: Neon Serverless Postgres via SQL gateway or pool.
  6. `MysqlAdapter`: Direct MySQL database with automatic table creation.
  7. `MongoDbAdapter`: MongoDB direct driver or Atlas Data API.
- **Millisecond Timestamp Conflict Resolution**:
  - Automatically manages `_createdAt`, `_updatedAt` (epoch in milliseconds), and `_version`.
  - Supports **Last-Write-Wins (LWW)**, **Field-Level Merge**, **Server-Wins**, **Client-Wins**, and **Custom Conflict Callbacks**.
  - Soft-delete tombstone pattern (`_deleted: true`) prevents resurrection of deleted items across offline sync.
- **Durable Sync Queue**:
  - Mutated records are registered in a local FIFO `sync_queue` and synchronized automatically when online.
  - Exponential backoff with retry thresholds and idempotency keys.
- **Pre-Built Healthcare & SaaS Models**:
  - Clinic: `Patient`, `Doctor`, `Appointment`, `Prescription`, `Invoice`, `MedicalRecord`, `Clinic`.
  - Core SaaS: `User`, `AuthSession`, `ActivityLog`, `KeyValue`, `GenericDocument`.

---

## 2. Quickstart for AI Agents

### Basic Initialization (Browser / Electron / Node)

```typescript
import { DbManager, DsiApiAdapter, autoDetectLocalAdapter } from 'db-manager';

const db = new DbManager({
  dbName: 'clinic_db',
  // 1. Choose or switch any remote backend adapter:
  remote: new DsiApiAdapter({
    endpoint: 'http://localhost:8899',
    credentials: {
      dbName: 'clinic_db',
      dbPass: 'secure_password',
      user: 'root',
    },
  }),
  // 2. Local storage auto-detects IndexedDB in browser, FileStorage in Node:
  local: autoDetectLocalAdapter('clinic_db'),
  // 3. Offline Sync Configuration:
  sync: {
    autoSyncOnOnline: true,
    syncIntervalMs: 15000,
    conflictStrategy: 'last-write-wins',
  },
});

// Always initialize before first query
await db.init();
```

---

## 3. Remote Adapter Recipes

### 1. DSIAPI (DevSecIt Rust API Engine)
The DSIAPI engine runs locally (or remotely) at `http://localhost:8899/`. DSIAPI automatically creates tables and columns dynamically on `INSERT`.

```typescript
import { DbManager, DsiApiAdapter } from 'db-manager';

const db = new DbManager({
  remote: new DsiApiAdapter({
    endpoint: 'http://localhost:8899',
    credentials: {
      dbName: 'clinic_db',
      dbPass: 'my_password',
      user: 'root',
      driver: 'mysql', // or 'pgsql'
    },
  }),
});
```

### 2. Supabase
```typescript
import { DbManager, SupabaseAdapter } from 'db-manager';

const db = new DbManager({
  remote: new SupabaseAdapter({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  }),
});
```

### 3. Firebase Realtime Database (RTDB)
```typescript
import { DbManager, FirebaseRtdbAdapter } from 'db-manager';

const db = new DbManager({
  remote: new FirebaseRtdbAdapter({
    databaseUrl: 'https://my-clinic-rtdb.firebaseio.com',
    authToken: 'optional_firebase_auth_token',
  }),
});
```

### 4. Cloud Firestore
```typescript
import { DbManager, FirestoreAdapter } from 'db-manager';

const db = new DbManager({
  remote: new FirestoreAdapter({
    projectId: 'my-clinic-project',
    apiKey: 'AIzaSy...',
  }),
});
```

### 5. Neon Database (Serverless Postgres)
```typescript
import { DbManager, NeonAdapter } from 'db-manager';

const db = new DbManager({
  remote: new NeonAdapter({
    connectionString: 'postgres://user:password@ep-xyz.region.neon.tech/neondb',
  }),
});
```

### 6. Direct MySQL
```typescript
import { DbManager, MysqlAdapter } from 'db-manager';

const db = new DbManager({
  remote: new MysqlAdapter({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'clinic_db',
  }),
});
```

### 7. MongoDB
```typescript
import { DbManager, MongoDbAdapter } from 'db-manager';

const db = new DbManager({
  remote: new MongoDbAdapter({
    uri: 'mongodb://localhost:27017',
    dbName: 'clinic_db',
  }),
});
```

---

## 4. Working with Collections & Models

### Standard CRUD Operations

```typescript
import { Patient } from 'db-manager/models';

const patients = db.collection<Patient>('patients');

// 1. Insert (Saved locally immediately; queued for remote sync)
const newPatient = await patients.insert({
  clinicId: 'clinic_123',
  patientCode: 'PAT-001',
  fullName: 'John Doe',
  phone: '+1 555-0199',
  dateOfBirth: '1985-06-15',
  gender: 'male',
  bloodGroup: 'O+',
  allergies: ['Penicillin'],
  isActive: true,
});

// 2. Read by ID (Instant local lookup)
const patient = await patients.findById(newPatient._id);

// 3. Query with Filters, Sort, and Pagination
const activePatients = await patients.find(
  { clinicId: 'clinic_123', isActive: true },
  { sort: { fullName: 'asc' }, limit: 20 }
);

// 4. Update (Millisecond timestamp & version updated automatically)
await patients.update(newPatient._id, {
  phone: '+1 555-9999',
  notes: 'Updated contact details',
});

// 5. Delete (Soft-delete tombstone prevents sync resurrection)
await patients.delete(newPatient._id);
```

### Shortcut Getters for Standard Collections
`db-manager` provides direct accessors for standard domain collections:
- `db.patients` -> `db.collection<Patient>('patients')`
- `db.doctors` -> `db.collection<Doctor>('doctors')`
- `db.appointments` -> `db.collection<Appointment>('appointments')`
- `db.prescriptions` -> `db.collection<Prescription>('prescriptions')`
- `db.invoices` -> `db.collection<Invoice>('invoices')`
- `db.medicalRecords` -> `db.collection<MedicalRecord>('medical_records')`
- `db.clinics` -> `db.collection<Clinic>('clinics')`
- `db.users` -> `db.collection<User>('users')`
- `db.activityLogs` -> `db.collection<ActivityLog>('activity_logs')`
- `db.keyValue` -> `db.collection<KeyValue>('key_value')`
- `db.generic` -> `db.collection<GenericDocument>('generic_documents')`

---

## 5. Offline Sync & Network Handling

### Manual Sync Trigger & Status
```typescript
// Check connectivity
const online = db.isOnline();

// Check sync queue status
const stats = await db.getSyncStats();
console.log(`Pending offline mutations: ${stats.pendingCount}`);

// Force an immediate sync cycle
await db.sync();
```

### Event Subscriptions
```typescript
// Network changes
db.on('network:online', () => console.log('Internet connected! Flushing queue...'));
db.on('network:offline', () => console.log('Working in offline mode.'));

// Sync cycles
db.on('sync:start', () => console.log('Syncing in progress...'));
db.on('sync:complete', (res) => console.log(`Synced ${res.syncedCount} records.`));
db.on('sync:error', (err) => console.error('Sync failure:', err));

// Conflicts
db.on('sync:conflict', (conflict) => {
  console.warn(`Conflict in ${conflict.collection} for ${conflict.recordId}: Resolved via ${conflict.strategy}`);
});
```

---

## 6. Conflict Resolution Configuration

### Strategies:
1. `'last-write-wins'` (Default): Compares `_updatedAt` milliseconds. The newer timestamp wins.
2. `'server-wins'`: Remote server data always overwrites local changes.
3. `'client-wins'`: Local modifications always overwrite remote server data.
4. `'field-merge'`: 3-way non-conflicting field merge.
5. `'manual'`: Runs a custom callback function.

```typescript
const db = new DbManager({
  sync: {
    conflictStrategy: 'manual',
    onConflict: async ({ collection, localRecord, remoteRecord, timeDifferenceMs }) => {
      console.log(`Conflict detected (${timeDifferenceMs}ms difference)`);
      // Custom business logic: merge clinical notes rather than overwriting
      if (collection === 'patients') {
        const mergedNotes = `${localRecord.notes || ''}\n---\n${remoteRecord.notes || ''}`;
        return {
          resolvedRecord: { ...localRecord, notes: mergedNotes, _updatedAt: Date.now() },
          action: 'merged',
          strategyUsed: 'manual',
        };
      }
      // Fallback to LWW
      return localRecord._updatedAt > remoteRecord._updatedAt
        ? { resolvedRecord: localRecord, action: 'keep_local', strategyUsed: 'last-write-wins' }
        : { resolvedRecord: remoteRecord, action: 'accept_remote', strategyUsed: 'last-write-wins' };
    },
  },
});
```

---

## 7. Next.js & Electron Integration Patterns

### React / Next.js Hook Pattern
```typescript
'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/db'; // Your shared DbManager instance

export function usePatients() {
  const [patients, setPatients] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = async () => {
    const list = await db.patients.find({}, { sort: { fullName: 'asc' } });
    setPatients(list);
  };

  useEffect(() => {
    loadData();

    const unsubStart = db.on('sync:start', () => setIsSyncing(true));
    const unsubComplete = db.on('sync:complete', () => {
      setIsSyncing(false);
      loadData(); // Re-read local cache after sync
    });

    return () => {
      unsubStart();
      unsubComplete();
    };
  }, []);

  return { patients, isSyncing, refresh: loadData };
}
```

---

## 8. Troubleshooting & Common Scenarios

1. **DSIAPI Connection Error (HTTP 400 'Malicious where condition detected')**:
   - DSIAPI contains a built-in SQL injection firewall that strictly rejects `1=1`, `id>0`, or `OR 1=1`.
   - `db-manager` automatically ensures all query criteria use clean field-equality parameters (`_id = '...'`). Never bypass with raw `1=1` conditions.
2. **Offline writes not syncing to server**:
   - Check `db.isOnline()`. If offline, records remain safe in local `sync_queue`.
   - Call `await db.sync()` manually to test backend reachability.
3. **Data resurrection after deletion**:
   - `db-manager` uses soft deletes (`_deleted: true`). If you use custom database migrations, ensure your tables or queries filter out `_deleted = true`.

