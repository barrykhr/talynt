import { Nav } from "@/components/contour/chrome/Nav";
import { Footer } from "@/components/contour/chrome/Footer";
import { WhatsAppButton } from "@/components/contour/chrome/WhatsAppButton";

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
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
