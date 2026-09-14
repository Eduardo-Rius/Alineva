import Link from "next/link";
import Image from "next/image";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section
      className={styles.hero}
      id="inicio"
      aria-labelledby="hero-title"
    >
      <div className={`container ${styles.heroContainer}`}>
        {/* Content Column (Left) */}
        <div className={styles.contentCol}>
          <span className="eyebrow">
            ESTRATEGIA · ACOMPAÑAMIENTO · EJECUCIÓN
          </span>

          <h1 id="hero-title" className={styles.headline}>
            Crecemos contigo,{" "}
            <span className={styles.copperAccent}>paso a paso.</span>
          </h1>

          <p className={styles.bajada}>
            Estrategia, acompañamiento y los especialistas adecuados para cada
            etapa de tu negocio.
          </p>

          <p className={styles.bodyText}>
            Entendemos primero tu negocio, ayudamos a ordenar prioridades y
            encontramos la mejor manera de llevarlas a la práctica.
          </p>

          <div className={styles.actions}>
            <Link href="#contacto" className={`btn btn-primary ${styles.ctaPrimary}`}>
              PLATIQUEMOS
            </Link>
            <Link
              href="#como-trabajamos"
              className={`btn btn-secondary ${styles.ctaSecondary}`}
            >
              CONOCE CÓMO TRABAJAMOS
            </Link>
          </div>

          <p className={styles.microcopy}>
            Sin paquetes genéricos. Sin presión.
          </p>
        </div>

        {/* Photography Column (Right) */}
        <div className={styles.mediaCol}>
          <div className={styles.imageFrame}>
            <Image
              src="/images/alineva/hero-fundadoras.png"
              alt="Emma Alvarado y Yuriko Peña, fundadoras de Alineva, en sesión de trabajo estratégico"
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 48vw, 560px"
              className={styles.heroImage}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
