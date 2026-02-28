import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Copy, Upload, Image as ImageIcon } from "lucide-react";
import ConfluenceTag from "./ConfluenceTag";
import { useAuth } from "@/hooks/useAuth";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface CustomUser {
  pairs?: string[] | null;
  emotions?: string[] | null;
  confluencesPro?: string[] | null;
  confluencesContro?: string[] | null;
  barrierOptions?: string[] | null;
}

// Default values as fallback if user has no custom settings
const DEFAULT_PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "XAUUSD", "GBPJPY", "EURJPY"];
const DEFAULT_EMOTIONS = ["Neutrale", "FOMO", "Rabbia", "Vendetta", "Speranza", "Fiducioso", "Impaziente", "Paura", "Sicuro", "Stress"];
const DEFAULT_CONFLUENCES_PRO = ["Trend forte", "Supporto testato", "Volume alto", "Pattern chiaro", "Livello chiave"];
const DEFAULT_CONFLUENCES_CONTRO = ["Notizie in arrivo", "Pattern debole", "Contro trend", "Bassa liquidità", "Orario sfavorevole"];
const DEFAULT_BARRIER_OPTIONS = ["m15", "m10", "m5", "m1"];
const FIXED_ALIGNED_TIMEFRAMES = ["Mensile", "Settimanale", "Daily", "H4", "H1", "M30"];

interface TradeFormProps {
  onSubmit?: (trade: TradeFormData) => void;
  onDuplicate?: () => void;
  editingTrade?: TradeFormData & { id?: string };
  onCancelEdit?: () => void;
}

export type TradeResult = "target" | "stop_loss" | "breakeven" | "parziale" | "non_fillato";

export interface TradeFormData {
  date: string;
  time: string;
  pair: string;
  direction: "long" | "short";
  target: string;
  stopLoss: string;
  slPips: string;
  tpPips: string;
  rr: string;
  result: TradeResult;
  emotion: string;
  confluencesPro: string[];
  confluencesContro: string[];
  alignedTimeframes: string[];
  barrier: string[];
  imageUrls: string[];
  notes: string;
}

export const tradeFormSchema = z.object({
  date: z.string().min(1, "Data richiesta"),
  time: z.string().min(1, "Ora richiesta"),
  pair: z.string().min(1, "Coppia richiesta"),
  direction: z.enum(["long", "short"]),
  target: z.string().min(1, "Target richiesto"),
  stopLoss: z.string().min(1, "Stop loss richiesto"),
  slPips: z.string().optional(),
  tpPips: z.string().optional(),
  rr: z.string().optional(),
  result: z.enum(["target", "stop_loss", "breakeven", "parziale", "non_fillato"]),
  emotion: z.string().optional(),
  confluencesPro: z.array(z.string()),
  confluencesContro: z.array(z.string()),
  alignedTimeframes: z.array(z.string()),
  barrier: z.array(z.string()),
  imageUrls: z.array(z.string()),
  notes: z.string().optional(),
});

