import Link from "next/link";
import styles from "./ForWhom.module.css";

const situations = [
  {
    num: "01",
    text: "Tu negocio está creciendo, pero muchas decisiones siguen dependiendo de ti.",
  },
  {
    num: "02",
    text: "Necesitas profesionalizar marketing, ventas, ecommerce o procesos digitales.",
  },
  {
    num: "03",
    text: "Has trabajado con distintos proveedores, pero falta coordinación y una visión integral.",
  },
  {
    num: "04",
    text: "Sabes que hay oportunidades de crecimiento, pero no tienes claro por dónde empezar.",
  },
  {
    num: "05",
    text: "Buscas soluciones prácticas y acompañamiento sin aumentar innecesariamente tu estructura interna.",
  },
];

export default function ForWhom() {
  return (
    <section className={`section ${styles.forWhomSection}`} id="para-quien" aria-labelledby="for-whom-heading">
      <div className={`container ${styles.container}`}>
        
        <div className={styles.introBlock}>
          <h2 id="for-whom-heading" className={styles.headline}>
            Alineva es para empresas que quieren crecer con mayor claridad y estructura.
          </h2>
          <p className={styles.introText}>
            Trabajamos con dueños, emprendedores y equipos de PyMEs que ya están operando y necesitan ordenar prioridades, profesionalizar áreas clave o encontrar los especialistas adecuados para avanzar.
          </p>
        </div>

        <div className={styles.situationsGrid}>
          {situations.map((situation, index) => (
            <div key={index} className={styles.situationItem}>
              <span className={styles.situationNumber} aria-hidden="true">{situation.num}</span>
              <p className={styles.situationText}>{situation.text}</p>
            </div>
          ))}
        </div>

        <div className={styles.closingBlock}>
          <p className={styles.closingText}>
            No importa únicamente dónde está hoy tu empresa, sino hacia dónde quiere crecer. En Alineva te ayudamos a definir el camino y a convertirlo en acciones concretas.
          </p>
          <Link href="#diagnostico" className={styles.ctaButton}>
            Cuéntanos qué necesita tu negocio
          </Link>
        </div>

      </div>
    </section>
  );
}
