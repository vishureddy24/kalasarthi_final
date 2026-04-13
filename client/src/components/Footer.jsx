import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container footer-container">
                <div className="footer-brand">
                    <h2 className="footer-logo">KALASARTHI</h2>
                    <p>Preserving Indian Heritage through Technology.</p>
                </div>
                <div className="footer-grid">
                    <div className="footer-section">
                        <h4>Marketplace</h4>
                        <ul>
                            <li><a href="#">Paintings</a></li>
                            <li><a href="#">Sculptures</a></li>
                            <li><a href="#">Handicrafts</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Company</h4>
                        <ul>
                            <li><a href="#">About Us</a></li>
                            <li><a href="#">Our Artisans</a></li>
                            <li><a href="#">Contact</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} Kalasarthi. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
