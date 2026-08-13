import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileName: {
        type: String
    },
    jobTitle: {
        type: String,
        default: 'Untitled Resume'
    },
    company: {
        type: String,
        default: 'Unknown'
    },
    originalText: {
        type: String
    },
    tailoredText: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
