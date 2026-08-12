import Header from "@/components/Header/Header";
import Hero from "@/components/Hero/Hero";
import ForWhom from "@/components/ForWhom/ForWhom";
import GrowthAreas from "@/components/GrowthAreas/GrowthAreas";
import Differentiators from "@/components/Differentiators/Differentiators";
import Methodology from "@/components/Methodology/Methodology";
import DiagnosisCTA from "@/components/DiagnosisCTA/DiagnosisCTA";
import About from "@/components/About/About";
import Experience from "@/components/Experience/Experience";
import Contact from "@/components/Contact/Contact";
import Footer from "@/components/Footer/Footer";

export default function Home() {
  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido principal
      </a>
      
      <Header />
      
      <main id="main-content">
        <Hero />
        <ForWhom />
        <GrowthAreas />
        <Differentiators />
        <Methodology />
        <DiagnosisCTA />
        <About />
        <Experience />
        <Contact />
      </main>
      
      <Footer />
    </>
  );
}
