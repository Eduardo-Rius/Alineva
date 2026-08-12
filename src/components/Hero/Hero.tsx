import Link from "next/link";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={`container ${styles.heroContainer}`}>
        
        {/* Content Column */}
        <div className={styles.contentCol}>
          <div className={styles.eyebrow} aria-hidden="true">
            ESTRATEGIA &middot; ACOMPAÑAMIENTO &middot; EJECUCIÓN
          </div>
          
          <h1 id="hero-heading" className={styles.title}>
            Crecemos contigo, <span className={styles.highlight}>paso a paso.</span>
          </h1>
          
          <p className={styles.description}>
            Ayudamos a PyMEs y negocios en crecimiento a ordenar prioridades, profesionalizar áreas clave y convertir sus necesidades en soluciones prácticas para seguir avanzando.
          </p>
          
          <div className={styles.actions}>
            <Link href="#diagnostico" className={styles.primaryCta}>
              Agenda una reunión de diagnóstico
            </Link>
            <Link href="#metodologia" className={styles.secondaryCta}>
              Conoce cómo trabajamos
            </Link>
          </div>
          
          <p className={styles.supportText}>
            Estrategia, acompañamiento y soluciones a la medida de tu negocio.
          </p>
        </div>

        {/* Image Column */}
        <div className={styles.imageCol}>
          <div className={styles.imageWrapper}>
            {/* 
              TODO: Replace with actual Image when available. 
              Currently using a semantic placeholder with the correct aspect ratio.
            */}
            <div className={styles.imagePlaceholder} aria-label="Fotografía de equipo de consultoría trabajando paso a paso">
              <span className={styles.placeholderText}>[EDITORIAL PLACEHOLDER]</span>
            </div>
          </div>
          {/* Decorative Arc Element */}
          <div className={styles.decorativeArc} aria-hidden="true"></div>
        </div>

      </div>
    </section>
  );
}
