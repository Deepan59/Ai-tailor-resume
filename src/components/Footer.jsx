import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-content">
                <div className="footer-section">
                    <h3>ResumeAI</h3>
                    <p>Tailor your resume for every job using AI.</p>
                </div>
                <div className="footer-links">
                    <h4>Product</h4>
                    <a href="#">Features</a>
                    <a href="#">Pricing</a>
                </div>
                <div className="footer-links">
                    <h4>Legal</h4>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                </div>
            </div>
            <div className="container footer-bottom">
                <p>&copy; {new Date().getFullYear()} AI Resume Tailor. All rights reserved.</p>
            </div>
        </footer>
    );
}
