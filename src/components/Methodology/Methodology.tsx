import Image from "next/image";
import styles from "./Methodology.module.css";

const steps = [
  {
    num: "01",
    name: "ENTENDER",
    copy: "Escuchamos antes de proponer.",
  },
  {
    num: "02",
    name: "PRIORIZAR",
    copy: "Definimos qué va primero.",
  },
  {
    num: "03",
    name: "RESOLVER",
    copy: "Aterrizamos la solución.",
  },
  {
    num: "04",
    name: "ACOMPAÑAR",
    copy: "Coordinamos y seguimos cerca.",
  },
  {
    num: "05",
    name: "CRECER",
    copy: "Medimos, ajustamos y evolucionamos.",
  },
];

export default function Methodology() {
  return (
    <section
      className={`section ${styles.methodologySection}`}
      id="como-trabajamos"
      aria-labelledby="methodology-heading"
    >
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <span className="eyebrow">NUESTRA FORMA DE TRABAJAR</span>
          <h2 id="methodology-heading" className={styles.title}>
            Primero entendemos tu negocio. Después proponemos.
          </h2>
          <p className={styles.bajada}>
            Alineva te ayuda a ordenar lo que necesitas, definir prioridades y
            llevarlas a la práctica.
          </p>
        </header>

        {/* Planning evidence photograph */}
        <div className={styles.imageWrapper}>
          <Image
            src="/images/alineva/como-trabajamos.png"
            alt="Mesa de trabajo y planeación estratégica de negocio"
            fill
            className={styles.planningImage}
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        </div>

        {/* 5-step process: horizontal on desktop, vertical on mobile */}
        <div className={styles.stepsTrack}>
          {steps.map((step) => (
            <div key={step.num} className={styles.stepCard}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNum} aria-hidden="true">
                  {step.num}
                </span>
                <h3 className={styles.stepName}>{step.name}</h3>
              </div>
              <p className={styles.stepCopy}>{step.copy}</p>
            </div>
          ))}
        </div>

        <div className={styles.closingBox}>
          <p className={styles.closingText}>
            No partimos de soluciones prediseñadas. Partimos de lo que realmente
            necesita tu negocio.
          </p>
        </div>
      </div>
    </section>
  );
}
