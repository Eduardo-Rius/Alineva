import styles from "./Methodology.module.css";

const steps = [
  {
    num: "01",
    title: "Escuchamos",
    copy: "Entendemos tu negocio, tus objetivos, tus retos y el momento en el que te encuentras."
  },
  {
    num: "02",
    title: "Identificamos oportunidades",
    copy: "Detectamos áreas de mejora, prioridades y oportunidades de crecimiento que realmente pueden generar valor."
  },
  {
    num: "03",
    title: "Diseñamos una ruta clara",
    copy: "Definimos qué hacer primero, qué recursos necesitas y cómo avanzar de manera ordenada."
  },
  {
    num: "04",
    title: "Acompañamos la implementación",
    copy: "Coordinamos soluciones, especialistas y proveedores para ayudarte a convertir la estrategia en acciones concretas."
  },
  {
    num: "05",
    title: "Crecemos contigo",
    copy: "Damos seguimiento, medimos avances y ajustamos la ruta para mantener el crecimiento en movimiento."
  }
];

export default function Methodology() {
  return (
    <section className={`section ${styles.section}`} id="metodologia" aria-labelledby="methodology-heading">
      <div className={`container ${styles.container}`}>
        
        <header className={styles.header}>
          <span className={styles.eyebrow} aria-hidden="true">CÓMO TRABAJAMOS</span>
          <h2 id="methodology-heading" className={styles.title}>Una ruta clara para avanzar, paso a paso.</h2>
          <p className={styles.intro}>
            No empezamos con una solución prediseñada. Primero entendemos tu negocio, identificamos qué vale la pena priorizar y construimos contigo una ruta de acción realista.
          </p>
        </header>

        <div className={styles.timeline}>
          <div className={styles.progressLine} aria-hidden="true"></div>
          
          <div className={styles.stepsGrid}>
            {steps.map((step) => (
              <div key={step.num} className={styles.stepCard}>
                <div className={styles.stepDot} aria-hidden="true"></div>
                <span className={styles.stepNumber} aria-hidden="true">{step.num}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepCopy}>{step.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footerNote}>
          <p>
            No necesitas tener todas las respuestas antes de empezar. <br className={styles.desktopBr} />
            Para eso comienza el diagnóstico.
          </p>
        </div>

      </div>
    </section>
  );
}
