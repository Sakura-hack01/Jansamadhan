const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  action: String,
  description: String,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedByRole: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  fileName: String,
  fileUrl: String,
  fileType: String,
  fileSize: Number,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  comment: String,
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const complaintSchema = new mongoose.Schema({
  // Auto-generated unique complaint number
  complaintNumber: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Complaint title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Complaint description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Infrastructure', 'Public Services', 'Healthcare', 'Education',
      'Utilities', 'Transport', 'Environment', 'Law & Order',
      'Social Welfare', 'Agriculture', 'Revenue', 'Labour',
      'Housing', 'Finance', 'Other'
    ]
  },
  subCategory: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected', 'reopened'],
    default: 'pending'
  },
  complainant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  assignedOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [attachmentSchema],
  timeline: [timelineSchema],
  location: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  resolutionNote: String,
  rejectionReason: String,
  escalated: {
    type: Boolean,
    default: false
  },
  escalatedAt: Date,
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: Date,
  resolvedAt: Date,
  closedAt: Date,
  feedback: feedbackSchema,
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  tags: [String],
}, {
  timestamps: true
});

// Auto-generate complaint number before saving
complaintSchema.pre('save', async function(next) {
  if (!this.complaintNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Complaint').countDocuments();
    this.complaintNumber = `JS/${year}/${month}/${String(count + 1).padStart(6, '0')}`;
  }
  // Set due date based on department SLA
  if (!this.dueDate && this.department) {
    const dept = await mongoose.model('Department').findById(this.department);
    if (dept) {
      const due = new Date();
      due.setDate(due.getDate() + (dept.resolutionDays || 30));
      this.dueDate = due;
    }
  }
  next();
});

// Index for faster queries
complaintSchema.index({ complainant: 1, status: 1 });
complaintSchema.index({ department: 1, status: 1 });
complaintSchema.index({ complaintNumber: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
