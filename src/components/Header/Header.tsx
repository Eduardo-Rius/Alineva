"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Manage body scroll lock and focus when mobile menu opens/closes
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      wasOpenRef.current = true;
    } else {
      document.body.style.overflow = "";
      if (wasOpenRef.current) {
        toggleButtonRef.current?.focus();
        wasOpenRef.current = false;
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  const handleLogoClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isMobileMenuOpen) {
        closeMobileMenu();
      }

      if (typeof window !== "undefined" && window.location.pathname === "/") {
        e.preventDefault();

        if (window.location.hash !== "#inicio") {
          window.history.pushState(null, "", "/#inicio");
        }

        const target = document.getElementById("inicio");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [isMobileMenuOpen, closeMobileMenu]
  );

  return (
    <header
      className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}
      role="banner"
    >
      <div className={`container ${styles.headerContainer}`}>
        <Link
          href="/#inicio"
          className={styles.logoLink}
          aria-label="Ir al inicio de Alineva"
          onClick={handleLogoClick}
        >
          <Image
            src="/brand/Alineva_Logo_Principal_Fondo_Claro.svg"
            alt="Alineva"
            width={125}
            height={97}
            priority
            className={styles.logoImage}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Navegación principal">
          <ul className={styles.navList}>
            <li>
              <Link href="#servicios" className={styles.navLink}>
                Servicios
              </Link>
            </li>
            <li>
              <Link href="#como-trabajamos" className={styles.navLink}>
                Cómo trabajamos
              </Link>
            </li>
            <li>
              <Link href="#nosotras" className={styles.navLink}>
                Nosotras
              </Link>
            </li>
            <li>
              <Link href="#contacto" className={styles.navLink}>
                Contacto
              </Link>
            </li>
          </ul>

          <Link href="#contacto" className={`btn btn-primary ${styles.ctaButton}`}>
            PLATIQUEMOS
          </Link>
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          ref={toggleButtonRef}
          type="button"
          className={`${styles.mobileToggle} ${isMobileMenuOpen ? styles.mobileToggleOpen : ""}`}
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation-menu"
          aria-label={isMobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>

        {/* Mobile Navigation Overlay */}
        <div
          id="mobile-navigation-menu"
          className={`${styles.mobileNavOverlay} ${isMobileMenuOpen ? styles.mobileNavOpen : ""}`}
          aria-hidden={!isMobileMenuOpen}
        >
          <nav className={styles.mobileNav} aria-label="Menú móvil">
            <ul className={styles.mobileNavList}>
              <li>
                <Link
                  href="#servicios"
                  className={styles.mobileNavLink}
                  onClick={closeMobileMenu}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                >
                  Servicios
                </Link>
              </li>
              <li>
                <Link
                  href="#como-trabajamos"
                  className={styles.mobileNavLink}
                  onClick={closeMobileMenu}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                >
                  Cómo trabajamos
                </Link>
              </li>
              <li>
                <Link
                  href="#nosotras"
                  className={styles.mobileNavLink}
                  onClick={closeMobileMenu}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                >
                  Nosotras
                </Link>
              </li>
              <li>
                <Link
                  href="#contacto"
                  className={styles.mobileNavLink}
                  onClick={closeMobileMenu}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                >
                  Contacto
                </Link>
              </li>
            </ul>

            <Link
              href="#contacto"
              className={`btn btn-primary ${styles.mobileCtaButton}`}
              onClick={closeMobileMenu}
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              PLATIQUEMOS
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
