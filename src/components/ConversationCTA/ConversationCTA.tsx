import Link from "next/link";
import styles from "./ConversationCTA.module.css";

const benefits = [
  "Conversación inicial.",
  "Enfoque en tus necesidades.",
  "Sin soluciones prediseñadas.",
  "Un siguiente paso claro.",
];

export default function ConversationCTA() {
  return (
    <section
      className={`section section-dark ${styles.ctaSection}`}
      id="primer-paso"
      aria-labelledby="first-step-heading"
    >
      <div className={`container ${styles.container}`}>
        <div className={styles.innerCard}>
          <span className={styles.eyebrowWhite}>EMPECEMOS POR</span>

          <h2 id="first-step-heading" className={styles.headline}>
            Una conversación.
          </h2>

          <div className={styles.copyBlock}>
            <p className={styles.leadText}>
              Cuéntanos qué estás construyendo, qué tienes hoy y qué necesitas
              resolver.
            </p>
            <p className={styles.subText}>
              Juntos podemos ordenar qué hacer ahora, qué hacer después y qué
              todavía puede esperar.
            </p>
          </div>

          <ul className={styles.benefitsList}>
            {benefits.map((benefit, index) => (
              <li key={index} className={styles.benefitItem}>
                <span className={styles.benefitDot} aria-hidden="true" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <Link
              href="#contacto"
              className={`btn ${styles.primaryCta}`}
            >
              AGENDA UNA LLAMADA
            </Link>

            {/* El CTA de WhatsApp permanece oculto conforme a las reglas oficiales hasta contar con número verificado */}
          </div>

          <p className={styles.microcopy}>
            Sin paquetes genéricos. Sin presión.
          </p>
        </div>
      </div>
    </section>
  );
}
