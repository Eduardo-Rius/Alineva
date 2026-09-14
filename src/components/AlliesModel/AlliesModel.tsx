import Image from "next/image";
import styles from "./AlliesModel.module.css";

export default function AlliesModel() {
  return (
    <section
      className={`section ${styles.alliesSection}`}
      id="aliados"
      aria-labelledby="allies-heading"
    >
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <span className="eyebrow">MODELO DE ALIADOS</span>
          <h2 id="allies-heading" className={styles.headline}>
            No pretendemos hacerlo todo.
          </h2>
          <p className={styles.bajada}>
            Creemos en hacer cada cosa con la gente adecuada.
          </p>
        </header>

        <div className={styles.contentGrid}>
          {/* Visual Model Diagram */}
          <div className={styles.modelDiagram} aria-label="Diagrama del modelo de aliados de Alineva">
            <div className={styles.nodeBusiness}>
              <span className={styles.nodeLabel}>TU NEGOCIO</span>
            </div>

            <div className={styles.connectorLine} aria-hidden="true" />

            <div className={styles.nodeAlineva}>
              <span className={styles.nodeBrand}>ALINEVA</span>
              <p className={styles.nodeRole}>
                Entendemos · Priorizamos
                <br />
                Coordinamos · Acompañamos
              </p>
            </div>

            <div className={styles.connectorLine} aria-hidden="true" />

            <div className={styles.nodeSpecialists}>
              <span className={styles.nodeLabelSpecialists}>
                ESPECIALISTAS ADECUADOS
              </span>
              <p className={styles.specialistsAreas}>
                Web · Tecnología · Marketing · Legal
                <br />
                E-commerce · Branding · Espacios · Capacitación
              </p>
            </div>
          </div>

          {/* Explanation & Photograph */}
          <div className={styles.explanationCol}>
            <div className={styles.imageFrame}>
              <Image
                src="/images/alineva/modelo-aliados.png"
                alt="Reunión de coordinación estratégica con aliados y especialistas"
                fill
                className={styles.alliesImage}
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>

            <div className={styles.textContent}>
              <p>
                Dependiendo de lo que necesites, algunas soluciones las podemos
                llevar directamente y en otras integramos especialistas.
              </p>
              <p>
                Pero no te dejamos coordinando a distintos proveedores: nos
                mantenemos involucradas para que todos entiendan el objetivo y
                las piezas trabajen juntas.
              </p>
              <div className={styles.closingCallout}>
                <p>
                  <strong>Tú mantienes un punto de acompañamiento.</strong>
                  <br />
                  Alineva ayuda a conectar las piezas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
