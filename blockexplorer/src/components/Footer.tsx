'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically handle the newsletter subscription
    alert(`Thank you for subscribing with ${email}!`);
    setEmail('');
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Column 1: About */}
          <div>
            <h3 className={styles.columnTitle}>About TOPAY</h3>
            <p className={styles.columnText}>
              TOPAY is a next-generation blockchain platform designed for speed, security, and scalability.
            </p>
            
            {/* Newsletter subscription */}
            <div className={styles.newsletter}>
              <h4 className={styles.columnTitle}>Stay Updated</h4>
              <form onSubmit={handleSubscribe}>
                <div className={styles.inputGroup}>
                  <input 
                    type="email" 
                    className={styles.emailInput}
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className={styles.subscribeButton}>Subscribe</button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Column 2: Quick Links */}
          <div>
            <h3 className={styles.columnTitle}>Quick Links</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/" className={styles.link}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/blocks" className={styles.link}>
                  Blocks
                </Link>
              </li>
              <li>
                <Link href="/report/transaction" className={styles.link}>
                  Report
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Network Stats
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Resources */}
          <div>
            <h3 className={styles.columnTitle}>Resources</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="#" className={styles.link}>
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Whitepaper
                </Link>
              </li>
              <li>
                <Link href="#" className={styles.link}>
                  Developer Portal
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Community */}
          <div>
            <h3 className={styles.columnTitle}>Community</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="#" className={`${styles.link} ${styles.socialLink}`}>
                  <svg className={styles.socialIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                  Twitter
                </Link>
              </li>
              <li>
                <Link href="#" className={`${styles.link} ${styles.socialLink}`}>
                  <svg className={styles.socialIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  Discord
                </Link>
              </li>
              <li>
                <Link href="#" className={`${styles.link} ${styles.socialLink}`}>
                  <svg className={styles.socialIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  GitHub
                </Link>
              </li>
              <li>
                <Link href="#" className={`${styles.link} ${styles.socialLink}`}>
                  <svg className={styles.socialIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  Instagram
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className={styles.copyright}>
          <div className={styles.footerBottom}>
            <p>&copy; {new Date().getFullYear()} TOPAY Foundation. All rights reserved.</p>
            <div className={styles.legalLinks}>
              <Link href="#" className={styles.legalLink}>Privacy Policy</Link>
              <Link href="#" className={styles.legalLink}>Terms of Service</Link>
              <Link href="#" className={styles.legalLink}>Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}