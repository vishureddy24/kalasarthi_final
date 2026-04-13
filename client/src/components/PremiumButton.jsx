import React from 'react';
import './PremiumButton.css';

const PremiumButton = ({ children, onClick, variant = 'primary', className = '' }) => {
    return (
        <button
            className={`premium-button ${variant} ${className}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default PremiumButton;
