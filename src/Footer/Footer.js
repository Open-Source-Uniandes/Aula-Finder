import './Footer.css';
import React from 'react';

const Footer = () => {
    return (
      <React.Fragment>
        <footer>
          <p>Hecho con <span role="img" aria-label="Love">💛</span> en Uniandes</p>
          <div className="footer-links">
            <p><strong><a href="https://github.com/Open-Source-Uniandes/Sobrecupo" target="_blank" rel="noopener noreferrer">
              Contribuye en GitHub
            </a></strong></p>
            <p className="footer-help">
              <a href="https://github.com/Open-Source-Uniandes/Sobrecupo/issues" target="_blank" rel="noopener noreferrer">
                Reporta errores o sugiere ideas
              </a>
            </p>
          </div>
        </footer>
      </React.Fragment>
    )
}

export default Footer;