# `db-manager`

**Enterprise-grade offline-first database manager with dual local/server sync, millisecond conflict resolution, and multi-backend support.**

Supports **7 Backends**:
- **DSIAPI** (DevSecIt Rust API Engine v1.0.0)
- **Supabase**
- **Firebase Realtime Database (RTDB)**
- **Cloud Firestore**
- **Neon Database** (Serverless Postgres)
- **Direct MySQL**
- **MongoDB**

---

## Features

- **Offline-First Zero Downtime**: Writes and reads execute instantly against local storage (<5ms). Network disconnections never disrupt user interactions.
- **Automatic Reconnect & Bidirectional Sync**: Automatically detects internet connectivity and synchronizes pending mutations to the remote backend.
- **High-Precision Millisecond Conflict Resolution**: Every record tracks `_updatedAt` (epoch in milliseconds), `_version`, and `_deleted` tombstones. Supports Last-Write-Wins (LWW), field-level merge, server-wins, client-wins, and custom conflict hooks.
- **Durable Mutation Queue**: Local mutations are persisted in a FIFO queue with exponential retry backoff.
- **Universal Runtime**: Works across Web (Next.js / React), Desktop (Electron Main & Renderer), and Server (Node.js).
- **Pre-Built Healthcare & SaaS Models**:
  - Healthcare: `Patient`, `Doctor`, `Appointment`, `Prescription`, `Invoice`, `MedicalRecord`, `Clinic`.
  - SaaS: `User`, `AuthSession`, `ActivityLog`, `KeyValue`, `GenericDocument`.
- **AI Skill Included**: Ships with `SKILL.md` for AI pair programmers to automatically understand and use the library.

---

## Installation

```bash
# Inside your project or workspace:
npm install file:./dependency/db-manager
# or link in package.json:
# "dependencies": { "db-manager": "file:./dependency/db-manager" }
```

---

## Quickstart

```typescript
import { DbManager, DsiApiAdapter, autoDetectLocalAdapter } from 'db-manager';
import { Patient } from 'db-manager/models';

// 1. Initialize DbManager with your desired remote adapter
const db = new DbManager({
  dbName: 'clinic_db',
  remote: new DsiApiAdapter({
    endpoint: 'http://localhost:8899',
    credentials: {
      dbName: 'clinic_db',
      dbPass: 'password',
      user: 'root',
    },
  }),
  local: autoDetectLocalAdapter('clinic_db'),
  sync: {
    autoSyncOnOnline: true,
    syncIntervalMs: 15000,
    conflictStrategy: 'last-write-wins',
  },
});

await db.init();

// 2. Perform CRUD with offline safety
const patient = await db.patients.insert({
  clinicId: 'clinic_01',
  patientCode: 'PAT-100',
  fullName: 'Alice Johnson',
  phone: '+1 555-0100',
  dateOfBirth: '1990-01-01',
  gender: 'female',
  bloodGroup: 'O+',
  isActive: true,
});

console.log('Inserted locally with ID:', patient._id);

// 3. Query
const list = await db.patients.find({ clinicId: 'clinic_01' });
console.log(`Found ${list.length} patients.`);
```

---

## Supported Backends

### 1. DSIAPI (DevSecIt Rust API Engine)
```typescript
import { DsiApiAdapter } from 'db-manager';

const adapter = new DsiApiAdapter({
  endpoint: 'http://localhost:8899',
  credentials: {
    dbName: 'clinic_db',
    dbPass: 'pass',
    user: 'root',
    driver: 'mysql', // or 'pgsql'
  },
});
```

### 2. Supabase
```typescript
import { SupabaseAdapter } from 'db-manager';

const adapter = new SupabaseAdapter({
  supabaseUrl: 'https://xyz.supabase.co',
  supabaseKey: 'anon-key-here',
});
```

### 3. Firebase RTDB
```typescript
import { FirebaseRtdbAdapter } from 'db-manager';

const adapter = new FirebaseRtdbAdapter({
  databaseUrl: 'https://my-app-rtdb.firebaseio.com',
  authToken: 'optional-token',
});
```

### 4. Cloud Firestore
```typescript
import { FirestoreAdapter } from 'db-manager';

const adapter = new FirestoreAdapter({
  projectId: 'my-project-id',
  apiKey: 'api-key',
});
```

### 5. Neon Database (Postgres)
```typescript
import { NeonAdapter } from 'db-manager';

const adapter = new NeonAdapter({
  connectionString: 'postgres://user:pass@ep-xyz.neon.tech/neondb',
});
```

### 6. Direct MySQL
```typescript
import { MysqlAdapter } from 'db-manager';

const adapter = new MysqlAdapter({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'clinic_db',
});
```

### 7. MongoDB
```typescript
import { MongoDbAdapter } from 'db-manager';

const adapter = new MongoDbAdapter({
  uri: 'mongodb://localhost:27017',
  dbName: 'clinic_db',
});
```

---

## Conflict Resolution & Millisecond Timestamps

Every record automatically maintains metadata:
```typescript
interface SyncMetadata {
  _id: string;               // UUID
  _version: number;          // Revision sequence
  _createdAt: number;        // Epoch in milliseconds (Date.now())
  _updatedAt: number;        // Epoch in milliseconds (Date.now())
  _deleted: boolean;         // Soft delete tombstone
  _synced: boolean;          // Remote synchronization state
}
```

### Conflict Strategies:
- `last-write-wins` (default): Uses `_updatedAt` (ms). The newest write wins.
- `server-wins`: Remote database takes precedence.
- `client-wins`: Local modifications take precedence.
- `field-merge`: 3-way merge of disparate non-conflicting fields.
- `manual`: Custom resolution callback.

```typescript
const db = new DbManager({
  sync: {
    conflictStrategy: 'manual',
    onConflict: async ({ collection, localRecord, remoteRecord, timeDifferenceMs }) => {
      // Return custom merged record
      return {
        resolvedRecord: { ...remoteRecord, ...localRecord, _updatedAt: Date.now() },
        action: 'merged',
        strategyUsed: 'manual',
      };
    },
  },
});
```

---

## Events

```typescript
db.on('network:online', () => console.log('Online!'));
db.on('network:offline', () => console.log('Offline!'));
db.on('sync:start', () => console.log('Syncing...'));
db.on('sync:complete', (stats) => console.log('Sync finished', stats));
db.on('sync:conflict', (conflict) => console.log('Conflict resolved', conflict));
db.on('sync:error', (err) => console.error('Sync error', err));
```

---

## License

MIT © Clinic SaaS Platform Team

