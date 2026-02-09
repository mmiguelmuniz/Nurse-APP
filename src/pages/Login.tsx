import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/Login.css';
import React, { useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import logoImg from '../assets/STANDARD_EAR_color_PNG.png';
import bannerImg from '../assets/Banner.png';
import { captureTokensFromUrl, isAuthenticated, loginWithGoogle } from '../lib/auth';

export default function Login() {
  // Ao entrar na página, captura ?access/&?refresh e salva
  useEffect(() => {
    captureTokensFromUrl();
    // Se já estiver autenticado, manda para o dashboard
    if (isAuthenticated()) {
      window.location.href = '/';
    }
  }, []);

  const handleGoogleSignIn = () => {
    loginWithGoogle();
  };

  return (
    <div className="login-page">
      {/* Coluna do banner (background) */}
      <div
        className="login-hero"
        style={{ backgroundImage: `url(${bannerImg})` }}
        aria-hidden="true"
      />

      {/* Coluna do card (lado direito) */}
      <div className="login-container">
        <Card className="login-card shadow-lg border-0">
          <Card.Body className="p-4 p-md-5">
            <div className="text-center mb-4">
              <img
                src={logoImg}
                alt="American School of Recife"
                className="login-logo mb-2"
              />
              <h5 className="text-muted m-0">Welcome!</h5>
            </div>

            <div className="text-center text-muted mb-3">
              Please login to continue
            </div>

            <div className="d-grid">
              <Button
                variant="light"
                className="google-btn"
                onClick={handleGoogleSignIn}
              >
                <span className="g-logo" aria-hidden>G</span>
                <span>Sign in with Google</span>
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
