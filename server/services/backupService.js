const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const archiver = require('archiver');
const cron = require('node-cron');
const mongoose = require('mongoose');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');

const BACKUP_DIR = path.join(__dirname, '../../backups');
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure backups directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create backup directory:', err);
  }
}

// Scheduled Task
let scheduledTask = null;

const initialize = async () => {
  console.log('Initializing Backup Service...');
  try {
    const settings = await Settings.findOne();
    if (settings && settings.services && settings.services.backupService) {
      scheduleBackup(settings.backupFrequency || 'daily');
    } else {
      console.log('Backup Service is disabled in settings.');
    }
  } catch (err) {
    console.error('Error initializing backup service:', err);
  }
};

const scheduleBackup = (frequency) => {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  let cronExpression = '0 2 * * *'; // Default: Daily at 2 AM

  if (frequency === 'hourly') cronExpression = '0 * * * *';
  else if (frequency === 'weekly') cronExpression = '0 2 * * 0'; // Sunday at 2 AM
  else if (frequency === 'monthly') cronExpression = '0 2 1 * *'; // 1st of month at 2 AM

  console.log(`Scheduling backup with frequency: ${frequency} (${cronExpression})`);

  scheduledTask = cron.schedule(cronExpression, async () => {
    console.log('Starting scheduled backup...');
    try {
      await createBackup('scheduled');
    } catch (err) {
      console.error('Scheduled backup failed:', err);
    }
  });
};

const dumpWithMongodump = async (mongoUri, dumpDir) => {
  return new Promise((resolve, reject) => {
    console.log('Attempting mongodump...');
    const child = spawn('mongodump', ['--uri', mongoUri, '--out', dumpDir], {
      shell: true
    });

    child.stderr.on('data', (data) => console.log(`mongodump: ${data}`));
    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`mongodump exited with code ${code}`));
    });
  });
};

const dumpWithJSON = async (dumpDir) => {
  console.log('Falling back to JSON export...');
  const databaseDir = path.join(dumpDir, 'database_json');
  if (!fs.existsSync(databaseDir)) fs.mkdirSync(databaseDir, { recursive: true });

  const collections = mongoose.connection.collections;
  for (const key in collections) {
    try {
      const modelName = key.charAt(0).toUpperCase() + key.slice(1).slice(0, -1); // Plural to Singular rough guess, but better to query collection directly
      // Actually, just query the collection directly
      const collection = collections[key];
      const documents = await collection.find({}).toArray();

      fs.writeFileSync(
        path.join(databaseDir, `${key}.json`),
        JSON.stringify(documents, null, 2)
      );
      console.log(`Exported ${documents.length} documents from ${key}`);
    } catch (err) {
      console.error(`Failed to export collection ${key}:`, err);
    }
  }
};

const createBackup = async (type = 'manual', userId = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${type}_${timestamp}`;
      const tempDir = path.join(BACKUP_DIR, 'temp_' + timestamp);
      const dumpDir = path.join(tempDir, 'dump');
      const zipPath = path.join(BACKUP_DIR, `${backupName}.zip`);

      // 1. Create Temp Directory
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const mongoUri = process.env.MONGODB_URI;

      // 2. Dump Database
      // Try mongodump first, then fallback to JSON
      let backupType = 'mongodump';
      try {
        if (!mongoUri) throw new Error('No URI');
        await dumpWithMongodump(mongoUri, dumpDir);
      } catch (err) {
        console.log('Mongodump failed or invalid. Switching to JSON export strategy.', err.message);
        backupType = 'json';
        try {
          await dumpWithJSON(dumpDir);
        } catch (jsonErr) {
          cleanup(tempDir);
          return reject(new Error('Both mongodump and JSON export failed: ' + jsonErr.message));
        }
      }

      console.log('Database dump complete. Zipping...');

      // 3. Zip Dump + Uploads
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', async () => {
        console.log(`Backup created: ${zipPath} (${archive.pointer()} total bytes)`);

        cleanup(tempDir);

        // Log to Audit
        try {
          const log = new AuditLog({
            user: userId,
            action: 'BACKUP_CREATED',
            resource: backupName,
            details: { type, method: backupType, size: archive.pointer(), path: zipPath }
          });
          await log.save();
        } catch (e) {
          console.error('Error saving audit log', e);
        }

        resolve({ filename: `${backupName}.zip`, size: archive.pointer() });
      });

      archive.on('error', (err) => {
        console.error('Archiver error:', err);
        cleanup(tempDir);
        reject(err);
      });

      archive.pipe(output);

      // Append Database Dump
      // If mongodump, it's in dumpDir/database
      // If JSON, it's in dumpDir/database_json
      archive.directory(dumpDir, 'database');

      // Append Uploads Directory if exists
      if (fs.existsSync(UPLOADS_DIR)) {
        archive.directory(UPLOADS_DIR, 'uploads');
      }

      archive.finalize();

    } catch (err) {
      console.error('Unexpected error in createBackup:', err);
      reject(err);
    }
  });
};

const cleanup = (dir) => {
  try {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) {
    console.error('Cleanup failed:', e);
  }
}

const getBackups = () => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.endsWith('.zip'))
      .map(file => {
        try {
          const stats = fs.statSync(path.join(BACKUP_DIR, file));
          return {
            filename: file,
            size: stats.size,
            createdAt: stats.birthtime
          };
        } catch (e) { return null; }
      })
      .filter(b => b !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
    return backups;
  } catch (err) {
    console.error('Error getting backups:', err);
    return [];
  }
};

const deleteBackup = (filename) => {
  try {
    const filePath = path.join(BACKUP_DIR, filename);
    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return false;
    }
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error deleting backup:', e);
    return false;
  }
};

const restoreBackup = async (filename) => {
  return new Promise((resolve, reject) => {
    reject(new Error('Automatic restore not implemented yet. Please use manual restoration.'));
  });
};

module.exports = {
  initialize,
  scheduleBackup,
  createBackup,
  getBackups,
  deleteBackup,
  restoreBackup,
  BACKUP_DIR
};
