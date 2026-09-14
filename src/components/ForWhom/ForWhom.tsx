import styles from "./ForWhom.module.css";

const situations = [
  {
    num: "01",
    text: "Tu negocio está creciendo y necesitas ordenar qué atender primero.",
  },
  {
    num: "02",
    text: "Hay áreas que quieres profesionalizar: marketing, ventas, e-commerce, tecnología o procesos.",
  },
  {
    num: "03",
    text: "Trabajas con distintos proveedores y necesitas una visión más integrada.",
  },
  {
    num: "04",
    text: "Ves oportunidades de crecimiento, pero no tienes claro por dónde empezar.",
  },
  {
    num: "05",
    text: "Necesitas avanzar sin sumar innecesariamente más estructura interna.",
  },
];

export default function ForWhom() {
  return (
    <section
      className={`section ${styles.forWhomSection}`}
      id="para-quien"
      aria-labelledby="for-whom-heading"
    >
      <div className={`container ${styles.container}`}>
        <div className={styles.headerBlock}>
          <span className="eyebrow">¿PARA QUIÉN ES ALINEVA?</span>
          <h2 id="for-whom-heading" className={styles.headline}>
            Alineva es para empresas que quieren crecer con mayor claridad y
            estructura.
          </h2>
          <p className={styles.introText}>
            Acompañamos a empresas que están creciendo y que muchas veces tienen
            varias necesidades al mismo tiempo, pero no necesariamente un equipo
            interno para resolverlas todas.
          </p>
        </div>

        <div className={styles.situationsList}>
          {situations.map((situation) => (
            <div key={situation.num} className={styles.situationRow}>
              <span className={styles.situationNumber} aria-hidden="true">
                {situation.num}
              </span>
              <p className={styles.situationText}>{situation.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
