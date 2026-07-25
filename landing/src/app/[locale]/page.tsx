import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Features } from "@/components/Features";
import { Expertise } from "@/components/Expertise";
import { FAQ } from "@/components/FAQ";
import { DownloadCTA } from "@/components/DownloadCTA";
import { Footer } from "@/components/Footer";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Features />
        <Expertise />
        <FAQ />
        <DownloadCTA />
      </main>
      <Footer />
    </>
  );
}
