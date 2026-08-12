import styles from "./Experience.module.css";

const blocks = [
  {
    title: "ESTRATEGIA",
    copy: "Capacidad para analizar, priorizar y definir rutas claras."
  },
  {
    title: "EJECUCIÓN",
    copy: "Orientación práctica para convertir recomendaciones en acciones."
  },
  {
    title: "ACOMPAÑAMIENTO",
    copy: "Seguimiento cercano durante todo el proceso."
  }
];

export default function Experience() {
  return (
    <section className={`section ${styles.section}`} id="experiencia" aria-labelledby="experience-heading">
      <div className={`container ${styles.container}`}>
        
        <header className={styles.header}>
          <span className={styles.eyebrow} aria-hidden="true">EXPERIENCIA QUE SE TRADUCE EN ACCIÓN</span>
          <h2 id="experience-heading" className={styles.title}>
            Experiencia para pensar estratégicamente. <br className={styles.desktopBr} />
            <span className={styles.highlight}>Cercanía para hacerlo realidad.</span>
          </h2>
          <p className={styles.intro}>
            La experiencia detrás de Alineva combina visión estratégica con ejecución práctica, permitiéndonos entender tanto la necesidad de planear con claridad como la realidad cotidiana de implementar.
          </p>
        </header>

        <div className={styles.blocksGrid}>
          {blocks.map((block, index) => (
            <div key={index} className={styles.block}>
              <h3 className={styles.blockTitle}>{block.title}</h3>
              <p className={styles.blockCopy}>{block.copy}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
