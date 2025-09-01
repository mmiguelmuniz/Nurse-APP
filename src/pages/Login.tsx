import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/Login.css'
import React from 'react'
import { Card, Button } from 'react-bootstrap'
import logoImg from '../assets/STANDARD_EAR_color_PNG.png'      // logo da escola
import bannerImg from '../assets/Banner.png' // banner de fundo

export default function Login() {
  const handleGoogleSignIn = () => {
    // TODO: conectar Google Identity (OAuth)
    console.log('Sign in with Google')
  }

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
  )
}
