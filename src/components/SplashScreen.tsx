import React from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  isVisible: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          <img
            src="/icons/MyPWA-144x144.webp"
            alt="Mi PWA Logo"
            className="splash-icon"
          />
        </div>
        <h1 className="splash-title">Mi PWA</h1>
        <p className="splash-subtitle">Aplicación Web Progresiva</p>
        <div className="splash-loader">
          <div className="loader-spinner"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
