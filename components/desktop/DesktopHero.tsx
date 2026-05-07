import { ChevronRight, Sparkles } from "lucide-react";
import DesktopDownloadCard from "./DesktopDownloadCard";

const DesktopHero = () => {
  return (
    <section className="hero-light relative overflow-hidden">
      <div className="hero-mesh absolute inset-0" />
      <div className="hero-grid absolute inset-0" />

      <div className="relative z-10 container pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="border-primary/20 bg-brand-100 text-brand-700 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] font-medium backdrop-blur-sm">
            <span className="bg-accent/15 flex h-5 w-5 items-center justify-center rounded-full">
              <Sparkles size={11} className="text-accent" />
            </span>
            New: ClientFlow Desktop
            <ChevronRight size={14} className="text-brand-300" />
          </div>

          <h1 className="font-display text-foreground text-[2.5rem] leading-[1.1] font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Run ClientFlow{" "}
            <span className="bg-linear-to-r from-[hsl(207,85%,38%)] via-[hsl(195,80%,38%)] to-[hsl(170,76%,41%)] bg-clip-text text-transparent">
              outside the browser
            </span>
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-lg text-[15px] leading-relaxed md:text-base">
            A dedicated window for your daily client work. Stays out of the browser tab graveyard,
            opens to where you left off, and signs in with one click.
          </p>

          <div className="mt-8">
            <DesktopDownloadCard />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DesktopHero;
