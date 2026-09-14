import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alineva | Estrategia, acompañamiento y soluciones para PyMEs",
  description:
    "Alineva acompaña a PyMEs y empresas en crecimiento a ordenar prioridades, profesionalizar áreas clave e integrar las soluciones y especialistas adecuados para avanzar.",
  openGraph: {
    title: "Alineva | Estrategia, acompañamiento y soluciones para PyMEs",
    description:
      "Alineva acompaña a PyMEs y empresas en crecimiento a ordenar prioridades, profesionalizar áreas clave e integrar las soluciones y especialistas adecuados para avanzar.",
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alineva | Estrategia, acompañamiento y soluciones para PyMEs",
    description:
      "Alineva acompaña a PyMEs y empresas en crecimiento a ordenar prioridades, profesionalizar áreas clave e integrar las soluciones y especialistas adecuados para avanzar.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Organization / ProfessionalService Schema with only confirmed data
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Alineva",
    description:
      "Agencia boutique que acompaña a PyMEs y empresas en crecimiento a ordenar prioridades, elegir las soluciones adecuadas y llevarlas a la práctica.",
  };

  return (
    <html lang="es" className={montserrat.variable}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </body>
    </html>
  );
}
