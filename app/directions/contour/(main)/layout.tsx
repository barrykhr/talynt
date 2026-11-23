import { Nav } from "@/components/contour/chrome/Nav";
import { Footer } from "@/components/contour/chrome/Footer";
import { WhatsAppButton } from "@/components/contour/chrome/WhatsAppButton";
import { MotionDirector } from "@/components/contour/motion/MotionDirector";
import { ScrollThread } from "@/components/contour/motion/ScrollThread";
import { MOTION } from "@/lib/contour/variant";

/** Every page except the entry screen: shared navigation, footer and contact action. */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#ct-main" className="ct-skip">
        Skip to content
      </a>
      <Nav />
      <main id="ct-main" tabIndex={-1} className="outline-none">
        {children}
        {MOTION && <ScrollThread />}
      </main>
      <Footer />
      <WhatsAppButton />
      {MOTION && <MotionDirector />}
    </>
  );
}
