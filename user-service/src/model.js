const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values
        trim: true
    },
    profilePicture: {
        type: String,
        default: null,
        trim: true
    },
    phone: {
        type: String,
        default: null,
        trim: true
    },
    location: {
        type: String,
        default: null,
        trim: true
    },
    bio: {
        type: String,
        default: null,
        trim: true
    },
    occupation: {
        type: String,
        default: null,
        trim: true
    },
    company: {
        type: String,
        default: null,
        trim: true
    },
    workSchedule: {
        type: String,
        default: null,
        trim: true
    },
    preferredLocation: {
        type: String,
        default: null,
        trim: true
    },
    budget: {
        type: String,
        default: null,
        trim: true
    },
    roomType: {
        type: String,
        default: null,
        trim: true
    },
    genderPreference: {
        type: String,
        default: null,
        trim: true
    },
    lifestyle: {
        type: String,
        default: null,
        trim: true
    },
    cleanliness: {
        type: String,
        default: null,
        trim: true
    },
    noiseLevel: {
        type: String,
        default: null,
        trim: true
    },
    smoking: {
        type: Boolean,
        default: false
    },
    pets: {
        type: Boolean,
        default: false
    },
    amenities: [{
        type: String,
        trim: true
    }],
    role: {
        type: Number,
        default: 1,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    // KYC fields
    govtIdFrontUrl: {
        type: String,
        default: null,
        trim: true
    },
    govtIdBackUrl: {
        type: String,
        default: null,
        trim: true
    },
    kycVerified: {
        type: Boolean,
        default: false
    },
    kycStatus: {
        type: String,
        enum: ['not_submitted', 'pending', 'approved', 'rejected'],
        default: 'not_submitted'
    },
    kycReviewedAt: {
        type: Date,
        default: null
    },
    kycReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    verificationToken: {
        type: String,
        default: null,
    },
    verificationTokenExpires: {
        type: Date,
        default: null,
    },
    // Behaviour onboarding flags
    isNewUser: { type: Boolean, default: true },
    hasCompletedBehaviorQuestions: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 
 
// Behaviour answers schema and model
const behaviourAnswersSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, unique: true },
  answers: { type: Object, default: {} },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports.BehaviourAnswers = mongoose.model('BehaviourAnswers', behaviourAnswersSchema);

// KYC documents schema and model (separate collection)
const kycDocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  idType: { type: String, default: null, trim: true },
  idNumber: { type: String, default: null, trim: true },
  frontUrl: { type: String, default: null, trim: true },
  backUrl: { type: String, default: null, trim: true },
  status: { type: String, enum: ['not_submitted', 'pending', 'approved', 'rejected'], default: 'not_submitted', index: true },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  notes: { type: String, default: null, trim: true }
}, { timestamps: true });

module.exports.KycDocument = mongoose.model('KycDocument', kycDocumentSchema);