export default function TradeForm({ onSubmit, onDuplicate, editingTrade, onCancelEdit }: TradeFormProps) {
  const { user } = useAuth();

  const customUser = user as CustomUser | null;


  const pairs = customUser?.pairs?.length ? customUser.pairs : DEFAULT_PAIRS;
  const emotions = customUser?.emotions?.length ? customUser.emotions : DEFAULT_EMOTIONS;
  const availableConfluencesPro = customUser?.confluencesPro?.length ? customUser.confluencesPro : DEFAULT_CONFLUENCES_PRO;
  const availableConfluencesContro = customUser?.confluencesContro?.length ? customUser.confluencesContro : DEFAULT_CONFLUENCES_CONTRO;
  const availableBarrierOptions = customUser?.barrierOptions?.length ? customUser.barrierOptions : DEFAULT_BARRIER_OPTIONS;

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: editingTrade ? {
      date: editingTrade.date,
      time: editingTrade.time,
      pair: editingTrade.pair,
      direction: editingTrade.direction,
      target: editingTrade.target,
      stopLoss: editingTrade.stopLoss,
      slPips: editingTrade.slPips || "",
      tpPips: editingTrade.tpPips || "",
      rr: editingTrade.rr || "",
      result: editingTrade.result,
      emotion: editingTrade.emotion || "Neutrale",
      confluencesPro: editingTrade.confluencesPro || [],
      confluencesContro: editingTrade.confluencesContro || [],
      alignedTimeframes: editingTrade.alignedTimeframes || [],
      barrier: editingTrade.barrier || [],
      imageUrls: editingTrade.imageUrls || [],
      notes: editingTrade.notes || "",
    } : {
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      pair: "",
      direction: "long",
      target: "",
      stopLoss: "1.00",
      slPips: "",
      tpPips: "",
      rr: "",
      result: "target",
      emotion: "Neutrale",
      confluencesPro: [],
      confluencesContro: [],
      alignedTimeframes: [],
      barrier: [],
      imageUrls: [],
      notes: "",
    }
  });

  const { getValues, setValue, watch, handleSubmit: hookFormSubmit, control } = form;

  const currentSlPips = watch("slPips");
  const currentTpPips = watch("tpPips");
  const currentRisk = watch("stopLoss");
  const currentRr = watch("rr");
  const confluencesPro = watch("confluencesPro");
  const confluencesContro = watch("confluencesContro");
  const alignedTimeframes = watch("alignedTimeframes");
  const barrier = watch("barrier");
  const imageUrls = watch("imageUrls");
  const direction = watch("direction");
  const resultVal = watch("result");

  useEffect(() => {
    if (editingTrade) {
      form.reset({
        ...editingTrade,
        slPips: editingTrade.slPips || "",
        tpPips: editingTrade.tpPips || "",
        rr: editingTrade.rr || "",
        emotion: editingTrade.emotion || "Neutrale",
        confluencesPro: editingTrade.confluencesPro || [],
        confluencesContro: editingTrade.confluencesContro || [],
        alignedTimeframes: editingTrade.alignedTimeframes || [],
        barrier: editingTrade.barrier || [],
        imageUrls: editingTrade.imageUrls || [],
        notes: editingTrade.notes || "",
      });
    } else {
      form.reset({
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        pair: "",
        direction: "long",
        target: "",
        stopLoss: "1.00",
        slPips: "",
        tpPips: "",
        rr: "",
        result: "target",
        emotion: "Neutrale",
        confluencesPro: [],
        confluencesContro: [],
        alignedTimeframes: [],
        barrier: [],
        imageUrls: [],
        notes: "",
      });
    }
  }, [editingTrade?.id, form]);

  const calculateRR = (sl: string, tp: string): number => {
    const slVal = parseFloat(sl);
    const tpVal = parseFloat(tp);
    if (slVal > 0 && tpVal > 0) return tpVal / slVal;
    return 0;
  };

  const syncTargetAndRR = (slStr: string, tpStr: string, riskStr: string) => {
    const rrValue = calculateRR(slStr, tpStr);
    const riskValue = parseFloat(riskStr) || 0;

    if (rrValue > 0) {
      setValue("rr", rrValue.toFixed(2));
      if (riskValue > 0) {
        setValue("target", (rrValue * riskValue).toFixed(2));
      } else {
        setValue("target", ""); // Clear target if risk is 0 or invalid
      }
    } else {
      setValue("rr", "");
      setValue("target", ""); // Clear target if RR is 0 or invalid
    }
  };

  const handleSlPipsChange = (value: string) => {
    setValue("slPips", value);
    syncTargetAndRR(value, currentTpPips, currentRisk);
  };

  const handleTpPipsChange = (value: string) => {
    setValue("tpPips", value);
    syncTargetAndRR(currentSlPips, value, currentRisk);
  };

  const handleRiskChange = (value: string) => {
    setValue("stopLoss", value);
    const riskValue = parseFloat(value);
    const rrValue = parseFloat(currentRr);

    if (!isNaN(riskValue) && !isNaN(rrValue) && rrValue > 0) {
      setValue("target", (rrValue * riskValue).toFixed(2));
    } else {
      setValue("target", ""); // Clear target if risk or RR is invalid
    }
  };

  const [newProTag, setNewProTag] = useState("");
  const [newControTag, setNewControTag] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  const addImageUrl = (url: string) => {
    if (!url.trim()) return;
    const currentList = getValues("imageUrls");
    if (!currentList.includes(url)) {
      setValue("imageUrls", [...currentList, url]);
    }
    setNewImageUrl("");
  };

  const removeImageUrl = (url: string) => {
    setValue("imageUrls", getValues("imageUrls").filter((u) => u !== url));
  };

  const handleValidSubmit = (data: TradeFormData) => {
    onSubmit?.(data);
  };

  const addConfluence = (type: "pro" | "contro", value: string) => {
    if (!value.trim()) return;
    const key = type === "pro" ? "confluencesPro" : "confluencesContro";
    const currentList = getValues(key);
    if (!currentList.includes(value)) {
      setValue(key, [...currentList, value]);
    }
    if (type === "pro") setNewProTag("");
    else setNewControTag("");
  };

  const removeConfluence = (type: "pro" | "contro", value: string) => {
    const key = type === "pro" ? "confluencesPro" : "confluencesContro";
    setValue(key, getValues(key).filter((c) => c !== value));
  };

  const toggleAlignedTimeframe = (tf: string) => {
    const current = getValues("alignedTimeframes");
    if (current.includes(tf)) {
      setValue("alignedTimeframes", current.filter((item) => item !== tf));
    } else {
      setValue("alignedTimeframes", [...current, tf]);
    }
  };

  const toggleBarrier = (b: string) => {
    const current = getValues("barrier");
    if (current.includes(b)) {
      setValue("barrier", current.filter((item) => item !== b));
    } else {
      setValue("barrier", [...current, b]);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={hookFormSubmit(handleValidSubmit)} className="space-y-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-medium">{editingTrade ? "Modifica Operazione" : "Nuova Operazione"}</h2>
          {!editingTrade && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              data-testid="button-duplicate-trade"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplica Ultima
            </Button>
          )}
        </div>

        {/* SECTION 1: GENERAL INFO (Manual) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date")}
              data-testid="input-date"
            />
            {form.formState.errors.date && <span className="text-xs text-red-500">{form.formState.errors.date.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Ora</Label>
            <Input
              id="time"
              type="time"
              {...form.register("time")}
              data-testid="input-time"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pair">Coppia</Label>
            <Controller
              name="pair"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="pair" data-testid="select-pair">
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    {pairs.map((pair: string) => (
                      <SelectItem key={pair} value={pair}>
                        {pair}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.pair && <span className="text-xs text-red-500">{form.formState.errors.pair.message}</span>}
          </div>

          <div className="space-y-2">
            <Label>Direzione</Label>
            <div className="flex gap-1">
              <Button
                type="button"
                variant={direction === "long" ? "default" : "outline"}
                size="sm"
                className={`flex-1 transition-all duration-200 active:scale-95 ${direction === "long" ? "bg-emerald-600 hover:bg-emerald-700 shadow-md ring-2 ring-emerald-500/20" : ""}`}
                onClick={() => setValue("direction", "long")}
                data-testid="button-direction-long"
              >
                Long
              </Button>
              <Button
                type="button"
                variant={direction === "short" ? "default" : "outline"}
                size="sm"
                className={`flex-1 transition-all duration-200 active:scale-95 ${direction === "short" ? "bg-red-600 hover:bg-red-700 shadow-md ring-2 ring-red-500/20" : ""}`}
                onClick={() => setValue("direction", "short")}
                data-testid="button-direction-short"
              >
                Short
              </Button>
            </div>
          </div>
        </div>

        {/* SECTION 2: TECHNICAL PARAMETERS */}
        <div className="p-4 bg-muted/20 rounded-lg border border-border/50 flex flex-col gap-4">
          {/* Row A: Manual Inputs (Risk, Pips) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stopLoss">Rischio (€/$)</Label>
              <Input
                id="stopLoss"
                type="number"
                step="0.01"
                placeholder="1.00"
                value={currentRisk}
                onChange={(e) => handleRiskChange(e.target.value)}
                className={`font-mono bg-background focus-visible:ring-1 transition-shadow ${direction === "long" ? "focus-visible:ring-emerald-500" : "focus-visible:ring-red-500"
                  }`}
                data-testid="input-stop-loss"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slPips" className="text-xs uppercase text-muted-foreground">SL (pips)</Label>
              <Input
                id="slPips"
                type="number"
                step="0.1"
                placeholder="es. 10"
                value={currentSlPips}
                onChange={(e) => handleSlPipsChange(e.target.value)}
                className={`font-mono bg-background focus-visible:ring-1 transition-shadow ${direction === "long" ? "focus-visible:ring-emerald-500" : "focus-visible:ring-red-500"
                  }`}
                data-testid="input-sl-pips"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tpPips" className="text-xs uppercase text-muted-foreground">TP (pips)</Label>
              <Input
                id="tpPips"
                type="number"
                step="0.1"
                placeholder="es. 30"
                value={currentTpPips}
                onChange={(e) => handleTpPipsChange(e.target.value)}
                className={`font-mono bg-background focus-visible:ring-1 transition-shadow ${direction === "long" ? "focus-visible:ring-emerald-500" : "focus-visible:ring-red-500"
                  }`}
                data-testid="input-tp-pips"
              />
            </div>
          </div>

          <div className="border-t border-border/50 w-full my-1"></div>

          {/* Row B: Automated Outputs (Target, RR) - VISUALLY SEPARATED */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target" className="text-emerald-600 font-medium transition-colors">Target (Auto)</Label>
              <Input
                id="target"
                type="number"
                step="0.01"
                placeholder="Auto"
                {...form.register("target")}
                className={`font-mono transition-all duration-500 ease-out bg-muted/50 ${Number(form.watch("target")) > 0
                  ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  : "border-emerald-500/30"
                  }`}
                data-testid="input-target"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rr" className="text-blue-500 font-medium transition-colors">RR Matematico</Label>
              <Input
                id="rr"
                type="number"
                readOnly
                {...form.register("rr")}
                className={`font-mono transition-all duration-500 ease-out bg-muted/50 text-muted-foreground ${Number(form.watch("rr")) >= 2
                  ? "border-blue-500 bg-blue-500/10 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                  : "border-blue-500/30"
                  }`}
                data-testid="input-rr"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: RESULT & EMOTION */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2 col-span-2 md:col-span-2">
            <Label>Risultato</Label>
            <div className="flex gap-1">
              {(["target", "stop_loss", "breakeven"] as const).map((result) => (
                <Button
                  key={result}
                  type="button"
                  variant={resultVal === result ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 transition-all duration-200 active:scale-95 ${resultVal === result
                    ? result === "target"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-md text-white"
                      : result === "stop_loss"
                        ? "bg-red-600 hover:bg-red-700 shadow-md text-white"
                        : "bg-yellow-600 hover:bg-yellow-700 shadow-md text-white"
                    : "hover:bg-muted"
                    }`}
                  onClick={() => setValue("result", result)}
                  data-testid={`button-result-${result}`}
                >
                  {result === "target" ? "Target" : result === "stop_loss" ? "Stop" : "BE"}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="emotion">Emozione</Label>
            <Controller
              name="emotion"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="emotion" data-testid="select-emotion">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {emotions.map((emotion: string) => (
                      <SelectItem key={emotion} value={emotion}>
                        {emotion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-emerald-500 font-semibold text-sm">Confluenze PRO</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableConfluencesPro.map((tag: string) => {
                const isSelected = confluencesPro.includes(tag);
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 active:scale-95 px-3 py-1 ${isSelected
                      ? "bg-emerald-500 hover:bg-emerald-600 shadow-sm"
                      : "hover:border-emerald-500/50 hover:bg-emerald-500/10 text-muted-foreground"
                      }`}
                    onClick={() => isSelected ? removeConfluence("pro", tag) : addConfluence("pro", tag)}
                  >
                    {tag}
                  </Badge>
                );
              })}
              {/* Render custom tags that are not in the default/available list */}
              {confluencesPro.filter((tag) => !availableConfluencesPro.includes(tag)).map((tag) => (
                <ConfluenceTag
                  key={tag}
                  label={tag}
                  type="pro"
                  onRemove={() => removeConfluence("pro", tag)}
                />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <Plus className="w-4 h-4 text-muted-foreground mr-1" />
              <Input
                placeholder="Custom..."
                value={newProTag}
                onChange={(e) => setNewProTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence("pro", newProTag))}
                className="w-28"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addConfluence("pro", newProTag)}
              >
                Aggiungi Custom
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-red-500 font-semibold text-sm">Confluenze CONTRO</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {availableConfluencesContro.map((tag: string) => {
              const isSelected = confluencesContro.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-200 active:scale-95 px-3 py-1 ${isSelected
                    ? "bg-red-500 hover:bg-red-600 shadow-sm"
                    : "hover:border-red-500/50 hover:bg-red-500/10 text-muted-foreground"
                    }`}
                  onClick={() => isSelected ? removeConfluence("contro", tag) : addConfluence("contro", tag)}
                >
                  {tag}
                </Badge>
              );
            })}
            {/* Render custom tags that are not in the default/available list */}
            {confluencesContro.filter((tag) => !availableConfluencesContro.includes(tag)).map((tag) => (
              <ConfluenceTag
                key={tag}
                label={tag}
                type="contro"
                onRemove={() => removeConfluence("contro", tag)}
              />
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <Plus className="w-4 h-4 text-muted-foreground mr-1" />
            <Input
              placeholder="Custom..."
              value={newControTag}
              onChange={(e) => setNewControTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence("contro", newControTag))}
              className="w-28"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addConfluence("contro", newControTag)}
            >
              Aggiungi Custom
            </Button>
          </div>
        </div>

        {/* ALIGNED TIMEFRAMES & BARRIER */}
        <div className="grid md:grid-cols-2 gap-6 bg-muted/10 p-4 rounded-lg border border-border/40">
          <div className="space-y-3">
            <Label className="text-primary font-semibold text-sm">TF. Allineati (Macro)</Label>
            <div className="flex flex-wrap gap-2">
              {FIXED_ALIGNED_TIMEFRAMES.map((tf) => {
                const isSelected = alignedTimeframes.includes(tf);
                return (
                  <Badge
                    key={tf}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 active:scale-95 px-3 py-1 ${isSelected
                      ? "bg-primary hover:bg-primary/90 shadow-sm"
                      : "hover:bg-primary/10 text-muted-foreground"
                      }`}
                    onClick={() => toggleAlignedTimeframe(tf)}
                  >
                    {tf}
                  </Badge>
                );
              })}
            </div>
            <p className="text-xs text-white/90 font-medium mt-2">
              Seleziona i timeframe maggiori orientati nella direzione del tuo trade ({direction}).
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-blue-500 font-semibold text-sm">Barrier (Microstrutture confermate)</Label>
            <div className="flex flex-wrap gap-2">
              {availableBarrierOptions.map((b: string) => {
                const isSelected = barrier.includes(b);
                return (
                  <Badge
                    key={b}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 active:scale-95 px-3 py-1 ${isSelected
                      ? "bg-blue-600 hover:bg-blue-700 shadow-sm text-white"
                      : "hover:bg-blue-500/10 hover:border-blue-500/30 text-muted-foreground"
                      }`}
                    onClick={() => toggleBarrier(b)}
                  >
                    {b}
                  </Badge>
                );
              })}
            </div>
            <p className="text-xs text-white/90 font-medium mt-2">
              Quali micro-strutture hanno confermato l'ingresso a mercato?
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="notes">Note</Label>
          <Textarea
            id="notes"
            placeholder="Analisi pre e post trade..."
            {...form.register("notes")}
            className="resize-none"
            rows={2}
          />
        </div>

        <div className="space-y-3">
          <Label>Screenshot / Immagini</Label>
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 hover:border-primary/50 transition-colors group relative"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Simplified drop handler: we just expect an image URL to be dropped or typed
              const url = e.dataTransfer.getData('text');
              if (url) addImageUrl(url);
            }}
          >
            <div className="bg-muted p-3 rounded-full group-hover:bg-primary/10 transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Trascina qui l'URL dell'immagine</p>
              <p className="text-xs text-muted-foreground mt-1">oppure incollalo nel campo sottostante</p>
            </div>
            <div className="flex gap-2 w-full mt-2 max-w-sm relative z-10">
              <Input
                placeholder="https://..."
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl(newImageUrl))}
                className="flex-1 bg-background"
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={() => addImageUrl(newImageUrl)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {imageUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative group w-32 h-20 rounded-md overflow-hidden border shadow-sm transition-transform hover:scale-105"
                >
                  <img
                    src={url}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='80' viewBox='0 0 128 80'%3E%3Crect fill='%23f1f5f9' width='128' height='80'/%3E%3Ctext fill='%2394a3b8' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='12' font-family='sans-serif'%3ENo Preview%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="w-6 h-6 rounded-full shadow-lg"
                      onClick={() => removeImageUrl(url)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          {editingTrade && (
            <Button type="button" variant="outline" onClick={onCancelEdit}>
              Annulla
            </Button>
          )}
          <Button type="submit" className="min-w-32 shadow-md">
            {editingTrade ? "Salva Modifiche" : "Salva Operazione"}
          </Button>
        </div>
      </form >
    </Card >
  );
}