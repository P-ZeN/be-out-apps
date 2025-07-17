# Translation Files Persistence Solution

## Problem
Translation files are currently stored in the git repository (`server/translations/`) and get overwritten on each deployment, causing loss of collaborative translation work done on the live server.

## Solution 1: Move to Persistent Volume (Recommended)

Similar to how file uploads are handled, move translation files to a Docker volume that persists across deployments.

### Current Volume Structure

Your app currently has:
```
/app/uploads/          # Existing volume for image files
├── public/
│   ├── avatars/
│   ├── events/
│   └── thumbnails/
└── private/
    ├── documents/
    └── temp/
```

### Proposed Addition

Add a separate volume for translations:
```
/app/translations/     # New volume for translation files
├── en/
│   ├── auth.json
│   ├── common.json
│   └── ...
├── fr/
└── es/
```

### Implementation Steps

#### 1. Update Docker Configuration

Add translation volume to your server in Dockploy:

**Volume Mount (separate from uploads):**
- Container Path: `/app/translations`
- Volume Name: `beout_translations`
- Access Mode: Read/Write

**Note**: This creates a separate volume from your existing uploads volume (`/app/uploads`). This separation provides better organization and security.

#### 2. Update Server Code

Modify the translation file path in `server/src/routes/admin.js`:

```javascript
// OLD: Files in git repo (gets overwritten)
const getTranslationFilePath = (language, namespace) => {
    return path.join(__dirname, `../../translations/${language}/${namespace}.json`);
};

// NEW: Files in persistent volume
const getTranslationFilePath = (language, namespace) => {
    const translationsPath = process.env.TRANSLATIONS_PATH || '/app/translations';
    return path.join(translationsPath, `${language}/${namespace}.json`);
};
```

#### 3. Add Environment Variable

Add to your server environment variables in Dockploy:
```
TRANSLATIONS_PATH=/app/translations
```

#### 4. Migration Script

Create a one-time migration script to copy existing translations to the volume:

```javascript
// scripts/migrate-translations.js
import fs from 'fs/promises';
import path from 'path';

const sourceDir = '/app/server/translations';  // Git repo location
const targetDir = '/app/translations';          // Persistent volume location

async function migrateTranslations() {
    try {
        // Check if migration already done
        const targetExists = await fs.access(targetDir).then(() => true).catch(() => false);
        if (targetExists) {
            console.log('Translations already migrated');
            return;
        }

        // Copy all translation files
        await fs.cp(sourceDir, targetDir, { recursive: true });
        console.log('Translations migrated successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrateTranslations();
```

#### 5. Update Package.json

Add migration to server startup:

```json
{
  "scripts": {
    "start": "node scripts/migrate-translations.js && node src/index.js",
    "dev": "node scripts/migrate-translations.js && nodemon src/index.js"
  }
}
```

### Benefits
- ✅ Translation changes persist across deployments
- ✅ Collaborative editing works safely
- ✅ Minimal code changes required
- ✅ Same pattern as file uploads (familiar)
- ✅ Easy backup and restore
- ✅ No external dependencies

### Deployment Steps

1. **Add volume mount in Dockploy**
2. **Add environment variable**
3. **Deploy updated code**
4. **First deploy will migrate existing translations automatically**

---

## Solution 2: Database Storage

Store translations in PostgreSQL instead of files.

### Implementation

```sql
-- Create translations table
CREATE TABLE translations (
    id SERIAL PRIMARY KEY,
    language VARCHAR(10) NOT NULL,
    namespace VARCHAR(50) NOT NULL,
    translation_key VARCHAR(200) NOT NULL,
    translation_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(language, namespace, translation_key)
);

-- Index for performance
CREATE INDEX idx_translations_lookup ON translations(language, namespace);
```

### Pros
- ✅ Full persistence
- ✅ Version history possible
- ✅ Backup with database
- ✅ Atomic updates

### Cons
- ❌ Major code refactoring required
- ❌ Need to migrate existing file structure
- ❌ More complex admin interface
- ❌ Changes i18n loading pattern

---

## Solution 3: Pre/Post Deployment Hooks

Backup and restore translations around deployments.

### Implementation

```bash
# Pre-deployment backup
#!/bin/bash
docker exec beout-server tar -czf /tmp/translations-backup.tar.gz -C /app/server translations/
docker cp beout-server:/tmp/translations-backup.tar.gz ./translations-backup.tar.gz

# Post-deployment restore
#!/bin/bash
docker cp ./translations-backup.tar.gz beout-server:/tmp/
docker exec beout-server tar -xzf /tmp/translations-backup.tar.gz -C /app/server/
```

### Pros
- ✅ Minimal code changes
- ✅ Keep current architecture

### Cons
- ❌ Manual process (error-prone)
- ❌ Race conditions possible
- ❌ Requires external tooling
- ❌ Not automatic

---

## Solution 4: Git-Based Persistence

Automatically commit translation changes back to git.

### Implementation

```javascript
// Auto-commit translations after admin changes
async function saveTranslationsWithGit(language, namespace, translations) {
    // Save to file
    await saveTranslations(language, namespace, translations);

    // Commit to git
    const { exec } = require('child_process');
    exec(`cd /app && git add server/translations/ && git commit -m "Update translations: ${language}/${namespace}" && git push`,
         (error, stdout, stderr) => {
        if (error) console.error('Git commit failed:', error);
    });
}
```

### Pros
- ✅ Full version history
- ✅ Changes tracked in git
- ✅ Team can see translation updates

### Cons
- ❌ Complex CI/CD implications
- ❌ Requires git credentials in container
- ❌ Potential merge conflicts
- ❌ Security concerns
- ❌ Can trigger unwanted deployments

---

## Recommendation: Solution 1 (Persistent Volume)

**Why this is the best solution:**

1. **Proven Pattern**: Your app already uses this exact pattern for file uploads
2. **Simple Implementation**: Minimal code changes required
3. **Safe**: No risk of data loss during deployments
4. **Scalable**: Easy to backup, restore, and manage
5. **Familiar**: Uses same infrastructure you already have

**This approach treats translation files like user-uploaded content - persistent data that should survive deployments.**

The implementation is straightforward and follows the same volume-mounting pattern you've successfully used for file storage. The migration script ensures a smooth transition with zero downtime.

## ✅ IMPLEMENTATION COMPLETE

All necessary files have been created and code updated. Here's what was implemented:

### Files Created/Modified

1. **`server/scripts/migrate-translations.js`** - Migration script
2. **`server/package.json`** - Updated start scripts to run migration
3. **`server/src/routes/admin.js`** - Updated to use persistent volume path
4. **`server/Dockerfile`** - Added translations directory creation
5. **`server/.env.translations.example`** - Environment variable template
6. **`server/TRANSLATION_DEPLOYMENT_GUIDE.md`** - Step-by-step deployment guide

### Quick Start

To deploy this solution:

1. **In Dockploy**: Add volume mount `/app/translations` → `beout_translations`
2. **In Dockploy**: Add environment variable `TRANSLATIONS_PATH=/app/translations`
3. **Deploy**: The migration will run automatically on first startup
4. **Verify**: Check logs for "✓ Translations migrated successfully"

That's it! Your translations will now persist across deployments.

---
