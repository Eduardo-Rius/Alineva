import Image from "next/image";
import styles from "./About.module.css";

const emmaCredentials = [
  "Newell Brands",
  "Sharpie",
  "Uniball",
  "Expo",
  "Rubbermaid",
  "Amazon",
  "Mercado Libre",
];

const yurikoCredentials = [
  "Walmart",
  "Liverpool",
  "Suburbia",
  "TELMEX",
  "Mabe",
  "MacStore",
  "Nestlé",
  "La Costeña",
];

export default function About() {
  return (
    <section
      className={`section ${styles.aboutSection}`}
      id="nosotras"
      aria-labelledby="about-heading"
    >
      <div className={`container ${styles.container}`}>
        {/* Header Block */}
        <header className={styles.header}>
          <span className="eyebrow">QUIÉNES SOMOS</span>
          <h2 id="about-heading" className={styles.headline}>
            Dos perspectivas complementarias, un mismo objetivo: ayudar a tu
            negocio a avanzar.
          </h2>
          <div className={styles.introParagraphs}>
            <p>
              Alineva nace de una idea sencilla: antes de crecer, muchas veces
              hay que alinear.
            </p>
            <p>
              Acompañamos a empresas que están creciendo y que necesitan ordenar
              prioridades, tomar decisiones y convertirlas en acciones
              concretas, sin necesariamente contar con un equipo interno para
              resolverlo todo.
            </p>
          </div>
        </header>

        {/* Joint Opening Photography */}
        <div className={styles.jointPhotoFrame}>
          <Image
            src="/images/alineva/nosotras-apertura.webp"
            alt="Emma Alvarado y Yuriko Peña, socias fundadoras de Alineva"
            fill
            className={styles.jointPhotoImage}
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        </div>

        {/* Individual Founder Profiles */}
        <div className={styles.profilesGrid}>
          {/* Emma Alvarado */}
          <article className={styles.profileCard}>
            <div className={styles.portraitWrapper}>
              <Image
                src="/images/alineva/emma-alvarado.png"
                alt="Retrato de Emma Alvarado, socia fundadora de Alineva"
                fill
                className={styles.portraitImage}
                sizes="(max-width: 768px) 100vw, 480px"
              />
            </div>
            <div className={styles.profileContent}>
              <h3 className={styles.founderName}>EMMA ALVARADO</h3>
              <p className={styles.founderTerritories}>
                Estrategia · Marketing · Negocio · E-commerce
              </p>
              <p className={styles.founderBio}>
                Más de 19 años en estrategia de marca, innovación, categorías y
                consumer insights para LATAM. Suma experiencia como emprendedora
                y operadora de negocios en Amazon, con conocimiento práctico de
                marketplaces, e-commerce, publicidad digital y análisis de
                desempeño.
              </p>
              <div className={styles.credentialsBlock}>
                <span className={styles.credentialsLabel}>
                  Experiencia con marcas como:
                </span>
                <p className={styles.credentialsList}>
                  {emmaCredentials.join(" · ")}
                </p>
              </div>
            </div>
          </article>

          {/* Yuriko Peña */}
          <article className={styles.profileCard}>
            <div className={styles.portraitWrapper}>
              <Image
                src="/images/alineva/yuriko-pena.png"
                alt="Retrato de Yuriko Peña, socia fundadora de Alineva"
                fill
                className={styles.portraitImageYuriko}
                sizes="(max-width: 768px) 100vw, 480px"
              />
            </div>
            <div className={styles.profileContent}>
              <h3 className={styles.founderName}>YURIKO PEÑA</h3>
              <p className={styles.founderTerritories}>
                Marketing · Retail &amp; E-commerce · Publicidad · Gestión de
                proyectos
              </p>
              <p className={styles.founderBio}>
                Más de 10 años combinando agencia y entorno corporativo. Ha
                liderado cuentas, campañas, equipos y proveedores, y sumó
                experiencia directa en Walmart dentro del área de compras para
                e-commerce, aportando la perspectiva del retailer y del negocio
                digital.
              </p>
              <div className={styles.credentialsBlock}>
                <span className={styles.credentialsLabel}>
                  Experiencia con marcas como:
                </span>
                <p className={styles.credentialsList}>
                  {yurikoCredentials.join(" · ")}
                </p>
              </div>
            </div>
          </article>
        </div>

        {/* Section Closing Callout */}
        <div className={styles.closingNote}>
          <p className={styles.closingCopy}>
            Juntas aportamos visión de negocio, experiencia comercial y
            capacidad para integrar a los especialistas adecuados en cada
            proyecto.
          </p>
        </div>
      </div>
    </section>
  );
}
