import Link from "next/link";
import Image from "next/image";
import styles from "./BrandOrigin.module.css";

export default function BrandOrigin() {
  return (
    <section
      className={`section ${styles.brandOriginSection}`}
      id="origen"
      aria-labelledby="brand-origin-heading"
    >
      <div className={`container ${styles.container}`}>
        <div className={styles.contentCol}>
          <span className="eyebrow">DE DÓNDE VIENE ALINEVA</span>

          <h2 id="brand-origin-heading" className={styles.headline}>
            Alinear para evolucionar.
          </h2>

          <div className={styles.bodyParagraphs}>
            <p className={styles.leadText}>
              El nombre Alineva reúne dos ideas que definen nuestra forma de
              trabajar: <strong>ALINEAR + EVOLUCIONAR / AVANZAR</strong>.
            </p>

            <p>
              <strong>Alinear</strong> significa entender dónde está hoy el
              negocio, ordenar necesidades y prioridades, y conectar a las
              personas y soluciones adecuadas.
            </p>

            <p>
              <strong>Evolucionar y avanzar</strong> significa convertir esa
              claridad en acciones concretas que ayuden al negocio a dar el
              siguiente paso.
            </p>
          </div>

          <div className={styles.philosophyBlock}>
            <h3 className={styles.philosophyTitle}>Nuestra filosofía</h3>
            <p className={styles.philosophyText}>
              No se trata de hacer todo al mismo tiempo, sino de saber qué
              necesita atención primero y acompañar cada etapa con claridad.
            </p>
          </div>

          <div className={styles.closingHighlight}>
            <p className={styles.highlightQuote}>
              Claridad para decidir. Acompañamiento para avanzar.
            </p>
          </div>

          <div className={styles.actions}>
            <Link
              href="#servicios"
              className={`btn btn-secondary ${styles.ctaButton}`}
            >
              CONOCE CÓMO PODEMOS AYUDARTE
            </Link>
          </div>
        </div>

        {/* Visual column with subtle isotipo */}
        <div className={styles.visualCol} aria-hidden="true">
          <div className={styles.isotipoWrapper}>
            <Image
              src="/brand/Alineva_Isotipo_Fondo_Claro.svg"
              alt=""
              width={340}
              height={340}
              className={styles.isotipoImage}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
