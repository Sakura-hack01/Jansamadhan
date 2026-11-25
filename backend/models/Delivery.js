const mongoose = require('mongoose');

const deliveryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  category: String,
  image: String,
}, { _id: true });

const deliverySchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    enum: [
      'documents', // Government document delivery
      'certificates', // Birth/Death/Caste etc.
      'ration', // PDS/Ration delivery
      'medicines', // Government medicine delivery
      'seeds_fertilizers', // Agricultural supplies
      'pension', // Pension documents
      'scholarship', // Scholarship disbursement
      'equipment', // Government equipment
      'other'
    ],
    required: true
  },
  items: [deliveryItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  deliveryAddress: {
    name: String,
    phone: String,
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String
  },
  status: {
    type: String,
    enum: ['requested', 'processing', 'approved', 'dispatched', 'out_for_delivery', 'delivered', 'failed', 'cancelled'],
    default: 'requested'
  },
  trackingId: String,
  assignedAgent: {
    name: String,
    phone: String,
    vehicleNumber: String
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent'],
    default: 'normal'
  },
  specialInstructions: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  proofOfDelivery: {
    signature: String,
    photo: String,
    receiverName: String
  },
  timeline: [{
    status: String,
    description: String,
    location: String,
    timestamp: { type: Date, default: Date.now }
  }],
  rating: {
    score: { type: Number, min: 1, max: 5 },
    comment: String
  },
  paymentStatus: {
    type: String,
    enum: ['free', 'pending', 'paid'],
    default: 'free'
  },
  notes: String
}, {
  timestamps: true
});

// Auto-generate order number
deliverySchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const count = await mongoose.model('Delivery').countDocuments();
    this.orderNumber = `DEL/${year}/${String(count + 1).padStart(8, '0')}`;
  }
  next();
});

deliverySchema.index({ user: 1, status: 1 });
deliverySchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Delivery', deliverySchema);
