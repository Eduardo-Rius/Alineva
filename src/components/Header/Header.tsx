"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={`container ${styles.headerContainer}`}>
        <Link href="/" className={styles.logo} aria-label="Alineva Home">
          {/* Provisional text logo, waiting for real asset */}
          ALINEVA
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          <ul className={styles.navList}>
            <li><Link href="#servicios" className={styles.navLink}>Servicios</Link></li>
            <li><Link href="#metodologia" className={styles.navLink}>Metodología</Link></li>
            <li><Link href="#nosotros" className={styles.navLink}>Nosotros</Link></li>
            <li><Link href="#contacto" className={styles.navLink}>Contacto</Link></li>
          </ul>
          <Link href="#diagnostico" className={styles.ctaButton}>
            Agenda un diagnóstico
          </Link>
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button 
          className={`${styles.mobileToggle} ${isMobileMenuOpen ? styles.mobileToggleOpen : ""}`} 
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-label="Abrir menú"
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>

        {/* Mobile Navigation Overlay */}
        <div className={`${styles.mobileNavOverlay} ${isMobileMenuOpen ? styles.mobileNavOpen : ""}`}>
          <nav className={styles.mobileNav} aria-label="Mobile Navigation">
            <ul className={styles.mobileNavList}>
              <li><Link href="#servicios" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Servicios</Link></li>
              <li><Link href="#metodologia" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Metodología</Link></li>
              <li><Link href="#nosotros" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Nosotros</Link></li>
              <li><Link href="#contacto" className={styles.mobileNavLink} onClick={toggleMobileMenu}>Contacto</Link></li>
            </ul>
            <Link href="#diagnostico" className={styles.mobileCtaButton} onClick={toggleMobileMenu}>
              Agenda un diagnóstico
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
