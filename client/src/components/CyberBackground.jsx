import React from 'react';
import { useLocation } from 'react-router-dom';
import './CyberBackground.css';

const CyberBackground = () => {
    const location = useLocation();
    // Skip during exam for performance & stability
    if (location.pathname.includes('/take-exam')) return null;

    return (
        <div className="cyber-grid-container">
            <div className="cyber-particles"></div>
            <div className="cyber-grid"></div>
            <div className="cyber-scanner"></div>
            <div className="cyber-glow"></div>
            <div className="cyber-glow-2"></div>
            <div className="cyber-corner-accent"></div>
            <div className="cyber-corner-accent-2"></div>
        </div>
    );
};

export default CyberBackground;
