import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      
          <p className="right-align">
            {new Date().getFullYear()} &copy; All rights reserved by{' '}
            <a
              href="https://echohealthcare.in"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.echohealthcare.in
            </a>
          </p>
        </footer>
  );
};

export default Footer;
