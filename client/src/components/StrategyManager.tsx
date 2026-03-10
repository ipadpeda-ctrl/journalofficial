import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Plus, X, Save, Pencil, Trash2, Loader2, Check, ChevronDown, ChevronUp, Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Strategy {
    id: number;
    userId: string;
    name: string;
    pairs: string[] | null;
    confluencesPro: string[] | null;
    confluencesContro: string[] | null;
    barrierOptions: string[] | null;
    isBarrierEnabled: boolean | null;
    createdAt: string;
    updatedAt: string;
}

interface StrategyFormState {
    name: string;
    pairs: string[];
    confluencesPro: string[];
    confluencesContro: string[];
    barrierOptions: string[];
    isBarrierEnabled: boolean;
}

const emptyForm: StrategyFormState = {
    name: "",
    pairs: [],
    confluencesPro: [],
    confluencesContro: [],
    barrierOptions: [],
    isBarrierEnabled: true,
};

function StrategyEditCard({
    strategy,
    isNew,
    onCancel,
}: {
    strategy?: Strategy;
    isNew: boolean;
    onCancel: () => void;
}) {
    const { toast } = useToast();
    const [form, setForm] = useState<StrategyFormState>(
        strategy
            ? {
                name: strategy.name,
                pairs: strategy.pairs || [],
                confluencesPro: strategy.confluencesPro || [],
                confluencesContro: strategy.confluencesContro || [],
                barrierOptions: strategy.barrierOptions || [],
                isBarrierEnabled: strategy.isBarrierEnabled ?? true,
            }
            : { ...emptyForm }
    );

    const [newPair, setNewPair] = useState("");
    const [newPro, setNewPro] = useState("");
    const [newContro, setNewContro] = useState("");
    const [newBarrier, setNewBarrier] = useState("");

    const createMutation = useMutation({
        mutationFn: async (data: StrategyFormState) => {
            const res = await apiRequest("POST", "/api/strategies", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
            toast({ title: "Strategia creata con successo" });
            onCancel();
        },
        onError: () => {
            toast({ title: "Errore nella creazione della strategia", variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: StrategyFormState) => {
            const res = await apiRequest("PATCH", `/api/strategies/${strategy!.id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
            toast({ title: "Strategia aggiornata con successo" });
            onCancel();
        },
        onError: () => {
            toast({ title: "Errore nell'aggiornamento della strategia", variant: "destructive" });
        },
    });

    const isPending = createMutation.isPending || updateMutation.isPending;

    const addItem = (key: keyof StrategyFormState, value: string, clear: () => void) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        const current = form[key] as string[];
        if (current.includes(trimmed)) return;
        setForm({ ...form, [key]: [...current, trimmed] });
        clear();
    };

    const removeItem = (key: keyof StrategyFormState, value: string) => {
        const current = form[key] as string[];
        setForm({ ...form, [key]: current.filter((v) => v !== value) });
    };

    const handleSave = () => {
        if (!form.name.trim()) {
            toast({ title: "Nome strategia richiesto", variant: "destructive" });
            return;
        }
        if (isNew) {
            createMutation.mutate(form);
        } else {
            updateMutation.mutate(form);
        }
    };

    return (
        <Card className="p-5 border-primary/30 bg-primary/5">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="strategy-name">Nome Strategia</Label>
                    <Input
                        id="strategy-name"
                        placeholder="Es. SMC Intraday"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="max-w-sm mt-1"
                        data-testid="input-strategy-name"
                    />
                </div>

                {/* Pairs */}
                <div>
                    <Label className="text-sm font-medium">Coppie di Trading</Label>
                    <div className="flex flex-wrap gap-1.5 my-2">
                        {form.pairs.map((p) => (
                            <Badge key={p} variant="secondary" className="gap-1 text-xs">
                                {p}
                                <button onClick={() => removeItem("pairs", p)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Nuova coppia"
                            value={newPair}
                            onChange={(e) => setNewPair(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && addItem("pairs", newPair, () => setNewPair(""))}
                            className="max-w-[200px]"
                        />
                        <Button size="icon" variant="outline" onClick={() => addItem("pairs", newPair, () => setNewPair(""))}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Confluences PRO */}
                <div>
                    <Label className="text-sm font-medium text-emerald-500">Confluenze PRO</Label>
                    <div className="flex flex-wrap gap-1.5 my-2">
                        {form.confluencesPro.map((c) => (
                            <Badge key={c} variant="secondary" className="gap-1 text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                {c}
                                <button onClick={() => removeItem("confluencesPro", c)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Nuova confluenza PRO"
                            value={newPro}
                            onChange={(e) => setNewPro(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addItem("confluencesPro", newPro, () => setNewPro(""))}
                            className="flex-1"
                        />
                        <Button size="icon" variant="outline" onClick={() => addItem("confluencesPro", newPro, () => setNewPro(""))}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Confluences CONTRO */}
                <div>
                    <Label className="text-sm font-medium text-red-500">Confluenze CONTRO</Label>
                    <div className="flex flex-wrap gap-1.5 my-2">
                        {form.confluencesContro.map((c) => (
                            <Badge key={c} variant="secondary" className="gap-1 text-xs bg-red-500/20 text-red-400 border-red-500/30">
                                {c}
                                <button onClick={() => removeItem("confluencesContro", c)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Nuova confluenza CONTRO"
                            value={newContro}
                            onChange={(e) => setNewContro(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addItem("confluencesContro", newContro, () => setNewContro(""))}
                            className="flex-1"
                        />
                        <Button size="icon" variant="outline" onClick={() => addItem("confluencesContro", newContro, () => setNewContro(""))}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Barrier */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Barrier (Microstrutture)</Label>
                        <div className="flex items-center gap-2">
                            <Label htmlFor={`barrier-toggle-${strategy?.id || "new"}`} className="text-xs text-muted-foreground">Abilita</Label>
                            <Switch
                                id={`barrier-toggle-${strategy?.id || "new"}`}
                                checked={form.isBarrierEnabled}
                                onCheckedChange={(v) => setForm({ ...form, isBarrierEnabled: v })}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 my-2">
                        {form.barrierOptions.map((b) => (
                            <Badge key={b} variant="secondary" className="gap-1 text-xs border-primary/20 bg-primary/10 text-primary">
                                {b}
                                <button onClick={() => removeItem("barrierOptions", b)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Nuovo barrier (es. m3)"
                            value={newBarrier}
                            onChange={(e) => setNewBarrier(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addItem("barrierOptions", newBarrier, () => setNewBarrier(""))}
                            className="max-w-[200px]"
                        />
                        <Button size="icon" variant="outline" onClick={() => addItem("barrierOptions", newBarrier, () => setNewBarrier(""))}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                    <Button onClick={handleSave} disabled={isPending} data-testid="button-save-strategy">
                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {isNew ? "Crea Strategia" : "Salva Modifiche"}
                    </Button>
                    <Button variant="outline" onClick={onCancel} disabled={isPending}>
                        Annulla
                    </Button>
                </div>
            </div>
        </Card>
    );
}

export default function StrategyManager() {
    const { toast } = useToast();
    const [showNew, setShowNew] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const { data: strategies = [], isLoading } = useQuery<Strategy[]>({
        queryKey: ["/api/strategies"],
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/strategies/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
            toast({ title: "Strategia eliminata" });
        },
        onError: () => {
            toast({ title: "Errore nell'eliminazione della strategia", variant: "destructive" });
        },
    });

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-muted-foreground" />
                    <h2 className="text-lg font-medium">Gestione Strategie</h2>
                </div>
                {!showNew && (
                    <Button onClick={() => setShowNew(true)} data-testid="button-new-strategy">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuova Strategia
                    </Button>
                )}
            </div>

            <p className="text-sm text-muted-foreground mb-4">
                Crea diverse strategie, ciascuna con le proprie coppie, confluenze PRO/CONTRO e barrier.
                Quando registri un trade, potrai selezionare la strategia e il form caricherà automaticamente i parametri corrispondenti.
            </p>

            {showNew && (
                <div className="mb-4">
                    <StrategyEditCard isNew onCancel={() => setShowNew(false)} />
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Caricamento strategie...
                </div>
            ) : strategies.length === 0 && !showNew ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Nessuna strategia creata.</p>
                    <p className="text-xs mt-1">Crea la tua prima strategia per personalizzare i parametri per tipo di operatività.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {strategies.map((s) => (
                        <div key={s.id}>
                            {editingId === s.id ? (
                                <StrategyEditCard
                                    strategy={s}
                                    isNew={false}
                                    onCancel={() => setEditingId(null)}
                                />
                            ) : (
                                <Card className="p-4 hover:border-muted-foreground/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <button
                                            className="flex items-center gap-2 text-left flex-1"
                                            onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                                        >
                                            {expandedId === s.id ? (
                                                <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            )}
                                            <span className="font-medium">{s.name}</span>
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {(s.pairs?.length || 0)} coppie · {(s.confluencesPro?.length || 0)} PRO · {(s.confluencesContro?.length || 0)} CONTRO
                                            </span>
                                        </button>
                                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => { setEditingId(s.id); setExpandedId(null); }}
                                                data-testid={`button-edit-strategy-${s.id}`}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    if (window.confirm(`Eliminare la strategia "${s.name}"? I trade associati non verranno eliminati.`)) {
                                                        deleteMutation.mutate(s.id);
                                                    }
                                                }}
                                                data-testid={`button-delete-strategy-${s.id}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {expandedId === s.id && (
                                        <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                                            <div>
                                                <span className="text-muted-foreground text-xs">Coppie:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(s.pairs || []).length > 0
                                                        ? (s.pairs || []).map((p) => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)
                                                        : <span className="text-xs text-muted-foreground">Nessuna</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground text-xs">Confluenze PRO:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(s.confluencesPro || []).length > 0
                                                        ? (s.confluencesPro || []).map((c) => <Badge key={c} variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{c}</Badge>)
                                                        : <span className="text-xs text-muted-foreground">Nessuna</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground text-xs">Confluenze CONTRO:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(s.confluencesContro || []).length > 0
                                                        ? (s.confluencesContro || []).map((c) => <Badge key={c} variant="secondary" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">{c}</Badge>)
                                                        : <span className="text-xs text-muted-foreground">Nessuna</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground text-xs">Barrier:</span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(s.barrierOptions || []).length > 0
                                                        ? (s.barrierOptions || []).map((b) => <Badge key={b} variant="secondary" className="text-xs border-primary/20 bg-primary/10 text-primary">{b}</Badge>)
                                                        : <span className="text-xs text-muted-foreground">Nessuna</span>}
                                                    {s.isBarrierEnabled === false && <span className="text-xs text-muted-foreground ml-2">(disabilitato)</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
