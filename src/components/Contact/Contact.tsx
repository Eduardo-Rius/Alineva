"use client";

import { useState } from "react";
import styles from "./Contact.module.css";

const interestOptions = [
  "Estrategia y crecimiento",
  "Marca y marketing",
  "Presencia digital",
  "Tecnología y automatización",
  "E-commerce y marketplaces",
  "Ventas y experiencia",
  "Experiencias y espacios",
  "Legal y protección de marca",
  "Capacitación y desarrollo",
  "No estoy seguro / Quiero platicarlo",
];

interface FormErrors {
  name?: string;
  company?: string;
  email?: string;
  interest?: string;
  message?: string;
  privacy?: string;
  privacyConsent?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    interest: "",
    message: "",
    privacy: false,
    website: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<
    | "idle"
    | "submitting"
    | "success"
    | "validation_error"
    | "service_unavailable"
    | "server_error"
  >("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for field on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Por favor ingresa tu nombre.";
    }

    if (!formData.company.trim()) {
      newErrors.company = "Por favor ingresa el nombre de tu empresa.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Por favor ingresa tu correo electrónico.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Por favor ingresa un correo electrónico válido.";
    }

    if (!formData.interest) {
      newErrors.interest = "Por favor selecciona un área de interés.";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Por favor describe brevemente qué necesitas.";
    }

    if (!formData.privacy) {
      newErrors.privacy = "Debes aceptar el tratamiento de datos para continuar.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      setStatus("validation_error");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company,
          email: formData.email,
          phone: formData.phone || undefined,
          interest: formData.interest,
          message: formData.message,
          privacyConsent: formData.privacy,
          website: formData.website,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 200 && data?.ok) {
        setStatus("success");
        setFormData({
          name: "",
          company: "",
          email: "",
          phone: "",
          interest: "",
          message: "",
          privacy: false,
          website: "",
        });
        setErrors({});
        return;
      }

      if (response.status === 503 || data?.code === "SERVICE_UNCONFIGURED") {
        setStatus("service_unavailable");
        return;
      }

      if (response.status === 400 && data?.details) {
        setStatus("validation_error");
        setErrors(data.details);
        return;
      }

