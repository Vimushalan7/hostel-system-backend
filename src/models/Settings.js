const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      enum: ['escalation', 'notification', 'general', 'ai'],
      default: 'general',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

// Default settings for escalation SLA (hours before escalation)
const DEFAULT_SETTINGS = [
  {
    key: 'escalation_sla_low',
    value: 72,
    description: 'Hours before Low priority complaint is escalated',
    category: 'escalation',
  },
  {
    key: 'escalation_sla_medium',
    value: 48,
    description: 'Hours before Medium priority complaint is escalated',
    category: 'escalation',
  },
  {
    key: 'escalation_sla_high',
    value: 24,
    description: 'Hours before High priority complaint is escalated',
    category: 'escalation',
  },
  {
    key: 'escalation_sla_critical',
    value: 4,
    description: 'Hours before Critical priority complaint is escalated',
    category: 'escalation',
  },
  {
    key: 'ai_classification_enabled',
    value: true,
    description: 'Enable AI-assisted complaint classification',
    category: 'ai',
  },
  {
    key: 'duplicate_detection_enabled',
    value: true,
    description: 'Enable AI duplicate complaint detection',
    category: 'ai',
  },
];

Settings.initDefaults = async () => {
  for (const setting of DEFAULT_SETTINGS) {
    await Settings.findOneAndUpdate(
      { key: setting.key },
      { $setOnInsert: setting },
      { upsert: true, new: false }
    );
  }
  console.log('✅ Default settings initialized');
};

module.exports = Settings;
module.exports.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
