import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={`container ${styles.footerContainer}`}>
        
        <div className={styles.topSection}>
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logo} aria-label="Alineva Home">
              {/* [CONTENT PENDING] Official Logo */}
              ALINEVA
            </Link>
            <p className={styles.brandDescription}>
              Alineva acompaña a PyMEs y negocios en crecimiento con estrategia, marketing, ecommerce y soluciones prácticas para avanzar con mayor claridad.
            </p>
          </div>
          
          <div className={styles.linksCol}>
            <h3 className={styles.linksTitle}>Explora</h3>
            <ul className={styles.linksList}>
              <li><Link href="#servicios" className={styles.link}>Servicios</Link></li>
              <li><Link href="#metodologia" className={styles.link}>Metodología</Link></li>
              <li><Link href="#nosotros" className={styles.link}>Nosotros</Link></li>
            </ul>
          </div>

          <div className={styles.linksCol}>
            <h3 className={styles.linksTitle}>Contacto</h3>
            <ul className={styles.linksList}>
              <li><Link href="#diagnostico" className={styles.link}>Agenda un diagnóstico</Link></li>
              <li><Link href="#contacto" className={styles.link}>Contacto</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <p className={styles.copyright}>
            &copy; {currentYear} Alineva. Todos los derechos reservados.
          </p>
          
          {/* [CONTENT PENDING] Social & Privacy URLs */}
          {/* 
          <div className={styles.legalLinks}>
            <Link href="#" className={styles.legalLink}>Aviso de Privacidad</Link>
            <a href="#" className={styles.legalLink} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="#" className={styles.legalLink} target="_blank" rel="noopener noreferrer">Instagram</a>
          </div> 
          */}
        </div>

      </div>
    </footer>
  );
}
