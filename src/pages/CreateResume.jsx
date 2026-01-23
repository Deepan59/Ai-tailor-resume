import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X } from 'lucide-react';
import { resume } from '../services/api';
import { extractTextFromPdf, readFileAsText } from '../utils/fileUtils';
import Button from '../components/Button';
import './CreateResume.css';

export default function CreateResume() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            validateAndSetFile(droppedFiles[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file) => {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (validTypes.includes(file.type)) {
            setFile(file);
            setError('');
        } else {
            setError('Please upload a PDF or DOCX file.');
        }
    };

    const handleSubmit = async () => {
        if (!file || !jobDescription) return;

        setIsLoading(true);
        setError('');

        try {
            // 1. Upload Resume
            const uploadRes = await resume.upload(file);
            const resumeId = uploadRes.resumeId;

            // 2. Extract Text from File
            let resumeText = '';
            if (file.type === 'application/pdf') {
                resumeText = await extractTextFromPdf(file);
            } else {
                // Determine if it's a text-readable format or throw
                // For simplified POC, assuming text-based or minimal support
                // Just trying basic read for now, mostly supporting PDF per requirement
                try {
                    resumeText = await readFileAsText(file);
                } catch (e) {
                    console.warn("Could not read file as text, sending basic info", e);
                    resumeText = "Could not extract text from file. Please rely on manual upload.";
                }
            }

            if (!resumeText || resumeText.length < 50) {
                throw new Error("Could not extract enough text from the resume. Please ensure it is a valid text-based PDF.");
            }
            console.log("Extracted Resume Text Length:", resumeText.length);
            console.log("Extracted Text Preview:", resumeText.substring(0, 200));

            // 3. Tailor Resume
            const output = await resume.tailor(resumeId, resumeText, jobDescription);

            navigate('/result', {
                state: {
                    originalText: output.originalText || "Original text not provided", // fallback
                    tailoredText: output.tailoredText,
                    resumeId: output.tailoredResumeId
                }
            });

        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to tailor resume. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container create-container">
            <h1 className="page-title">Create Tailored Resume</h1>

            {error && <div className="error-banner">{error}</div>}

            <div className="create-grid">
                {/* Step 1: Upload Resume */}
                <div className="create-card">
                    <div className="card-header">
                        <div className="step-number">1</div>
                        <h2>Upload Resume</h2>
                    </div>

                    <div
                        className={`upload-area ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !file && fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            style={{ display: 'none' }}
                            accept=".pdf,.docx"
                            onChange={handleFileSelect}
                        />

                        {file ? (
                            <div className="file-preview">
                                <FileText className="file-icon" />
                                <div className="file-info">
                                    <span className="file-name">{file.name}</span>
                                    <span className="file-size">{(file.size / 1024).toFixed(0)} KB</span>
                                </div>
                                <button
                                    className="remove-file"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="upload-placeholder">
                                <Upload className="upload-icon" />
                                <p><strong>Click to upload</strong> or drag and drop</p>
                                <p className="upload-hint">PDF or DOCX (Max 5MB)</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 2: Job Description */}
                <div className="create-card">
                    <div className="card-header">
                        <div className="step-number">2</div>
                        <h2>Job Description</h2>
                    </div>

                    <div className="input-group">
                        <textarea
                            className="job-desc-input"
                            placeholder="Paste the job description here..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            rows={12}
                        />
                        <div className="char-count">
                            {jobDescription.length} characters
                        </div>
                    </div>
                </div>
            </div>

            <div className="create-actions">
                <Button
                    size="lg"
                    disabled={!file || !jobDescription}
                    isLoading={isLoading}
                    onClick={handleSubmit}
                >
                    Tailor Resume
                </Button>
            </div>
        </div>
    );
}
