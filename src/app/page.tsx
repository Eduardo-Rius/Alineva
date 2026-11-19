import Header from "@/components/Header/Header";
import Hero from "@/components/Hero/Hero";
import ForWhom from "@/components/ForWhom/ForWhom";
import BrandOrigin from "@/components/BrandOrigin/BrandOrigin";
import GrowthAreas from "@/components/GrowthAreas/GrowthAreas";
import Methodology from "@/components/Methodology/Methodology";
import AlliesModel from "@/components/AlliesModel/AlliesModel";
import ConversationCTA from "@/components/ConversationCTA/ConversationCTA";
import About from "@/components/About/About";
import Contact from "@/components/Contact/Contact";
import Footer from "@/components/Footer/Footer";
import VoiceAssistant, {
  AssistantProvider,
} from "@/components/VoiceAssistant/VoiceAssistant";

export default function Home() {
  return (
    <AssistantProvider>
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido principal
      </a>

      {/* 1. Header */}
      <Header />

      <main id="main-content">
        {/* 2. Hero */}
        <Hero />

        {/* 3. ¿Para quién es Alineva? */}
        <ForWhom />

        {/* 4. Origen y filosofía */}
        <BrandOrigin />

        {/* 5. ¿En qué podemos ayudarte? */}
        <GrowthAreas />

        {/* 6. Nuestra forma de trabajar */}
        <Methodology />

        {/* 7. Modelo de aliados */}
        <AlliesModel />

        {/* 8. Primer paso: una conversación */}
        <ConversationCTA />

        {/* 9. Nosotras */}
        <About />

        {/* 10. Contacto */}
        <Contact />
      </main>

      {/* 11. Footer */}
      <Footer />

      {/* 12. Panel y barra móvil del Asistente Virtual Alineva */}
      <VoiceAssistant />
    </AssistantProvider>
  );
}
