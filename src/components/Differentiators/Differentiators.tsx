import Link from "next/link";
import styles from "./Differentiators.module.css";

const differentiators = [
  {
    num: "01",
    title: "Primero entendemos. Después recomendamos.",
    copy: "Analizamos tu contexto, objetivos y retos antes de proponerte acciones, proveedores o herramientas."
  },
  {
    num: "02",
    title: "Tu negocio no necesita otro paquete genérico.",
    copy: "Diseñamos recomendaciones y soluciones adaptadas a la etapa, prioridades y capacidad real de tu empresa."
  },
  {
    num: "03",
    title: "Menos coordinación para ti.",
    copy: "Centralizamos la estrategia, el seguimiento y la comunicación para que no tengas que gestionar múltiples proveedores por separado."
  },
  {
    num: "04",
    title: "Sumamos especialistas cuando realmente hacen falta.",
    copy: "Nuestro modelo boutique nos permite integrar talento externo especializado según las necesidades de cada proyecto, sin inflar innecesariamente la estructura."
  },
  {
    num: "05",
    title: "No entregamos una recomendación y desaparecemos.",
    copy: "Acompañamos la implementación, damos seguimiento y ajustamos la ruta para mantener el proyecto avanzando."
  }
];

export default function Differentiators() {
  return (
    <section className={`section ${styles.section}`} id="diferenciadores" aria-labelledby="diff-heading">
      <div className={`container ${styles.container}`}>
        
        {/* Left Column (Sticky on Desktop) */}
        <div className={styles.stickyCol}>
          <span className={styles.eyebrow} aria-hidden="true">NUESTRA FORMA DE TRABAJAR</span>
          <h2 id="diff-heading" className={styles.title}>
            No empezamos vendiéndote servicios. <br/>
            <span className={styles.highlight}>Empezamos entendiendo tu negocio.</span>
          </h2>
          <p className={styles.intro}>
            Nuestro trabajo comienza con preguntas, no con soluciones prediseñadas. Buscamos entender qué está pasando, qué necesitas y qué vale la pena priorizar antes de construir una ruta de acción.
          </p>
          <div className={styles.ctaWrapperDesktop}>
            <Link href="#diagnostico" className={styles.ctaLink}>
              Cuéntanos qué necesita tu negocio
            </Link>
          </div>
        </div>

        {/* Right Column (List) */}
        <div className={styles.listCol}>
          {differentiators.map((diff) => (
            <div key={diff.num} className={styles.diffItem}>
              <span className={styles.diffNumber} aria-hidden="true">{diff.num}</span>
              <h3 className={styles.diffTitle}>{diff.title}</h3>
              <p className={styles.diffCopy}>{diff.copy}</p>
            </div>
          ))}
          
          <div className={styles.ctaWrapperMobile}>
            <Link href="#diagnostico" className={styles.ctaLink}>
              Cuéntanos qué necesita tu negocio
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
