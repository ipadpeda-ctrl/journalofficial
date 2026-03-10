import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Save, Wallet, Loader2, Pencil, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChangePassword from "@/components/ChangePassword";
import StrategyManager from "@/components/StrategyManager";

interface SettingsProps {
  pairs: string[];
  emotions: string[];
  confluencesPro: string[];
  confluencesContro: string[];
  barrierOptions?: string[];
  isBarrierEnabled?: boolean;
  initialCapital?: number;
  onSave?: (settings: SettingsData) => void;
}

export interface SettingsData {
  pairs: string[];
  emotions: string[];
  confluencesPro: string[];
  confluencesContro: string[];
  barrierOptions?: string[];
  isBarrierEnabled?: boolean;
}

export default function Settings({
  pairs: initialPairs,
  emotions: initialEmotions,
  confluencesPro: initialConfluencesPro,
  confluencesContro: initialConfluencesContro,
  barrierOptions: initialBarrierOptions = ["m15", "m10", "m5", "m1"],
  isBarrierEnabled: initialIsBarrierEnabled = true,
  initialCapital = 10000,
  onSave,
}: SettingsProps) {
  const { toast } = useToast();
  const [pairs, setPairs] = useState(initialPairs);
  const [emotions, setEmotions] = useState(initialEmotions);
  const [confluencesPro, setConfluencesPro] = useState(initialConfluencesPro);
  const [confluencesContro, setConfluencesContro] = useState(initialConfluencesContro);
  const [barrierOptions, setBarrierOptions] = useState(initialBarrierOptions);
  const [isBarrierEnabled, setIsBarrierEnabled] = useState(initialIsBarrierEnabled);
  const [capital, setCapital] = useState(initialCapital);

  useEffect(() => {
    setCapital(initialCapital);
  }, [initialCapital]);

  // Aggiorna lo stato locale quando cambiano le props (es. caricamento iniziale)
  useEffect(() => {
    setPairs(initialPairs);
    setEmotions(initialEmotions);
    setConfluencesPro(initialConfluencesPro);
    setConfluencesContro(initialConfluencesContro);
    setBarrierOptions(initialBarrierOptions);
    setIsBarrierEnabled(initialIsBarrierEnabled);
  }, [initialPairs, initialEmotions, initialConfluencesPro, initialConfluencesContro, initialBarrierOptions, initialIsBarrierEnabled]);

  const [newPair, setNewPair] = useState("");
  const [newEmotion, setNewEmotion] = useState("");
  const [newProConfluence, setNewProConfluence] = useState("");
  const [newControConfluence, setNewControConfluence] = useState("");
  const [newBarrier, setNewBarrier] = useState("");

  const [editingConfluence, setEditingConfluence] = useState<{ type: "pro" | "contro", index: number } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const updateCapitalMutation = useMutation({
    mutationFn: async (newCapital: number) => {
      const res = await apiRequest("PATCH", "/api/auth/user/capital", { initialCapital: newCapital });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Capitale iniziale salvato" });
    },
    onError: () => {
      toast({ title: "Errore nel salvare il capitale", variant: "destructive" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsData) => {
      // Assumiamo che ci sia un endpoint generico per aggiornare l'utente o le impostazioni
      // Se il backend si aspetta campi specifici nel body, qui li stiamo passando tutti.
      const res = await apiRequest("PATCH", "/api/auth/user", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Impostazioni salvate con successo" });
    },
    onError: () => {
      toast({ title: "Errore nel salvare le impostazioni", variant: "destructive" });
    },
  });

  const addItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    clearInput: () => void
  ) => {
    const trimmed = value.trim();
    if (trimmed) {
      setter((prev) => {
        if (prev.includes(trimmed)) return prev; // Evita duplicati
        return [...prev, trimmed];
      });
      clearInput();
    }
  };

  const removeItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter((prev) => prev.filter((item) => item !== value));
  };

  const saveEdit = () => {
    if (!editingConfluence || !editingValue.trim()) return;

    if (editingConfluence.type === "pro") {
      setConfluencesPro((prev) => {
        const next = [...prev];
        next[editingConfluence.index] = editingValue.trim();
        return next;
      });
    } else {
      setConfluencesContro((prev) => {
        const next = [...prev];
        next[editingConfluence.index] = editingValue.trim();
        return next;
      });
    }
    setEditingConfluence(null);
  };

  const handleSave = () => {
    const settingsData = { pairs, emotions, confluencesPro, confluencesContro, barrierOptions, isBarrierEnabled };
    // Salvataggio tramite API
    updateSettingsMutation.mutate(settingsData);
    // Callback opzionale per il genitore
    onSave?.(settingsData);
    console.log("Settings saved:", settingsData);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-medium">Capitale Iniziale</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Inserisci il tuo capitale iniziale. Questo valore sarà usato per calcolare statistiche, proiezioni e grafici.
        </p>
        <div className="flex gap-2 items-end">
          <div className="flex-1 max-w-xs">
            <Label htmlFor="initial-capital">Capitale (EUR)</Label>
            <Input
              id="initial-capital"
              type="number"
              min={0}
              step={100}
              value={capital}
              onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
              data-testid="input-initial-capital"
            />
          </div>
          <Button
            onClick={() => updateCapitalMutation.mutate(capital)}
            disabled={updateCapitalMutation.isPending}
            data-testid="button-save-capital"
          >
            {updateCapitalMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salva
          </Button>
        </div>
      </Card>

      <ChangePassword />

      <StrategyManager />

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-medium">Parametri Globali (Default)</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Questi parametri vengono usati quando non selezioni una strategia specifica nella nuova operazione.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Coppie di Trading</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {pairs.map((pair) => (
            <Badge key={pair} variant="secondary" className="gap-1" data-testid={`badge-pair-${pair}`}>
              {pair}
              <button onClick={() => removeItem(setPairs, pair)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nuova coppia (es. EURJPY)"
            value={newPair}
            onChange={(e) => setNewPair(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && addItem(setPairs, newPair, () => setNewPair(""))}
            className="max-w-xs"
            data-testid="input-new-pair"
          />
          <Button
            variant="outline"
            onClick={() => addItem(setPairs, newPair, () => setNewPair(""))}
            data-testid="button-add-pair"
          >
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Emozioni</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {emotions.map((emotion) => (
            <Badge key={emotion} variant="secondary" className="gap-1" data-testid={`badge-emotion-${emotion}`}>
              {emotion}
              <button onClick={() => removeItem(setEmotions, emotion)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nuova emozione"
            value={newEmotion}
            onChange={(e) => setNewEmotion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem(setEmotions, newEmotion, () => setNewEmotion(""))}
            className="max-w-xs"
            data-testid="input-new-emotion"
          />
          <Button
            variant="outline"
            onClick={() => addItem(setEmotions, newEmotion, () => setNewEmotion(""))}
            data-testid="button-add-emotion"
          >
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi
          </Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Confluenze PRO</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {confluencesPro.map((conf, idx) => (
              editingConfluence?.type === "pro" && editingConfluence.index === idx ? (
                <div key={idx} className="flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 rounded-full px-2 py-0.5">
                  <input
                    autoFocus
                    className="bg-transparent border-none outline-none text-xs text-emerald-400 w-24"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") setEditingConfluence(null);
                    }}
                  />
                  <button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-400">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEditingConfluence(null)} className="text-emerald-500 hover:text-emerald-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <Badge
                  key={conf}
                  variant="secondary"
                  className="gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 group"
                  data-testid={`badge-pro-${conf}`}
                >
                  {conf}
                  <button
                    onClick={() => {
                      setEditingConfluence({ type: "pro", index: idx });
                      setEditingValue(conf);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-70 ml-1 text-emerald-500"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeItem(setConfluencesPro, conf)} className="hover:opacity-70 text-emerald-500">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nuova confluenza PRO"
              value={newProConfluence}
              onChange={(e) => setNewProConfluence(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && addItem(setConfluencesPro, newProConfluence, () => setNewProConfluence(""))
              }
              className="flex-1"
              data-testid="input-new-pro-confluence"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => addItem(setConfluencesPro, newProConfluence, () => setNewProConfluence(""))}
              data-testid="button-add-pro-confluence"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Confluenze CONTRO</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {confluencesContro.map((conf, idx) => (
              editingConfluence?.type === "contro" && editingConfluence.index === idx ? (
                <div key={idx} className="flex items-center gap-1 border border-red-500/30 bg-red-500/10 rounded-full px-2 py-0.5">
                  <input
                    autoFocus
                    className="bg-transparent border-none outline-none text-xs text-red-400 w-24"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit();
                      if (e.key === "Escape") setEditingConfluence(null);
                    }}
                  />
                  <button onClick={saveEdit} className="text-red-500 hover:text-red-400">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEditingConfluence(null)} className="text-red-500 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <Badge
                  key={conf}
                  variant="secondary"
                  className="gap-1 bg-red-500/20 text-red-400 border-red-500/30 group"
                  data-testid={`badge-contro-${conf}`}
                >
                  {conf}
                  <button
                    onClick={() => {
                      setEditingConfluence({ type: "contro", index: idx });
                      setEditingValue(conf);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-70 ml-1 text-red-500"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeItem(setConfluencesContro, conf)} className="hover:opacity-70 text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nuova confluenza CONTRO"
              value={newControConfluence}
              onChange={(e) => setNewControConfluence(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && addItem(setConfluencesContro, newControConfluence, () => setNewControConfluence(""))
              }
              className="flex-1"
              data-testid="input-new-contro-confluence"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => addItem(setConfluencesContro, newControConfluence, () => setNewControConfluence(""))}
              data-testid="button-add-contro-confluence"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Barrier (Microstrutture/Conferme)</h2>
          <div className="flex items-center gap-2">
            <Label htmlFor="barrier-toggle" className="text-sm text-muted-foreground mr-2">Abilita barrier nei trade form</Label>
            <Switch
              id="barrier-toggle"
              checked={isBarrierEnabled}
              onCheckedChange={setIsBarrierEnabled}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Aggiungi le conferme di time-frame inferiori che cerchi per convalidare il setup (es. m5, m15).
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {barrierOptions.map((barrier) => (
            <Badge key={barrier} variant="secondary" className="gap-1 border-primary/20 bg-primary/10 text-primary">
              {barrier}
              <button onClick={() => removeItem(setBarrierOptions, barrier)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nuovo barrier (es. m3)"
            value={newBarrier}
            onChange={(e) => setNewBarrier(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem(setBarrierOptions, newBarrier, () => setNewBarrier(""))}
            className="max-w-xs"
          />
          <Button
            variant="outline"
            onClick={() => addItem(setBarrierOptions, newBarrier, () => setNewBarrier(""))}
          >
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi
          </Button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateSettingsMutation.isPending}
          data-testid="button-save-settings"
        >
          {updateSettingsMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salva Impostazioni
        </Button>
      </div>
    </div>
  );
}