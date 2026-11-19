import Image from "next/image";
import styles from "./GrowthAreas.module.css";

const services = [
  {
    num: "01",
    title: "Estrategia y crecimiento",
    capabilities: "Diagnóstico · Planeación · Estrategia comercial · Insights",
    benefit: "Ordenar necesidades y definir prioridades.",
  },
  {
    num: "02",
    title: "Marca y marketing",
    capabilities: "Imagen corporativa · Branding · Campañas en redes sociales",
    benefit: "Crear o fortalecer cómo se presenta tu marca.",
  },
  {
    num: "03",
    title: "Presencia digital",
    capabilities: "Web · Landing pages · SEO · Google Business · Redes sociales",
    benefit: "Construir presencia digital con propósito comercial.",
  },
  {
    num: "04",
    title: "Tecnología y automatización",
    capabilities: "WhatsApp · Chatbots · Automatizaciones · IA · Plataformas",
    benefit: "Hacer más eficiente la atención, el seguimiento y los procesos.",
  },
  {
    num: "05",
    title: "E-commerce y marketplaces",
    capabilities: "Amazon · Marketplaces · Listings · Publicidad · Análisis",
    benefit: "Mejorar visibilidad, operación y desempeño digital.",
  },
  {
    num: "06",
    title: "Ventas y experiencia",
    capabilities: "Estrategia comercial · Procesos · Leads · Customer journey",
    benefit: "Detectar oportunidades y mejorar el recorrido.",
  },
  {
    num: "07",
    title: "Experiencias y espacios",
    capabilities: "Showrooms · POP · Exhibiciones · Interiorismo",
    benefit: "Llevar la marca y su experiencia al espacio físico.",
  },
  {
    num: "08",
    title: "Legal y protección de marca",
    capabilities: "Viabilidad · Protección · Registro IMPI · Acompañamiento",
    benefit: "Proteger la marca antes y durante su construcción.",
  },
  {
    num: "09",
    title: "Capacitación y desarrollo",
    capabilities: "Liderazgo · Productividad · Cultura · Desarrollo de equipos",
    benefit: "Fortalecer líderes y equipos conforme crece la empresa.",
  },
];

export default function GrowthAreas() {
  return (
    <section
      className={`section ${styles.servicesSection}`}
      id="servicios"
      aria-labelledby="services-heading"
    >
      <div className={`container ${styles.container}`}>
        <header className={styles.header}>
          <span className="eyebrow">¿EN QUÉ PODEMOS AYUDARTE?</span>
          <h2 id="services-heading" className={styles.title}>
            Soluciones a la medida de tu etapa
          </h2>
          <p className={styles.intro}>
            Tenemos un abanico amplio de soluciones, pero integramos solo las que
            hacen sentido para cada etapa.
          </p>
        </header>

        {/* Visual pause photography banner */}
        <div className={styles.visualPauseFrame}>
          <Image
            src="/images/alineva/servicios-estrategia.webp"
            alt="Sesión de estrategia y definición de prioridades de negocio en Alineva"
            fill
            className={styles.visualPauseImage}
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        </div>

        {/* Editorial 2-column services list */}
        <div className={styles.servicesList}>
          {services.map((service) => (
            <article key={service.num} className={styles.serviceItem}>
              <div className={styles.serviceTop}>
                <span className={styles.serviceNum} aria-hidden="true">
                  {service.num}
                </span>
                <h3 className={styles.serviceTitle}>{service.title}</h3>
              </div>
              <p className={styles.serviceCapabilities}>
                {service.capabilities}
              </p>
              <p className={styles.serviceBenefit}>{service.benefit}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
