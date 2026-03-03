import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  BarChart3,
  Target,
  BookOpen,
  Calendar,
  Settings,
  ListOrdered,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Zap,
  LineChart,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const [activeFeature, setActiveFeature] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    { id: "dashboard", icon: <LineChart className="w-5 h-5" />, label: "Dashboard", image: "Nuova operazione.png" },
    { id: "operations", icon: <ListOrdered className="w-5 h-5" />, label: "Operazioni", image: "Operazioni.png" },
    { id: "calendar", icon: <Calendar className="w-5 h-5" />, label: "Calendario", image: "Calendario.png" },
    { id: "stats", icon: <BarChart3 className="w-5 h-5" />, label: "Statistiche", image: "Statistiche.png" },
    { id: "diary", icon: <BookOpen className="w-5 h-5" />, label: "Diario", image: "Diario.png" },
    { id: "goals", icon: <Target className="w-5 h-5" />, label: "Obiettivi", image: "Obiettivi.png" },
    { id: "settings", icon: <Settings className="w-5 h-5" />, label: "Impostazioni", image: "Impostazioni.png" },
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-background/80 backdrop-blur-md border-b shadow-sm" : "bg-transparent"}`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">NoNameJournal</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Funzionalità</a>
            <a href="#details" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Come Funziona</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              className="rounded-full"
              data-testid="button-landing-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">Log In</Link>
            <Button asChild className="bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 transition-opacity border-0">
              <Link href="/register">Inizia Gratis <ChevronRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50 dark:opacity-30" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-chart-2/20 rounded-full blur-[100px] -z-10 opacity-50 dark:opacity-20" />

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              Tutto quello che volevi sapere sul tuo{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-chart-1 to-chart-2">
                trading...
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto font-medium">
              ...ma che i tuoi fogli di calcolo non ti hanno mai detto. Registra, analizza e scopri i pattern che portano al profitto.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button size="lg" asChild className="h-14 px-8 text-base bg-gradient-to-r from-primary to-chart-2 border-0 hover-elevate-2 w-full sm:w-auto">
                <Link href="/register">Inizia il tuo Journal <ArrowRight className="w-5 h-5 ml-2" /></Link>
              </Button>
            </div>

            {/* Dashboard Mockup Image */}
            <div className="relative mx-auto rounded-xl border bg-card/50 backdrop-blur-sm p-2 shadow-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-xl pointer-events-none" />
              <img
                key={activeFeature}
                src={`/landing/${features[activeFeature].image}`}
                alt={`NoNameJournal ${features[activeFeature].label} View`}
                className="w-full rounded-lg border shadow-sm object-contain object-top aspect-[16/10] bg-card animate-fade-in-up"
                style={{ animationDuration: "0.4s" }}
                onError={(e) => {
                  // Fallback to a styled div if image generation hasn't run/served yet
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.classList.add('min-h-[400px]', 'flex', 'items-center', 'justify-center');
                  e.currentTarget.parentElement!.innerHTML = '<div class="text-muted-foreground font-mono flex flex-col items-center gap-4"><div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"><LineChart class="w-8 h-8 text-primary" /></div><span>Dashboard Preview</span></div>';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Navigation Carousel */}
      <section id="features" className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8">Tutti gli strumenti di cui hai bisogno</p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 lg:gap-8 max-w-5xl mx-auto">
            {features.map((feature, idx) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(idx)}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200 min-w-[100px]
                  ${activeFeature === idx
                    ? "bg-background shadow-md border text-primary"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                  }`}
              >
                <div className={`p-3 rounded-full ${activeFeature === idx ? "bg-primary/10" : "bg-muted"}`}>
                  {feature.icon}
                </div>
                <span className="text-sm font-medium">{feature.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Numbered Detailed Sections */}
      <section id="details" className="py-24 space-y-32">
        {/* Section 1 */}
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-3">Registrazione Intelligente</h2>
            <h3 className="text-3xl md:text-5xl font-bold mb-6">Un <span className="text-chart-5/90">Journal Automatizzato</span> e Potente</h3>
            <p className="text-lg text-muted-foreground">
              Confluenze, tracking emotivo e setup personalizzati. Il form di inserimento rapido è progettato per la velocità e per catturare ogni sfumatura psicologica del tuo trade.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 bg-gradient-to-br from-card to-muted/50 border-muted-foreground/10 card-hover">
              <div className="w-12 h-12 rounded-lg bg-chart-1/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-chart-1" />
              </div>
              <h4 className="text-xl font-bold mb-2">Inserimento Rapido</h4>
              <p className="text-muted-foreground mb-6">Duplica i trade precedenti o sfrutta il sistema "Duplicate Last" per ridurre i tempi di inserimento del 80%.</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-muted/50 border-muted-foreground/10 card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-chart-3/5 rounded-bl-[100px] -z-10" />
              <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-6">
                <ListOrdered className="w-6 h-6 text-chart-3" />
              </div>
              <h4 className="text-xl font-bold mb-2">Analisi Confluenze</h4>
              <p className="text-muted-foreground mb-6">Traccia i fattori Pro e Contro per ogni operazione usando tag personalizzati.</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-card to-muted/50 border-muted-foreground/10 card-hover">
              <div className="w-12 h-12 rounded-lg bg-chart-5/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-chart-5" />
              </div>
              <h4 className="text-xl font-bold mb-2">Tracking Emotivo</h4>
              <p className="text-muted-foreground mb-6">Collega lo stato d'animo (FOMO, Rabbia, Fiducia) al risultato finanziario sul mercato.</p>
            </Card>
          </div>
        </div>

        {/* Section 2 */}
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-3">Analisi Operativa</h2>
            <h3 className="text-3xl md:text-5xl font-bold mb-6">Studia le tue <span className="text-chart-2/90">Statistiche</span></h3>
            <p className="text-lg text-muted-foreground">
              Scopri cosa funziona. Visualizza le dashboard con l'Equity Curve, la Win Rate, e la distribuzione dei setup per raffinare la tua Edge a mercato.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            <div className="order-2 md:order-1 rounded-2xl p-6 bg-gradient-to-tr from-chart-2/10 to-transparent border">
              <div className="space-y-4">
                <div className="h-40 rounded-lg bg-card border shadow-sm flex items-end p-4 gap-2">
                  <div className="w-1/6 bg-chart-2/20 h-[30%] rounded-t-sm" />
                  <div className="w-1/6 bg-chart-2/40 h-[45%] rounded-t-sm" />
                  <div className="w-1/6 bg-destructive/40 h-[20%] rounded-t-sm" />
                  <div className="w-1/6 bg-chart-2/60 h-[70%] rounded-t-sm" />
                  <div className="w-1/6 bg-chart-2/80 h-[85%] rounded-t-sm" />
                  <div className="w-1/6 bg-chart-2 h-[100%] rounded-t-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card border shadow-sm">
                    <div className="text-sm text-muted-foreground mb-1">Win Rate %</div>
                    <div className="text-2xl font-bold text-chart-2">68.5%</div>
                  </div>
                  <div className="p-4 rounded-lg bg-card border shadow-sm">
                    <div className="text-sm text-muted-foreground mb-1">Profit Factor</div>
                    <div className="text-2xl font-bold text-chart-1">2.14</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">1</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Metriche di Base e Avanzate</h4>
                  <p className="text-muted-foreground">Monitora P&L netto, numero di tick/pips, e il rapporto rischio/rendimento (R:R) realizzato vs pianificato.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">2</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Proiezione di Rovina (Risk of Ruin)</h4>
                  <p className="text-muted-foreground">Comprendi matematicamente la probabilità di azzerare il conto in base alle tue attuali performance.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">3</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Confronti Mensili</h4>
                  <p className="text-muted-foreground">Compara facilmente un mese con l'altro per notare trend positivi o negativi nel tempo.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-3">Sviluppo Personale</h2>
            <h3 className="text-3xl md:text-5xl font-bold mb-6">Migliora la tua <span className="text-chart-3/90">Psicologia</span></h3>
            <p className="text-lg text-muted-foreground">
              Il trading è 80% psicologia. Crea obiettivi misurabili e mantieni un diario personale indipendente dalle singole operazioni.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            <div className="space-y-6">
              <Card className="p-6 border-l-4 border-l-chart-3 hover:shadow-md transition-shadow">
                <h4 className="font-bold mb-2 flex items-center gap-2"><Target className="w-5 h-5 text-chart-3" /> Obiettivi Mensili</h4>
                <p className="text-sm text-muted-foreground">Fissa target di Win Rate, Profitto Netto e Numero di Operazioni all'inizio del mese. Tieni traccia del progresso verso l'obiettivo in tempo reale sulle dashboard.</p>
              </Card>
              <Card className="p-6 border-l-4 border-l-chart-4 hover:shadow-md transition-shadow">
                <h4 className="font-bold mb-2 flex items-center gap-2"><BookOpen className="w-5 h-5 text-chart-4" /> Diario Giornaliero</h4>
                <p className="text-sm text-muted-foreground">Non tutto si ricollega a un trade. Scrivi considerazioni generali sul mercato, riflessioni macroeconomiche o appunti psicologici ogni giorno.</p>
              </Card>
              <Card className="p-6 border-l-4 border-l-chart-1 hover:shadow-md transition-shadow">
                <h4 className="font-bold mb-2 flex items-center gap-2"><Calendar className="w-5 h-5 text-chart-1" /> Calendario Recap</h4>
                <p className="text-sm text-muted-foreground">Visualizza i tuoi trade su una vista a calendario. Identifica immediatamente i giorni verdi e quelli rossi, e leggi un recap statistico della settimana selezionata.</p>
              </Card>
            </div>

            <div className="rounded-2xl p-6 bg-gradient-to-tl from-chart-3/10 to-transparent border flex justify-center items-center overflow-hidden h-full min-h-[300px] relative">
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent z-10" />
              <div className="w-full space-y-4 transform rotate-[-5deg] scale-110 opacity-80">
                <div className="h-16 bg-card rounded-lg border shadow-sm p-3 flex justify-between items-center">
                  <span className="font-medium">12 Giugno</span><span className="text-chart-2 font-bold">+ $450.00</span>
                </div>
                <div className="h-16 bg-card rounded-lg border shadow-sm p-3 flex justify-between items-center">
                  <span className="font-medium">13 Giugno</span><span className="text-destructive font-bold">- $120.00</span>
                </div>
                <div className="h-16 bg-card rounded-lg border shadow-sm p-3 flex justify-between items-center">
                  <span className="font-medium">14 Giugno</span><span className="text-chart-2 font-bold">+ $890.00</span>
                </div>
                <div className="h-16 bg-card rounded-lg border shadow-sm p-3 flex justify-between items-center">
                  <span className="font-medium">15 Giugno</span><span className="text-chart-2 font-bold">+ $210.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 border-y" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full bg-gradient-to-r from-primary/10 to-chart-2/10 blur-[100px] -z-10" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Pronto a trasformare il tuo trading?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Unisciti ad altri trader e inizia a migliorare le tue performance partendo dai dati, non dalle sensazioni.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild className="h-14 px-8 text-base bg-foreground text-background hover:bg-foreground/90">
              <Link href="/register">Crea Account Gratuito</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-8 text-base">
              <Link href="/login">Accedi al Journal</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12 text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-semibold text-foreground">NoNameJournal</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Termini di Servizio</a>
              <a href="#" className="hover:text-foreground transition-colors">Contatti</a>
            </div>
          </div>
          <div className="mt-8 text-center md:text-left">
            <p>&copy; {new Date().getFullYear()} NoNameJournal. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
