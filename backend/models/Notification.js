const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['complaint_update', 'complaint_assigned', 'complaint_resolved', 'complaint_rejected',
           'delivery_update', 'system', 'reminder', 'escalation'],
    default: 'system'
  },
  relatedTo: {
    model: { type: String, enum: ['Complaint', 'Delivery', 'User'] },
    id: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
}, {
  timestamps: true
});

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