      setStatus("server_error");
    } catch {
      setStatus("server_error");
    }
  };

  return (
    <section
      className={`section ${styles.contactSection}`}
      id="contacto"
      aria-labelledby="contact-heading"
    >
      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          {/* Content Column */}
          <div className={styles.contentCol}>
            <span className="eyebrow">HABLEMOS</span>
            <h2 id="contact-heading" className={styles.headline}>
              Cuéntanos qué necesita tu negocio.
            </h2>
            <p className={styles.bodyText}>
              Si prefieres contarnos primero qué estás buscando antes de agendar
              una llamada, déjanos tus datos y nos pondremos en contacto
              contigo.
            </p>
          </div>

          {/* Form Column */}
          <div className={styles.formCol}>
            <form
              className={styles.form}
              onSubmit={handleSubmit}
              noValidate
              aria-label="Formulario de contacto de Alineva"
            >
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="contact-name" className={styles.label}>
                    Nombre <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                    aria-required="true"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    autoComplete="name"
                  />
                  {errors.name && (
                    <span id="name-error" className={styles.errorMessage} role="alert">
                      {errors.name}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="contact-company" className={styles.label}>
                    Empresa <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="contact-company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.company ? styles.inputError : ""}`}
                    aria-required="true"
                    aria-invalid={!!errors.company}
                    aria-describedby={errors.company ? "company-error" : undefined}
                    autoComplete="organization"
                  />
                  {errors.company && (
                    <span id="company-error" className={styles.errorMessage} role="alert">
                      {errors.company}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="contact-email" className={styles.label}>
                    Correo electrónico <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <span id="email-error" className={styles.errorMessage} role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="contact-phone" className={styles.label}>
                    Teléfono <span className={styles.optional}>(opcional)</span>
                  </label>
                  <input
                    type="tel"
                    id="contact-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={styles.input}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="contact-interest" className={styles.label}>
                  ¿En qué podemos ayudarte? <span className={styles.required}>*</span>
                </label>
                <select
                  id="contact-interest"
                  name="interest"
                  value={formData.interest}
                  onChange={handleChange}
                  className={`${styles.select} ${errors.interest ? styles.inputError : ""}`}
                  aria-required="true"
                  aria-invalid={!!errors.interest}
                  aria-describedby={errors.interest ? "interest-error" : undefined}
                >
                  <option value="">Selecciona una opción</option>
                  {interestOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {errors.interest && (
                  <span id="interest-error" className={styles.errorMessage} role="alert">
                    {errors.interest}
                  </span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="contact-message" className={styles.label}>
                  Mensaje <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className={`${styles.textarea} ${errors.message ? styles.inputError : ""}`}
                  aria-required="true"
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "message-error" : undefined}
                />
                {errors.message && (
                  <span id="message-error" className={styles.errorMessage} role="alert">
                    {errors.message}
                  </span>
                )}
              </div>

              {/* Espacio para consentimiento informado con enlace al Aviso de Privacidad */}
              <div className={styles.privacyGroup}>
                <label htmlFor="contact-privacy" className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    id="contact-privacy"
                    name="privacy"
                    checked={formData.privacy}
                    onChange={handleChange}
                    className={styles.checkbox}
                    aria-required="true"
                    aria-invalid={!!errors.privacy}
                    aria-describedby={errors.privacy ? "privacy-error" : undefined}
                  />
                  <span className={styles.checkboxText}>
                    He leído el{" "}
                    <a
                      href="/legal/aviso-de-privacidad-alineva.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.privacyLink}
                      aria-label="Abrir Aviso de Privacidad Integral de Alineva en una nueva pestaña"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Aviso de Privacidad
                    </a>{" "}
                    y acepto el tratamiento de mis datos de contacto exclusivamente
                    para dar respuesta a esta solicitud.
                  </span>
                </label>
                {errors.privacy && (
                  <span id="privacy-error" className={styles.errorMessage} role="alert">
                    {errors.privacy}
                  </span>
                )}
                {errors.privacyConsent && !errors.privacy && (
                  <span id="privacy-error" className={styles.errorMessage} role="alert">
                    {errors.privacyConsent}
                  </span>
                )}
              </div>

              {/* Honeypot invisible para detección de bots */}
              <div className={styles.honeypot} aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                  type="text"
                  id="contact-website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={`btn btn-primary ${styles.submitButton}`}
                  disabled={status === "submitting"}
                  aria-busy={status === "submitting"}
                >
                  {status === "submitting" ? "ENVIANDO..." : "ENVIAR MENSAJE"}
                </button>

                <div aria-live="polite">
                  {status === "service_unavailable" && (
                    <div className={styles.statusNotice} role="status">
                      <p className={styles.statusTitle}>
                        Formulario validado y preparado.
                      </p>
                      <p className={styles.statusDetails}>
                        El canal de entrega con HubSpot CRM aún no está activado con credenciales de producción. Tu solicitud ha sido validada localmente pero no ha sido enviada a CRM.
                      </p>
                    </div>
                  )}

                  {status === "success" && (
                    <div className={`${styles.statusNotice} ${styles.statusNoticeSuccess}`} role="status">
                      <p className={styles.statusTitle}>
                        Mensaje recibido exitosamente.
                      </p>
                      <p className={styles.statusDetails}>
                        Muchas gracias por contactarnos. Emma Alvarado y Yuriko Peña se comunicarán contigo a la brevedad.
                      </p>
                    </div>
                  )}

                  {status === "server_error" && (
                    <div className={`${styles.statusNotice} ${styles.statusNoticeError}`} role="alert">
                      <p className={`${styles.statusTitle} ${styles.statusTitleError}`}>
                        No fue posible procesar tu solicitud.
                      </p>
                      <p className={styles.statusDetails}>
                        En este momento no pudimos registrar tu mensaje en el sistema. Por favor intenta más tarde o escríbenos directamente a contacto@alineva.com.mx.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
