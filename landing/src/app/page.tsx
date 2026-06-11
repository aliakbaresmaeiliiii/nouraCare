import dynamic from "next/dynamic";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MobileDownloadBar } from "@/components/MobileDownloadBar";

const FeaturesSection = dynamic(
  () => import("@/components/FeaturesSection").then((m) => m.FeaturesSection),
  { loading: () => <SectionSkeleton /> },
);

const OtherFeatures = dynamic(
  () => import("@/components/OtherFeatures").then((m) => m.OtherFeatures),
  { loading: () => <SectionSkeleton /> },
);

const CtaBanner = dynamic(
  () => import("@/components/CtaBanner").then((m) => m.CtaBanner),
  { loading: () => <SectionSkeleton short /> },
);

const Footer = dynamic(
  () => import("@/components/Footer").then((m) => m.Footer),
  { loading: () => <SectionSkeleton short /> },
);

function SectionSkeleton({ short = false }: { short?: boolean }) {
  return (
    <div
      className="section-skeleton"
      style={{ minHeight: short ? "12rem" : "24rem" }}
      aria-hidden
    />
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeaturesSection />
        <OtherFeatures />
        <CtaBanner />
      </main>
      <Footer />
      <MobileDownloadBar />
    </>
  );
}
