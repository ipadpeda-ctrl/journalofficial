import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTheme } from "@/components/ThemeProvider";
import { useMutation } from "@tanstack/react-query";

interface OnboardingTourProps {
  onTabChange: (tab: any) => void;
}

export default function OnboardingTour({ onTabChange }: OnboardingTourProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  // Controlla se l'utente ha già completato il tutorial
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Il tutorial parte solo se l'utente è loggato e non l'ha ancora completato
    if (user && user.hasCompletedTutorial === false) {
      setRun(true);
    }
  }, [user]);

  // Modifica per aggiornare il DB
  const updateTutorialStatus = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/auth/user/tutorial", {
        hasCompletedTutorial: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const steps: Step[] = [
    {
      target: ".tutorial-step-new-entry",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2">Benvenuto nel tuo Trading Journal!</h3>
          <p>Inizia da qui. Usa questo form per registrare le tue operazioni a mercato. Inserisci i dettagli come il pair, l'esito, le confluenze e le tue emozioni per tracciare ogni aspetto del tuo trade.</p>
        </div>
      ),
      disableBeacon: true,
      placement: "bottom",
    },
    {
      target: ".tutorial-step-operations",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2">Il tuo Storico</h3>
          <p>Qui troverai la tabella completa di tutte le operazioni che hai registrato. Puoi filtrare i trade, modificarli o eliminarli se hai commesso degli errori.</p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: ".tutorial-step-calendario",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2">Il Calendario Trading</h3>
          <p>Visualizza a colpo d'occhio l'andamento delle tue giornate. I giorni in verde indicano profitti, quelli in rosso eventuali perdite. Clicca sui giorni per vedere i dettagli e controlla il recap settimanale di lato.</p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: ".tutorial-step-statistiche",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2">Analizza le tue Performance</h3>
          <p>La dashboard analitica: scopri la tua win-rate, il profitto totale, il Risk/Reward medio e analizza grafici dettagliati sull'andamento del tuo capitale nel tempo.</p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: ".tutorial-step-diary",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2">Il Diario di Trading</h3>
          <p>Non solo numeri: usa il diario per scrivere le tue considerazioni quotidiane, analizzare i tuoi errori di mindset o appuntare riflessioni che ti aiuteranno a migliorare la psicologia.</p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: ".tutorial-step-goals",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2">Fissa i tuoi Obiettivi Mensili</h3>
          <p>Ogni mese puoi impostare obiettivi quantitativi (es: numero di trade, win-rate target) e qualitativi (le regole disciplinari su cui vuoi concentrarti). La barra di progresso ti mostrerà a che punto sei.</p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: ".tutorial-step-settings",
      content: (
        <div>
          <h3 className="font-bold text-lg mb-2">Personalizza il tuo Spazio</h3>
          <p>Prima di iniziare davvero, fai un salto nelle impostazioni! Qui potrai modificare le coppie che tracci, aggiungere nuove confluenze personalizzate o impostare il tuo capitale iniziale.</p>
        </div>
      ),
      placement: "bottom",
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;

    // Quando chiudiamo, skippiamo o finiamo il tour
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      updateTutorialStatus.mutate();
    }

    // Navigazione automatica durante il tutorial per mostrare le varie schede
    if (type === "step:after" && action === "next") {
      const nextStepIndex = index + 1;
      if (nextStepIndex < steps.length) {
        const nextTarget = steps[nextStepIndex].target;
        if (typeof nextTarget === 'string') {
           const tabId = nextTarget.replace('.tutorial-step-', '');
           onTabChange(tabId);
        }
      }
    } else if (type === "step:after" && action === "prev") {
      const prevStepIndex = index - 1;
      if (prevStepIndex >= 0) {
        const prevTarget = steps[prevStepIndex].target;
        if (typeof prevTarget === 'string') {
           const tabId = prevTarget.replace('.tutorial-step-', '');
           onTabChange(tabId);
        }
      }
    }
  };

  // Se non siamo sicuri ci sia window
  if (!user || user.hasCompletedTutorial) return null;

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "hsl(var(--chart-1))", // Usa il colore primario dai token Tailwind
          textColor: theme === 'dark' ? "hsl(var(--foreground))" : "#333",
          backgroundColor: theme === 'dark' ? "hsl(var(--card))" : "#fff",
          arrowColor: theme === 'dark' ? "hsl(var(--card))" : "#fff",
          overlayColor: "rgba(0, 0, 0, 0.5)",
        },
        buttonClose: {
          display: "none",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--chart-1))",
          borderRadius: "var(--radius)",
          color: "white",
        },
        buttonBack: {
          color: theme === 'dark' ? "hsl(var(--muted-foreground))" : "#666",
        },
        buttonSkip: {
          color: theme === 'dark' ? "hsl(var(--muted-foreground))" : "#666",
        },
        tooltip: {
          borderRadius: "var(--radius)",
          padding: "20px",
          border: theme === 'dark' ? "1px solid hsl(var(--border))" : "none",
        },
      }}
      locale={{
        back: "Indietro",
        close: "Chiudi",
        last: "Finito",
        next: "Avanti",
        skip: "Salta Tutorial",
      }}
    />
  );
}
