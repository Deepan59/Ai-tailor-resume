import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Download, Copy, RotateCcw, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import './Result.css';

import { jsPDF } from 'jspdf';

export default function Result() {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('tailored');

    // Destructure content from location state
    const { originalText, tailoredText, resumeId } = location.state || {}; // Fallback if direct access

    const handleCopy = () => {
        navigator.clipboard.writeText(tailoredText);
        alert('Copied to clipboard!');
    };

    const handleDownload = () => {
        if (!tailoredText) {
            alert("No tailored text to download.");
            return;
        }

        try {
            const doc = new jsPDF();

            // Add Title
            doc.setFontSize(20);
            doc.text("Tailored Resume", 25, 25);

            // Add Content
            doc.setFontSize(12);

            const pageWidth = 160; // 210mm - 25mm margin * 2
            const lineHeight = 7;
            const margin = 25;
            const pageHeight = 297; // A4 height mm
            let cursorY = 45;

            const splitText = doc.splitTextToSize(tailoredText, pageWidth);

            splitText.forEach(line => {
                // Check for new page
                if (cursorY + lineHeight > pageHeight - margin) {
                    doc.addPage();
                    cursorY = margin;
                }

                // Simple heuristic for Headers: Short line, follows empty line (or is first), commonly used keys
                const isHeader = /^(Summary|Experience|Education|Skills|Certifications|Projects)/i.test(line) && line.length < 30;

                if (isHeader) {
                    cursorY += 5; // Extra gap before header
                    doc.setFont(undefined, 'bold');
                    doc.text(line, margin, cursorY);
                    doc.setFont(undefined, 'normal');
                    cursorY += lineHeight + 2; // Extra gap after header
                } else {
                    doc.text(line, margin, cursorY);
                    cursorY += lineHeight;
                }
            });

            // Save the PDF
            doc.save(`tailored-resume-${resumeId || 'new'}.pdf`);

        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    if (!tailoredText) {
        return (
            <div className="container result-container">
                <p>No result found. Please create a resume first.</p>
                <Link to="/create"><Button>Create Resume</Button></Link>
            </div>
        );
    }

    return (
        <div className="container result-container">
            <div className="result-header">
                <Link to="/dashboard" className="back-link">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>
                <div className="result-actions">
                    <Button variant="outline" onClick={() => window.location.href = '/create'}>
                        <RotateCcw size={16} className="icon-sm" /> Generate Again
                    </Button>
                    <Button onClick={handleDownload} disabled={!resumeId}>
                        <Download size={16} className="icon-sm" /> Download PDF
                    </Button>
                </div>
            </div>

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

            <div className="result-grid">
                {/* Original Resume */}
                <div className={`resume-preview original ${activeTab === 'original' ? 'active-mobile' : ''}`}>
                    <div className="preview-header">
                        <h3>Original Resume</h3>
                    </div>
                    <div className="preview-content">
                        <pre>{originalText || "Original text unavailable"}</pre>
                    </div>
                </div>

                {/* Tailored Resume */}
                <div className={`resume-preview tailored ${activeTab === 'tailored' ? 'active-mobile' : ''}`}>
                    <div className="preview-header">
                        <h3>Tailored Result</h3>
                        <button className="copy-btn" onClick={handleCopy} title="Copy text">
                            <Copy size={16} />
                        </button>
                    </div>
                    <div className="preview-content">
                        <pre>{tailoredText}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
