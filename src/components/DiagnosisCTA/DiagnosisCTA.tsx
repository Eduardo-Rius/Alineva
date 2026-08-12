import Link from "next/link";
import styles from "./DiagnosisCTA.module.css";

export default function DiagnosisCTA() {
  return (
    <section className={`section ${styles.section}`} id="diagnostico" aria-labelledby="cta-heading">
      <div className={`container ${styles.container}`}>
        
        <div className={styles.grid}>
          {/* Content Column */}
          <div className={styles.contentCol}>
            <span className={styles.eyebrow} aria-hidden="true">PRIMER PASO</span>
            <h2 id="cta-heading" className={styles.title}>
              Empecemos por entender qué necesita tu negocio.
            </h2>
            <p className={styles.bodyText}>
              Agenda una conversación inicial con Alineva para conocer tu situación, tus prioridades y los retos que quieres resolver.
            </p>
            <p className={styles.bodyText}>
              No es una presentación comercial genérica. Es el primer paso para entender si podemos ayudarte y cuál podría ser la mejor ruta para avanzar.
            </p>

            <ul className={styles.benefitsList}>
              <li className={styles.benefitItem}>Conversación inicial</li>
              <li className={styles.benefitItem}>Enfoque en tus necesidades</li>
              <li className={styles.benefitItem}>Sin soluciones prediseñadas</li>
              <li className={styles.benefitItem}>Siguiente paso claro</li>
            </ul>

            <div className={styles.actions}>
              <Link href="#contacto" className={styles.primaryCta}>
                Agenda una reunión de diagnóstico
              </Link>
              <Link href="#contacto" className={styles.secondaryCta}>
                Prefiero contarte primero qué necesito
              </Link>
            </div>

            <p className={styles.microcopy}>
              Sin paquetes genéricos. Sin presión.
            </p>
          </div>

          {/* Visual/Placeholder Column */}
          <div className={styles.visualCol}>
            <div className={styles.calendarPlaceholder}>
              <div className={styles.calendarInner}>
                <span className={styles.calendarText}>
                  [ESPACIO PARA INTEGRACIÓN DE AGENDA]
                </span>
                <span className={styles.calendarSubtext}>
                  (Calendly / Cal.com)
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
