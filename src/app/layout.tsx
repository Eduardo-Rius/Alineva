import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
  variable: "--font-dm-serif",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Update with real domain when available
// const baseUrl = "https://www.alineva.com"; 

export const metadata: Metadata = {
  // metadataBase: new URL(baseUrl),
  title: "Alineva | Estrategia, marketing y crecimiento para PyMEs",
  description: "Alineva acompaña a PyMEs y negocios en crecimiento con estrategia, marketing, ecommerce y soluciones prácticas para avanzar con mayor claridad.",
  openGraph: {
    title: "Alineva | Estrategia, marketing y crecimiento para PyMEs",
    description: "Alineva acompaña a PyMEs y negocios en crecimiento con estrategia, marketing, ecommerce y soluciones prácticas para avanzar con mayor claridad.",
    type: "website",
    locale: "es_MX",
  },
  alternates: {
    // canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // Organization / ProfessionalService Schema
  // Only confirmed data is included
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Alineva",
    "description": "Agencia boutique de estrategia, marketing y crecimiento para PyMEs.",
    // "url": baseUrl,
    // "logo": `${baseUrl}/brand/alineva-logo.svg`,
  };

  return (
    <html lang="es" className={`${dmSerif.variable} ${inter.variable}`}>
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
