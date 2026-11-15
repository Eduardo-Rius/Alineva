"use client";

import { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";

export default function Footer() {
  const handleLogoClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
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
    []
  );

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`container ${styles.footerContainer}`}>
        <div className={styles.topSection}>
          {/* Brand Column */}
          <div className={styles.brandCol}>
            <Link
              href="/#inicio"
              className={styles.logoLink}
              aria-label="Ir al inicio de Alineva"
              onClick={handleLogoClick}
            >
              <Image
                src="/brand/Alineva_Logo_Principal_Fondo_Oscuro.svg"
                alt="Alineva"
                width={125}
                height={97}
                className={styles.logoImage}
              />
            </Link>
            <p className={styles.brandDescriptor}>
              Estrategia, acompañamiento y los especialistas adecuados para cada
              etapa de tu negocio.
            </p>
          </div>

          {/* Navigation Column */}
          <div className={styles.linksCol}>
            <h3 className={styles.linksTitle}>Explora</h3>
            <ul className={styles.linksList}>
              <li>
                <Link href="#servicios" className={styles.link}>
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="#como-trabajamos" className={styles.link}>
                  Cómo trabajamos
                </Link>
              </li>
              <li>
                <Link href="#nosotras" className={styles.link}>
                  Nosotras
                </Link>
              </li>
              <li>
                <Link href="#contacto" className={styles.link}>
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className={styles.linksCol}>
            <h3 className={styles.linksTitle}>Contacto</h3>
            <ul className={styles.linksList}>
              <li>
                <Link href="#contacto" className={styles.link}>
                  Agenda una llamada
                </Link>
              </li>
              {/* WhatsApp se integrará una vez disponible el número oficial */}
            </ul>
          </div>

          {/* Closing Brand Philosophy */}
          <div className={styles.philosophyCol}>
            <p className={styles.philosophyAlineva}>
              Alinear para evolucionar.
            </p>
            <p className={styles.philosophyTagline}>
              Claridad para decidir. Acompañamiento para avanzar.
            </p>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <p className={styles.copyright}>
            &copy; 2026 Alineva. Todos los derechos reservados.
          </p>
          <a
            href="/legal/aviso-de-privacidad-alineva.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.legalLink}
            aria-label="Abrir Aviso de Privacidad Integral de Alineva en una nueva pestaña"
          >
            Aviso de Privacidad
          </a>
        </div>
      </div>
    </footer>
  );
}
