const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  allowRegistration: {
    type: Boolean,
    default: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  backupFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  logRetention: {
    type: Number,
    default: 30
  },
  sessionTimeout: {
    type: Number,
    default: 60
  },
  maxFileUploadSize: {
    type: Number,
    default: 10
  },
  rateLimiting: {
    type: Number,
    default: 100
  },
  cacheExpiration: {
    type: Number,
    default: 24
  },
  services: {
    apiServer: {
      type: Boolean,
      default: true
    },
    database: {
      type: Boolean,
      default: true
    },
    emailService: {
      type: Boolean,
      default: true
    },
    githubIntegration: {
      type: Boolean,
      default: true
    },
    fileStorage: {
      type: Boolean,
      default: true
    },
    notificationService: {
      type: Boolean,
      default: true
    },
    cacheService: {
      type: Boolean,
      default: true
    },
    backupService: {
      type: Boolean,
      default: true
    }
  },
  lastBackupTime: {
    type: Date,
    default: null
  },
  lastHealthCheck: {
    type: Date,
    default: null
  },
  systemHealth: {
    status: {
      type: String,
      enum: ['healthy', 'warning', 'critical'],
      default: 'healthy'
    },
    cpuUsage: {
      type: Number,
      default: 0
    },
    memoryUsage: {
      type: Number,
      default: 0
    },
    diskUsage: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
SettingsSchema.pre('save', async function(next) {
  const settings = await mongoose.model('Settings').find();
  if (settings.length > 0 && !this._id) {
    this._id = settings[0]._id;
    this.isNew = false;
  }
  next();
});

module.exports = mongoose.model('Settings', SettingsSchema);