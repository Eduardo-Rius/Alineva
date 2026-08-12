"use client";

import { useState } from "react";
import styles from "./Contact.module.css";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    
    // Mock API call
    setTimeout(() => {
      setStatus("success");
      (e.target as HTMLFormElement).reset();
      
      // Reset success state after a few seconds
      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    }, 1500);
  };

  return (
    <section className={`section ${styles.section}`} id="contacto" aria-labelledby="contact-heading">
      <div className={`container ${styles.container}`}>
        
        <div className={styles.grid}>
          {/* Content Column */}
          <div className={styles.contentCol}>
            <span className={styles.eyebrow} aria-hidden="true">HABLEMOS</span>
            <h2 id="contact-heading" className={styles.title}>
              Cuéntanos qué necesita tu negocio.
            </h2>
            <p className={styles.bodyText}>
              Si prefieres contarnos primero qué estás buscando antes de agendar una reunión, déjanos tus datos y nos pondremos en contacto contigo.
            </p>
          </div>

          {/* Form Column */}
          <div className={styles.formCol}>
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="name" className={styles.label}>Nombre</label>
                  <input type="text" id="name" name="name" className={styles.input} required aria-required="true" />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="company" className={styles.label}>Empresa</label>
                  <input type="text" id="company" name="company" className={styles.input} required aria-required="true" />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="email" className={styles.label}>Correo electrónico</label>
                  <input type="email" id="email" name="email" className={styles.input} required aria-required="true" />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="phone" className={styles.label}>Teléfono <span className={styles.optional}>(opcional)</span></label>
                  <input type="tel" id="phone" name="phone" className={styles.input} />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="subject" className={styles.label}>¿En qué podemos ayudarte?</label>
                <select id="subject" name="subject" className={styles.select} required aria-required="true" defaultValue="">
                  <option value="" disabled>Selecciona una opción</option>
                  <option value="estrategia">Estrategia y Dirección</option>
                  <option value="marketing">Marketing y Crecimiento</option>
                  <option value="ecommerce">Ecommerce y Digital</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="message" className={styles.label}>Mensaje</label>
                <textarea id="message" name="message" rows={4} className={styles.textarea} required aria-required="true"></textarea>
              </div>

              <div className={styles.actions}>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={status === "loading" || status === "success"}
                >
                  {status === "loading" ? "Enviando..." : "Enviar mensaje"}
                </button>
                
                {status === "success" && (
                  <p className={styles.successMessage} role="status">
                    ¡Gracias! Hemos recibido tu mensaje. Nos pondremos en contacto contigo pronto.
                  </p>
                )}
                {status === "error" && (
                  <p className={styles.errorMessage} role="alert">
                    Hubo un problema al enviar tu mensaje. Por favor intenta de nuevo.
                  </p>
                )}
              </div>

            </form>
          </div>
        </div>

      </div>
    </section>
  );
}
