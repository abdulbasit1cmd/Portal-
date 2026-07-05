const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  matricNumber: { type: String, required: true, unique: true },
  department: { type: String, default: '' },
  programme: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  status: { type: String, default: 'Active' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
