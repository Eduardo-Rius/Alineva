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
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "pending_backend" | "error">("idle");

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      setStatus("error");
      return;
    }

    // Regla obligatoria: No simular un envío exitoso si no existe backend.
    // La interfaz permanece lista y accesible, documentando con honestidad el estado técnico.
    setStatus("loading");
    setTimeout(() => {
      setStatus("pending_backend");
    }, 600);
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

              {/* Espacio lógico para consentimiento sin enlaces legales falsos */}
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
                    Acepto el tratamiento de mis datos de contacto exclusivamente
                    para dar respuesta a esta solicitud.
                  </span>
                </label>
                {errors.privacy && (
                  <span id="privacy-error" className={styles.errorMessage} role="alert">
                    {errors.privacy}
                  </span>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={`btn btn-primary ${styles.submitButton}`}
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "ENVIANDO..." : "ENVIAR MENSAJE"}
                </button>

                {status === "pending_backend" && (
                  <div className={styles.statusNotice} role="status">
                    <p className={styles.statusTitle}>
                      Formulario validado y preparado.
                    </p>
                    <p className={styles.statusDetails}>
                      La integración del servicio de entrega de correos / backend oficial está pendiente de asignación de credenciales. No se simulan envíos falsos.
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
