import { useState, useRef, useEffect } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { Download, Copy, RotateCcw, ArrowLeft, CheckCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Button from '../components/Button';
import { resume as resumeApi } from '../services/api';
import './Result.css';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function Result() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('tailored');
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [resumeData, setResumeData] = useState({
        originalText: location.state?.originalText || '',
        tailoredText: location.state?.tailoredText || '',
        resumeId: location.state?.resumeId || searchParams.get('id') || ''
    });
    const printRef = useRef(null);

    const queryId = searchParams.get('id');

    useEffect(() => {
        if (!resumeData.tailoredText && queryId) {
            setLoadingData(true);
            resumeApi.getById(queryId)
                .then(data => {
                    setResumeData({
                        originalText: data.originalText || '',
                        tailoredText: data.tailoredText || '',
                        resumeId: data.id
                    });
                })
                .catch(err => {
                    console.error("Failed to load resume details:", err);
                })
                .finally(() => {
                    setLoadingData(false);
                });
        }
    }, [queryId, resumeData.tailoredText]);

    const { originalText, tailoredText, resumeId } = resumeData;

    const handleCopy = () => {
        navigator.clipboard.writeText(tailoredText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = async () => {
        if (!tailoredText) {
            alert("No tailored text to download.");
            return;
        }
        if (!printRef.current) return;

        setDownloading(true);
        try {
            // A4 at 96 dpi = 794 × 1123 px. The hidden div is always 794px wide
            // regardless of the device viewport, so output is identical on all screens.
            const element = printRef.current;

            const canvas = await html2canvas(element, {
                scale: 2,           // 2× for crisp text on retina / mobile
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,         // fixed A4 width — never reads the viewport
                windowWidth: 794,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            // A4 dimensions in mm
            const pdfW = 210;
            const pdfH = 297;

            // How many mm does one canvas pixel represent?
            const mmPerPx = pdfW / canvas.width;
            const contentHeightMm = canvas.height * mmPerPx;

            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

            let remainingHeight = contentHeightMm;
            let sourceY = 0;          // in canvas pixels
            let pageIndex = 0;

            while (remainingHeight > 0) {
                if (pageIndex > 0) doc.addPage();

                // How many canvas pixels fit on one A4 page?
                const slicePxH = Math.round(pdfH / mmPerPx);

                // Crop out one page-worth of pixels from the canvas
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = Math.min(slicePxH, canvas.height - sourceY);

                const ctx = sliceCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, -sourceY);

                const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
                const sliceHeightMm = sliceCanvas.height * mmPerPx;

                doc.addImage(sliceData, 'JPEG', 0, 0, pdfW, sliceHeightMm);

                sourceY += slicePxH;
                remainingHeight -= pdfH;
                pageIndex++;
            }

            doc.save(`tailored-resume-${resumeId || 'new'}.pdf`);
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setDownloading(false);
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
                    <Button onClick={handleDownload} disabled={downloading}>
                        <Download size={15} className="icon-sm" />
                        {downloading ? 'Generating…' : 'Download PDF'}
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

            {/* Hidden fixed-width A4 render target — always 794px regardless of device */}
            <div
                ref={printRef}
                className="pdf-print-target"
                aria-hidden="true"
            >
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
    );
}
