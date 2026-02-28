import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Filter, X, ChevronDown, Clock, CalendarIcon } from "lucide-react";
import { Trade } from "./TradesTable";

export interface TradeFilters {
    startDate: string;
    endDate: string;
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
    daysOfWeek: number[]; // 0=Sunday, 1=Monday...
    pairs: string[];
    directions: ("long" | "short")[];
    results: string[];
    confluencesPro: string[];
    confluencesContro: string[];
    alignedTimeframes: string[];
    barriers: string[];
}

export const defaultFilters: TradeFilters = {
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    daysOfWeek: [],
    pairs: [],
    directions: [],
    results: [],
    confluencesPro: [],
    confluencesContro: [],
    alignedTimeframes: [],
    barriers: [],
};

interface TradeFilterBarProps {
    filters: TradeFilters;
    onFilterChange: (filters: TradeFilters) => void;
    availablePairs: string[];
    availableConfluencesPro: string[];
    availableConfluencesContro: string[];
    availableAlignedTimeframes: string[];
    availableBarriers: string[];
    tradesCount: number;
}

// A reusable MultiSelect component
function MultiSelectFilter({
    title,
    options,
    selectedValues,
    onSelectionChange,
}: {
    title: string;
    options: { label: string; value: string }[];
    selectedValues: string[];
    onSelectionChange: (values: string[]) => void;
}) {
    const [open, setOpen] = useState(false);

    const toggleOption = (value: string) => {
        if (selectedValues.includes(value)) {
            onSelectionChange(selectedValues.filter((v) => v !== value));
        } else {
            onSelectionChange([...selectedValues, value]);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed flex gap-2 w-full justify-start sm:w-auto sm:min-w-[120px]">
                    <span className="text-muted-foreground truncate max-w-[80px] sm:max-w-[100px] text-left">
                        {title}
                    </span>
                    {selectedValues.length > 0 && (
                        <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden xl:block">
                            {selectedValues.length}
                        </Badge>
                    )}
                    <ChevronDown className="w-3 h-3 ml-auto opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <div className="p-2 border-b">
                    <p className="font-semibold text-sm">{title}</p>
                </div>
                <ScrollArea className="h-56">
                    <div className="p-2 flex flex-col gap-1">
                        {options.map((option) => (
                            <Label
                                key={option.value}
                                className="flex items-center gap-2 p-2 rounded-sm hover:bg-muted cursor-pointer text-sm font-normal"
                            >
                                <Checkbox
                                    checked={selectedValues.includes(option.value)}
                                    onCheckedChange={() => toggleOption(option.value)}
                                />
                                {option.label}
                            </Label>
                        ))}
                    </div>
                </ScrollArea>
                {selectedValues.length > 0 && (
                    <div className="p-2 border-t flex justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => {
                                onSelectionChange([]);
                                setOpen(false);
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

const DAYS_OF_WEEK = [
    { label: "Domenica", value: "0" },
    { label: "Lunedì", value: "1" },
    { label: "Martedì", value: "2" },
    { label: "Mercoledì", value: "3" },
    { label: "Giovedì", value: "4" },
    { label: "Venerdì", value: "5" },
    { label: "Sabato", value: "6" },
];

const RESULTS = [
    { label: "Target", value: "target" },
    { label: "Stop Loss", value: "stop_loss" },
    { label: "Breakeven", value: "breakeven" },
    { label: "Parziale", value: "parziale" },
    { label: "Non Fillato", value: "non_fillato" },
];

const DIRECTIONS = [
    { label: "Long", value: "long" },
    { label: "Short", value: "short" },
];

export default function TradeFilterBar({
    filters,
    onFilterChange,
    availablePairs,
    availableConfluencesPro,
    availableConfluencesContro,
    availableAlignedTimeframes,
    availableBarriers,
    tradesCount,
}: TradeFilterBarProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Calcola quanti filtri attivi ci sono
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.startDate) count++;
        if (filters.endDate) count++;
        if (filters.startTime) count++;
        if (filters.endTime) count++;
        count += filters.daysOfWeek.length;
        count += filters.pairs.length;
        count += filters.directions.length;
        count += filters.results.length;
        count += filters.confluencesPro.length;
        count += filters.confluencesContro.length;
        count += filters.alignedTimeframes.length;
        count += filters.barriers.length;
        return count;
    }, [filters]);

    const updateFilter = <K extends keyof TradeFilters>(key: K, value: TradeFilters[K]) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const clearAllFilters = () => {
        onFilterChange(defaultFilters);
    };

    return (
        <div className="bg-muted/30 border rounded-lg p-2 sm:p-4 mb-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`gap-2 ${activeFiltersCount > 0 ? "border-primary text-primary" : ""}`}
                        data-testid="toggle-filters"
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filtri Avanzati</span>
                        <span className="sm:hidden">Filtri</span>
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="ml-1 bg-primary/20 text-primary">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </Button>

                    {activeFiltersCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="text-muted-foreground hover:text-destructive h-8 px-2"
                        >
                            Reset Tutti
                        </Button>
                    )}

                    <div className="ml-auto sm:ml-4 text-sm text-muted-foreground font-medium flex items-center gap-1">
                        <span>Operazioni:</span>
                        <Badge variant="secondary">{tradesCount}</Badge>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-in fade-in slide-in-from-top-4">

                    {/* PAIR & RESULT */}
                    <MultiSelectFilter
                        title="Coppia"
                        options={availablePairs.map(p => ({ label: p, value: p }))}
                        selectedValues={filters.pairs}
                        onSelectionChange={(v) => updateFilter("pairs", v)}
                    />
                    <MultiSelectFilter
                        title="Risultato"
                        options={RESULTS}
                        selectedValues={filters.results}
                        onSelectionChange={(v) => updateFilter("results", v)}
                    />
                    <MultiSelectFilter
                        title="Direzione"
                        options={DIRECTIONS}
                        selectedValues={filters.directions}
                        onSelectionChange={(v) => updateFilter("directions", v as any[])}
                    />
                    <MultiSelectFilter
                        title="Giorno"
                        options={DAYS_OF_WEEK}
                        selectedValues={filters.daysOfWeek.map(String)}
                        onSelectionChange={(v) => updateFilter("daysOfWeek", v.map(Number))}
                    />

                    {/* ADVANCED: TFs & BARRIER */}
                    <MultiSelectFilter
                        title="TF Allineati"
                        options={availableAlignedTimeframes.map(tf => ({ label: tf, value: tf }))}
                        selectedValues={filters.alignedTimeframes}
                        onSelectionChange={(v) => updateFilter("alignedTimeframes", v)}
                    />
                    <MultiSelectFilter
                        title="Barrier"
                        options={availableBarriers.map(b => ({ label: b, value: b }))}
                        selectedValues={filters.barriers}
                        onSelectionChange={(v) => updateFilter("barriers", v)}
                    />

                    {/* CONFLUENCES */}
                    <MultiSelectFilter
                        title="Confluenze PRO"
                        options={availableConfluencesPro.map(c => ({ label: c, value: c }))}
                        selectedValues={filters.confluencesPro}
                        onSelectionChange={(v) => updateFilter("confluencesPro", v)}
                    />
                    <MultiSelectFilter
                        title="Confluenze CONTRO"
                        options={availableConfluencesContro.map(c => ({ label: c, value: c }))}
                        selectedValues={filters.confluencesContro}
                        onSelectionChange={(v) => updateFilter("confluencesContro", v)}
                    />

                    {/* DATE & TIME RANGES */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className={`col-span-1 sm:col-span-2 md:col-span-2 h-8 border-dashed justify-start ${filters.startDate || filters.endDate ? "border-primary/50 bg-primary/5" : ""}`}>
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                {filters.startDate ? filters.startDate : "Inizio"}
                                <span className="mx-1">→</span>
                                {filters.endDate ? filters.endDate : "Fine"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Range di Date</h4>
                                    <p className="text-sm text-muted-foreground">Filtra le operazioni per data.</p>
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="date-start">Da</Label>
                                        <Input
                                            id="date-start"
                                            type="date"
                                            value={filters.startDate}
                                            onChange={(e) => updateFilter("startDate", e.target.value)}
                                            className="col-span-2 h-8"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="date-end">A</Label>
                                        <Input
                                            id="date-end"
                                            type="date"
                                            value={filters.endDate}
                                            onChange={(e) => updateFilter("endDate", e.target.value)}
                                            className="col-span-2 h-8"
                                        />
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className={`col-span-1 sm:col-span-2 md:col-span-2 h-8 border-dashed justify-start ${filters.startTime || filters.endTime ? "border-primary/50 bg-primary/5" : ""}`}>
                                <Clock className="w-4 h-4 mr-2" />
                                {filters.startTime ? filters.startTime : "Ore 00:00"}
                                <span className="mx-1">→</span>
                                {filters.endTime ? filters.endTime : "Ore 23:59"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Fascia Oraria</h4>
                                    <p className="text-sm text-muted-foreground">Filtra per l'orario specifico del trade (es. solo mattina).</p>
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="time-start">Dalle</Label>
                                        <Input
                                            id="time-start"
                                            type="time"
                                            value={filters.startTime}
                                            onChange={(e) => updateFilter("startTime", e.target.value)}
                                            className="col-span-2 h-8"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="time-end">Alle</Label>
                                        <Input
                                            id="time-end"
                                            type="time"
                                            value={filters.endTime}
                                            onChange={(e) => updateFilter("endTime", e.target.value)}
                                            className="col-span-2 h-8"
                                        />
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                </div>
            )}
        </div>
    );
}
