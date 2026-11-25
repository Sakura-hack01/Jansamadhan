const mongoose = require('mongoose');

const grievanceCenterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    type: {
      type: String,
      enum: ['central', 'state', 'district', 'csc', 'appellate'],
      default: 'district',
    },
    departmentName: { type: String, required: true },
    address: {
      street: String,
      landmark: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: String,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    phone: String,
    email: String,
    workingDays: { type: String, default: 'Mon - Fri' },
    openHour: { type: Number, default: 9.5 }, // 9:30 AM
    closeHour: { type: Number, default: 17.5 }, // 5:30 PM
    services: [String],
    facilities: {
      wheelchairAccessible: { type: Boolean, default: true },
      womensDesk: { type: Boolean, default: true },
      tokenCounter: { type: Boolean, default: true },
      photocopyAvailable: { type: Boolean, default: true },
      parkingAvailable: { type: Boolean, default: true },
    },
    languages: { type: [String], default: ['English', 'Hindi'] },
    nearestTransit: String,
    crowdLevel: { type: String, enum: ['low', 'moderate', 'busy'], default: 'moderate' },
    avgWaitMinutes: { type: Number, default: 15 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

grievanceCenterSchema.index({ location: '2dsphere' });
grievanceCenterSchema.index({ 'address.city': 1, 'address.state': 1, type: 1 });

module.exports = mongoose.model('GrievanceCenter', grievanceCenterSchema);
