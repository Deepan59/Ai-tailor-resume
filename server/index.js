import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import User from './models/user.js';
import Resume from './models/resume.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the built React frontend (../dist relative to server/)
const distPath = path.join(__dirname, '..', 'dist');
app.use(cors())
// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-resume-tailor';
mongoose.connect(mongoUri)
    .then(() => console.log('📁 Connected to MongoDB successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Ensure uploads folder exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created uploads directory');
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173','https://ai-tailor-resume-5eqs.onrender.com'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = { id: decoded.userId };
        next();
    });
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ================= AUTH ROUTES =================

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        const user = new User({ name, email, password });
        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: 'Free Plan'
            }
        });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ error: 'Registration failed', message: error.message });
    }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                plan: 'Free Plan'
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed', message: error.message });
    }
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            plan: 'Free Plan'
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: 'Failed to retrieve profile' });
    }
});

// ================= RESUME ROUTES =================

// Upload Resume
app.post('/api/resumes/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const count = await Resume.countDocuments({ userId: req.user.id });
        const nextNumber = count + 1;
        const defaultTitle = `Resume ${nextNumber}`;

        const resume = new Resume({
            userId: req.user.id,
            filePath: req.file.path,
            fileName: req.file.originalname,
            jobTitle: defaultTitle,
            company: ' '
        });

        await resume.save();

        res.status(201).json({
            resumeId: resume._id,
            filePath: resume.filePath
        });
    } catch (error) {
        console.error('Resume Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload resume', message: error.message });
    }
});

// Update Resume Metadata (e.g. after AI tailoring)
app.put('/api/resumes/:id', authenticateToken, async (req, res) => {
    try {
        const { jobTitle, company, originalText, tailoredText } = req.body;

        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        if (jobTitle !== undefined) resume.jobTitle = jobTitle;
        if (company !== undefined) resume.company = company;
        if (originalText !== undefined) resume.originalText = originalText;
        if (tailoredText !== undefined) resume.tailoredText = tailoredText;

        await resume.save();

        res.json(resume);
    } catch (error) {
        console.error('Resume Update Error:', error);
        res.status(500).json({ error: 'Failed to update resume details' });
    }
});

// Get Resumes History
app.get('/api/resumes', authenticateToken, async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.user.id }).sort({ createdAt: -1 });
        const formatted = resumes.map(r => ({
            id: r._id,
            jobTitle: r.jobTitle || 'Untitled',
            company: r.company || 'Unknown',
            date: r.createdAt
        }));
        res.json(formatted);
    } catch (error) {
        console.error('Fetch History Error:', error);
        res.status(500).json({ error: 'Failed to fetch resume history' });
    }
});

// Download Resume File
app.get('/api/resumes/:id/download', authenticateToken, async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const resolvedPath = path.resolve(resume.filePath);
        if (!fs.existsSync(resolvedPath)) {
            return res.status(404).json({ error: 'File not found on server storage' });
        }

        res.download(resolvedPath, resume.fileName);
    } catch (error) {
        console.error('Download File Error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// ================= GEMINI ROUTE =================

// Gemini API endpoint
app.post('/api/gemini/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API key is not configured' });
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                maxOutputTokens: 8192,
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ text });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({
            error: 'Failed to generate content',
            message: error.message
        });
    }
});

// ================= GROQ ROUTE =================

// Groq API endpoint
app.post('/api/groq/generate', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('placeholder')) {
            return res.status(500).json({ error: 'Groq API key is not configured. Please add it to your server .env file.' });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert professional resume writer. Your job is to REWRITE and TAILOR resumes to match specific job descriptions. You MUST make meaningful changes: rephrase bullet points using keywords from the job description, reorder skills to prioritize relevant ones, and adjust language to match the role. Always return ONLY the full tailored resume in clean markdown format. Never return the original resume unchanged. Never add commentary or explanation — only the resume markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Groq API returned status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';

        res.json({ text });
    } catch (error) {
        console.error('Groq API Error:', error);
        res.status(500).json({
            error: 'Failed to generate content via Groq',
            message: error.message
        });
    }
});

// ================= SERVE FRONTEND =================
// Serve built React app static files
app.use(express.static(distPath));

// SPA catch-all: for any route not matched by API above,
// send back index.html so React Router handles it client-side.
// This fixes 404 on refresh for /result, /dashboard, etc.
app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend not built. Run npm run build first.');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Gemini API Key: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing'}`);
    console.log(`   Groq API Key  : ${process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('placeholder') ? 'Configured' : 'Missing/Placeholder'}`);
});
