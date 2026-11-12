import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Stack } from "./components/Stack";
import { Works } from "./components/Works";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { ScrollProgress } from "./components/ScrollProgress";
import { BackgroundStage } from "./components/BackgroundStage";
import { Cursor } from "./components/Cursor";
import { GlassDefs } from "./components/Glass";

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-ink font-sans text-paper antialiased">
      <BackgroundStage />
      <GlassDefs />
      <ScrollProgress />
      <Cursor />
      <Nav />
      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10 outline-none"
      >
        <Hero />
        <About />
        <Stack />
        <Works />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
