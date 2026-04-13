import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="container nav-container">
                <Link to="/" className="nav-logo">
                    KALASARTHI
                </Link>
                <div className="nav-links">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/marketplace" className="nav-link">Marketplace</Link>
                    <Link to="/about" className="nav-link">About</Link>
                    <Link to="/login" className="nav-link nav-auth">Login</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
