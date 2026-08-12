import styles from "./GrowthAreas.module.css";

const areas = [
  {
    num: "01",
    title: "Marketing y marca",
    copy: "Te ayudamos a ordenar tu estrategia de marketing, fortalecer tu posicionamiento y construir una presencia más clara y consistente para tu negocio.",
    capabilities: [
      "Estrategia de marketing",
      "Posicionamiento",
      "Comunicación de marca",
      "Contenidos",
      "Campañas",
      "Coordinación de proveedores creativos"
    ]
  },
  {
    num: "02",
    title: "Ventas y desarrollo comercial",
    copy: "Identificamos oportunidades para fortalecer tu proceso comercial, mejorar la forma en que presentas tu oferta y generar nuevas oportunidades de crecimiento.",
    capabilities: [
      "Estrategia comercial",
      "Propuesta de valor",
      "Desarrollo de canales",
      "Materiales comerciales",
      "Prospección",
      "Seguimiento de oportunidades"
    ]
  },
  {
    num: "03",
    title: "Ecommerce y canales digitales",
    copy: "Te acompañamos a desarrollar, ordenar u optimizar tus canales digitales para que funcionen como una extensión real de tu negocio.",
    capabilities: [
      "Ecommerce",
      "Marketplaces",
      "Amazon",
      "Catálogos digitales",
      "Optimización comercial",
      "Estrategias de canal"
    ]
  },
  {
    num: "04",
    title: "Coordinación e implementación",
    copy: "Cuando el proyecto requiere especialistas, proveedores o diferentes disciplinas, Alineva coordina el proceso para que tengas claridad, seguimiento y un solo punto de contacto.",
    capabilities: [
      "Coordinación de especialistas",
      "Seguimiento de proyectos",
      "Implementación",
      "Priorización",
      "Control de avances",
      "Evaluación de resultados"
    ]
  }
];

export default function GrowthAreas() {
  return (
    <section className={`section ${styles.section}`} id="servicios" aria-labelledby="growth-heading">
      <div className={`container ${styles.container}`}>
        
        <header className={styles.header}>
          <span className={styles.eyebrow} aria-hidden="true">ÁREAS DE CRECIMIENTO</span>
          <h2 id="growth-heading" className={styles.title}>Qué podemos ayudarte a profesionalizar</h2>
          <p className={styles.intro}>
            No todas las empresas necesitan lo mismo ni en el mismo momento. Por eso empezamos por entender dónde estás y qué necesita realmente tu negocio para avanzar.
          </p>
        </header>

        <div className={styles.grid}>
          {areas.map((area) => (
            <div key={area.num} className={styles.card}>
              <div className={styles.cardNumber} aria-hidden="true">{area.num}</div>
              <h3 className={styles.cardTitle}>{area.title}</h3>
              <p className={styles.cardCopy}>{area.copy}</p>
              <ul className={styles.capabilitiesList}>
                {area.capabilities.map((item, index) => (
                  <li key={index} className={styles.capabilityItem}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.bridgeNote}>
          <p>
            No trabajamos con paquetes genéricos. Definimos qué necesita cada empresa antes de recomendar una solución.
          </p>
        </div>

      </div>
    </section>
  );
}
