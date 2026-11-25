const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: String,
  email: {
    type: String,
    required: true
  },
  phone: String,
  headOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['central', 'state', 'local', 'other'],
    default: 'central'
  },
  resolutionDays: {
    type: Number,
    default: 30 // SLA in days
  },
  icon: String,
  color: String,
}, {
  timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
