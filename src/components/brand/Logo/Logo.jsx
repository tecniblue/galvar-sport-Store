import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

export default function Logo({ isNavbar = false, isStatic = false }) {
  return (
    <Link to="/" className={`logo-container ${isNavbar ? 'navbar-logo' : ''} ${isStatic ? 'logo-static' : ''}`}>
      <div className="registered-mark">R</div>

      <h1 className="brand-title">
        <div className="glitch-layer red-layer" aria-hidden="true">GALVAR</div>
        <div className="glitch-layer cyan-layer" aria-hidden="true">GALVAR</div>
        <span className="g-neon">G</span>ALVAR
      </h1>

      <div className="brand-subline">
        <div className="velocity-arrows">
          {/* Primer triángulo sólido */}
          <svg className="arrow-svg arrow-filled" viewBox="0 0 20 20">
            <path d="M5 2 L17 10 L5 18 Z" />
          </svg>
          {/* Segundo triángulo hueco con borde delgado */}
          <svg className="arrow-svg arrow-outline" viewBox="0 0 20 20">
            <path d="M5 2 L17 10 L5 18 Z" />
          </svg>
          {/* Tercer triángulo hueco con borde delgado */}
          <svg className="arrow-svg arrow-outline" viewBox="0 0 20 20">
            <path d="M5 2 L17 10 L5 18 Z" />
          </svg>
        </div>
        <span className="sport-text">SPORT</span>
      </div>
    </Link>
  );
}
