import React from 'react';
import './Card.css';

const Card = ({ children, title, image, className = '' }) => {
    return (
        <div className={`premium-card ${className}`}>
            {image && <div className="card-image-container"><img src={image} alt={title} className="card-image" /></div>}
            <div className="card-content">
                {title && <h3 className="card-title">{title}</h3>}
                <div className="card-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Card;
