import styles from "./CaseStudies.module.css";

interface CaseStudiesProps {
  enabled?: boolean;
}

export default function CaseStudies({ enabled = false }: CaseStudiesProps) {
  
  if (enabled) {
    return (
      <section className={`section ${styles.section}`} id="casos">
        <div className={`container ${styles.container}`}>
          <div className={styles.pendingBlock}>
            {/* Future Architecture for Real Cases */}
            <p>Sección de Casos habilitada (Contenido real pendiente).</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`section ${styles.section}`} id="casos" aria-labelledby="cases-heading">
      <div className={`container ${styles.container}`}>
        
        <div className={styles.pendingBlock}>
          <span className={styles.eyebrow} aria-hidden="true">RESULTADOS EN CONSTRUCCIÓN</span>
          <h2 id="cases-heading" className={styles.title}>
            Cada negocio tiene un reto distinto. <br className={styles.desktopBr} />
            La solución también debe serlo.
          </h2>
          <p className={styles.intro}>
            Estamos documentando nuestros primeros casos para compartir próximamente cómo acompañamos a distintas empresas en sus procesos de crecimiento.
          </p>
        </div>

      </div>
    </section>
  );
}
