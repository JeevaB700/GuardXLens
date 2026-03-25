import React from 'react';
import { useLocation } from 'react-router-dom';
import './CyberBackground.css';

const CyberBackground = () => {
    const location = useLocation();

    // Do NOT render animations during exam for performance and stability
    if (location.pathname.includes('/take-exam')) return null;

    return (
        <div className="cyber-grid-container">
            <div className="cyber-particles"></div>
            <div className="cyber-grid"></div>
            <div className="cyber-scanner"></div>
            <div className="cyber-glow"></div>
        </div>
    );
};

export default CyberBackground;
