import React from 'react';
import './HomeScreen.css';

const HomeScreen: React.FC = () => {
  return (
    <div className="home-screen">
      <header className="app-header">
        <div className="header-content">
          <img
            src="/icons/MyPWA-74x74.webp"
            alt="Mi PWA"
            className="header-logo"
          />
          <h1 className="app-title">Mi PWA</h1>
        </div>
      </header>

      <main className="main-content">
        <section className="welcome-section">
          <h2 className="welcome-title">¡Bienvenido!</h2>
          <p className="welcome-text">
            Esta es mi aplicación web progresiva construida con React y Vite.
          </p>
        </section>

        <section className="features-section">
          <div className="feature-card">
            <h3>Instalable</h3>
            <p>Instala la app en tu dispositivo para una experiencia nativa</p>
          </div>

          <div className="feature-card">
            <h3>Rápida</h3>
            <p>Carga instantánea con tecnología de App Shell</p>
          </div>

          <div className="feature-card">
            <h3>Offline</h3>
            <p>Funciona sin conexión a internet</p>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>&copy; 2025. Aplicación Web Progresiva de Adrian.</p>
      </footer>
    </div>
  );
};

export default HomeScreen;
