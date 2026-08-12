import styles from "./About.module.css";

export default function About() {
  return (
    <section className={`section ${styles.section}`} id="nosotros" aria-labelledby="about-heading">
      <div className={`container ${styles.container}`}>
        
        <div className={styles.grid}>
          {/* Visual Column */}
          <div className={styles.visualCol}>
            <div className={styles.imagePlaceholder} aria-label="Fotografía del equipo fundador de Alineva">
              <span className={styles.placeholderText}>[EDITORIAL PLACEHOLDER]</span>
              <span className={styles.placeholderSubtext}>Fotografía de equipo</span>
            </div>
            
            <div className={styles.conceptBox}>
              <p className={styles.conceptText}>
                <strong>Un solo punto de contacto.</strong> <br/>
                El equipo adecuado para cada necesidad.
              </p>
            </div>
          </div>

          {/* Content Column */}
          <div className={styles.contentCol}>
            <span className={styles.eyebrow} aria-hidden="true">QUIÉNES SOMOS</span>
            
            <h2 id="about-heading" className={styles.title}>
              Un equipo cercano, con la flexibilidad de sumar al especialista adecuado.
            </h2>
            
            <div className={styles.introBlock}>
              <p className={styles.bodyText}>
                Alineva nace para acompañar a las PyMEs de una manera más simple: entender primero qué necesitan, definir una ruta clara y coordinar las soluciones necesarias para hacerla realidad.
              </p>
              <p className={styles.bodyText}>
                No buscamos convertirnos en una estructura más dentro de tu empresa. Buscamos ser el aliado que te ayuda a avanzar con claridad y seguimiento.
              </p>
            </div>

            <ul className={styles.modelList}>
              <li className={styles.modelItem}>Alineva diagnostica.</li>
              <li className={styles.modelItem}>Alineva define prioridades.</li>
              <li className={styles.modelItem}>Alineva acompaña.</li>
              <li className={styles.modelItem}>Alineva coordina.</li>
              <li className={styles.modelItem}>
                Especialistas externos se integran cuando el proyecto lo requiere.
              </li>
            </ul>

            <p className={styles.supportCopy}>
              Trabajamos con un modelo flexible que nos permite integrar especialistas y proveedores según las necesidades reales de cada proyecto, manteniendo la estrategia y el seguimiento centralizados en Alineva.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
