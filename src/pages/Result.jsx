import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Download, Copy, RotateCcw, ArrowLeft, CheckCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Button from '../components/Button';
import './Result.css';

import { jsPDF } from 'jspdf';

export default function Result() {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('tailored');
    const [copied, setCopied] = useState(false);

    const { originalText, tailoredText, resumeId } = location.state || {};

    const handleCopy = () => {
        navigator.clipboard.writeText(tailoredText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!tailoredText) {
            alert("No tailored text to download.");
            return;
        }

        try {
            const doc = new jsPDF({ unit: 'mm', format: 'a4' });

            const margin = 20;
            const pageWidth = 210;
            const usableWidth = pageWidth - margin * 2;
            const pageHeight = 297;
            let y = margin;

            const lines = tailoredText.split('\n');

            const addPageIfNeeded = (height) => {
                if (y + height > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
            };

            lines.forEach((rawLine) => {
                const line = rawLine.trim();

                // H1 - Name
                if (line.startsWith('# ')) {
                    const text = line.replace(/^# /, '');
                    addPageIfNeeded(12);
                    doc.setFontSize(20);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(15, 23, 42);
                    doc.text(text, margin, y);
                    y += 10;
                    // Underline separator
                    doc.setDrawColor(99, 102, 241);
                    doc.setLineWidth(0.8);
                    doc.line(margin, y, pageWidth - margin, y);
                    y += 6;

                // H2 - Section Headers
                } else if (line.startsWith('## ')) {
                    const text = line.replace(/^## /, '');
                    addPageIfNeeded(10);
                    y += 3;
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(99, 102, 241);
                    doc.text(text.toUpperCase(), margin, y);
                    y += 2;
                    doc.setDrawColor(226, 232, 240);
                    doc.setLineWidth(0.3);
                    doc.line(margin, y, pageWidth - margin, y);
                    y += 6;

                // H3 - Job titles / Project names
                } else if (line.startsWith('### ')) {
                    const text = line.replace(/^### /, '');
                    addPageIfNeeded(8);
                    doc.setFontSize(10.5);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(15, 23, 42);
                    doc.text(text, margin, y);
                    y += 6;

                // H4 - Tech stack / subtitle
                } else if (line.startsWith('#### ')) {
                    const text = line.replace(/^#### /, '');
                    addPageIfNeeded(7);
                    doc.setFontSize(9.5);
                    doc.setFont('helvetica', 'italic');
                    doc.setTextColor(100, 116, 139);
                    doc.text(text, margin, y);
                    y += 5;

                // Bullet points
                } else if (line.startsWith('* ') || line.startsWith('- ')) {
                    const text = line.replace(/^[*-] /, '');
                    const cleanText = text.replace(/\*\*(.*?)\*\*/g, '$1');
                    const splitLines = doc.splitTextToSize(`• ${cleanText}`, usableWidth - 4);
                    addPageIfNeeded(splitLines.length * 5 + 2);
                    doc.setFontSize(9.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(51, 65, 85);
                    doc.text(splitLines, margin + 3, y);
                    y += splitLines.length * 5 + 1;

                // Empty line
                } else if (line === '') {
                    y += 2;

                // Normal text / contact info
                } else {
                    const cleanText = line.replace(/\*\*(.*?)\*\*/g, '$1');
                    const splitLines = doc.splitTextToSize(cleanText, usableWidth);
                    addPageIfNeeded(splitLines.length * 5 + 1);
                    doc.setFontSize(9.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(51, 65, 85);
                    doc.text(splitLines, margin, y);
                    y += splitLines.length * 5 + 1;
                }
            });

            doc.save(`tailored-resume-${resumeId || 'new'}.pdf`);

        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    if (!tailoredText) {
        return (
            <div className="container result-container">
                <div className="no-result">
                    <p>No result found. Please create a resume first.</p>
                    <Link to="/create"><Button>Create Resume</Button></Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container result-container">
            {/* Header */}
            <div className="result-header">
                <Link to="/dashboard" className="back-link">
                    <ArrowLeft size={18} /> Back to Dashboard
                </Link>
                <div className="result-actions">
                    <Button variant="outline" onClick={() => window.location.href = '/create'}>
                        <RotateCcw size={15} className="icon-sm" /> Generate Again
                    </Button>
                    <Button onClick={handleDownload}>
                        <Download size={15} className="icon-sm" /> Download PDF
                    </Button>
                </div>
            </div>

            {/* Mobile Tabs */}
            <div className="result-tabs mobile-only">
                <button
                    className={`tab-btn ${activeTab === 'original' ? 'active' : ''}`}
                    onClick={() => setActiveTab('original')}
                >
                    Original
                </button>
                <button
                    className={`tab-btn ${activeTab === 'tailored' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tailored')}
                >
                    Tailored Resume
                </button>
            </div>

            {/* Grid */}
            <div className="result-grid">
                {/* Original Resume */}
                <div className={`resume-panel original-panel ${activeTab === 'original' ? 'active-mobile' : ''}`}>
                    <div className="panel-header">
                        <span className="panel-badge original-badge">Original</span>
                        <h3>Your Resume</h3>
                    </div>
                    <div className="panel-content">
                        <pre className="original-pre">{originalText || "Original text unavailable"}</pre>
                    </div>
                </div>

                {/* Tailored Resume */}
                <div className={`resume-panel tailored-panel ${activeTab === 'tailored' ? 'active-mobile' : ''}`}>
                    <div className="panel-header">
                        <span className="panel-badge tailored-badge">AI Tailored</span>
                        <h3>Tailored Result</h3>
                        <button
                            className={`copy-btn ${copied ? 'copied' : ''}`}
                            onClick={handleCopy}
                            title="Copy to clipboard"
                        >
                            {copied ? <><CheckCheck size={15} /> Copied!</> : <><Copy size={15} /> Copy</>}
                        </button>
                    </div>
                    <div className="panel-content resume-doc">
                        <ReactMarkdown
                            components={{
                                h1: ({ children }) => <h1 className="resume-name">{children}</h1>,
                                h2: ({ children }) => <h2 className="resume-section">{children}</h2>,
                                h3: ({ children }) => <h3 className="resume-role">{children}</h3>,
                                h4: ({ children }) => <h4 className="resume-subtitle">{children}</h4>,
                                p: ({ children }) => <p className="resume-p">{children}</p>,
                                ul: ({ children }) => <ul className="resume-ul">{children}</ul>,
                                li: ({ children }) => <li className="resume-li">{children}</li>,
                                strong: ({ children }) => <strong className="resume-strong">{children}</strong>,
                                a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="resume-link">
                                        {children}
                                    </a>
                                ),
                                hr: () => <hr className="resume-hr" />,
                            }}
                        >
                            {tailoredText}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
}
