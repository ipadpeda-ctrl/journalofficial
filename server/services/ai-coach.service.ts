import { type AggregatedTradeData } from "./trade-aggregator";
import { type InsertAiAnalysis } from "@shared/schema";

export async function generateAICoachAnalysis(userId: string, aggregatedData: AggregatedTradeData): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const systemPrompt = `Sei un trading coach AI esperto e professionale. Analizzi i dati di trading di uno studente e fornisci consigli personalizzati, specifici e azionabili basati ESCLUSIVAMENTE sui dati forniti.

REGOLE:
- Non dare MAI consigli finanziari generici. Ogni suggerimento deve citare numeri reali dell'utente.
- Rispondi SEMPRE in italiano.
- Rispondi ESCLUSIVAMENTE con un JSON valido (niente markdown, niente backtick, niente testo prima o dopo il JSON).
- Sii diretto, professionale ma incoraggiante.
- Se un dato non è disponibile o il campione è troppo piccolo (< 5 trade), segnalalo nel campo rilevante invece di inventare analisi.
- Le confluenze PRO sono indicatori a favore del trade (es. FVG, OB, BOS, Liquidity Sweep).
- Le confluenze CONTRO sono segnali di warning che il trader ha annotato.
- Il campo "barrier" è un rating pre-trade (A+, A, B, C) che il trader assegna alla qualità del setup.
- Il campo "emotion" indica lo stato emotivo del trader durante il trade.`;

  const userPrompt = `Analizza i seguenti dati di trading aggregati del mio account e fornisci un'analisi dettagliata.

DATI ACCOUNT AGGREGATI:
${JSON.stringify(aggregatedData, null, 2)}

Rispondi ESCLUSIVAMENTE con un JSON valido strutturato esattamente come illustrato qui di seguito (devi includere tutti i campi). Usa questo schema come se fosse l'unica cosa che devi produrre.

{
  "confluenceAnalysis": {
    "topConfluencesPro": [
      {
        "name": "nome confluenza",
        "winRate": 0,
        "totalTrades": 0,
        "avgRR": 0,
        "verdict": "breve giudizio"
      }
    ],
    "bestCombos": [
      {
        "combo": "FVG + OB + ...",
        "winRate": 0,
        "totalTrades": 0,
        "verdict": "breve giudizio"
      }
    ],
    "dangerousControConfluences": [
      {
        "name": "nome confluenza contro",
        "lossCorrelation": "spiegazione di come si correla alle loss"
      }
    ],
    "summary": "paragrafo in italiano sui pattern di confluenza"
  },
  "timeAnalysis": {
    "bestDays": ["Lunedì"],
    "worstDays": ["Venerdì"],
    "bestHours": ["09:00-10:00"],
    "worstHours": ["14:00-15:00"],
    "heatmapData": [
      { "day": "Lunedì", "hour": "09:00", "score": 85 }
    ],
    "summary": "paragrafo in italiano sui pattern orari specifici"
  },
  "pairAnalysis": {
    "bestPairs": [
      {
        "pair": "XAUUSD",
        "winRate": 0,
        "totalTrades": 0,
        "totalPnl": 0,
        "verdict": "giudizio"
      }
    ],
    "worstPairs": [],
    "summary": "paragrafo in italiano"
  },
  "barrierAnalysis": {
    "isAvailable": true,
    "ratings": [
      {
        "rating": "A+",
        "winRate": 0,
        "totalTrades": 0,
        "verdict": "il tuo rating è affidabile/non affidabile"
      }
    ],
    "summary": "paragrafo sulla correlazione rating-risultati"
  },
  "riskManagement": {
    "avgRR": 0,
    "avgRRWinners": 0,
    "avgRRLosers": 0,
    "overtradingDays": ["date dove ha fatto troppi trade"],
    "emotionCorrelation": [
      {
        "emotion": "nome emozione",
        "winRate": 0,
        "impact": "positivo/negativo/neutro"
      }
    ],
    "summary": "paragrafo in italiano"
  },
  "behavioralPatterns": {
    "tiltRisk": "low",
    "longestWinStreak": 0,
    "longestLossStreak": 0,
    "performanceAfterLosses": "descrizione in italiano",
    "holdTimeAnalysis": "confronto tempo vincenti vs perdenti in italiano",
    "summary": "paragrafo in italiano"
  },
  "strategyAnalysis": {
    "strategies": [],
    "summary": "paragrafo in italiano, lascia vuoto se l'utente non ha strategie"
  },
  "personalizedAdvice": [
    {
      "title": "titolo consiglio",
      "advice": "consiglio dettagliato in italiano con dati specifici dell'utente",
      "priority": "high",
      "dataPoint": "dato numerico che supporta il consiglio"
    }
  ],
  "overallScore": 75,
  "overallSummary": "riassunto generale di 2-3 frasi in italiano"
}
`;

  const modelName = "claude-sonnet-4-20250514";
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout
  
  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 4000,
        temperature: 0.1, // Low temp for more statistical rigidity and adherence to JSON format
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Il servizio AI ha impiegato troppo tempo a rispondere (Timeout 120s). Riprova più tardi.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Anthropic API Error (${response.status}):`, errorBody);
    throw new Error(`Il servizio AI è temporaneamente non disponibile (Error ${response.status})`);
  }

  const data = await response.json();
  const rawContent = data.content?.[0]?.text;

  if (!rawContent) {
    throw new Error("Risposta Anthropic vuota o malformata");
  }

  // Clean markdown block if Claude wrapped the JSON
  let cleanedContent = rawContent.trim();
  if (cleanedContent.startsWith("```json")) {
    cleanedContent = cleanedContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleanedContent.startsWith("```")) {
    cleanedContent = cleanedContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  let parsedAnalysis;
  try {
    parsedAnalysis = JSON.parse(cleanedContent);
  } catch (err) {
    console.error("Failed to parse Claude output:", cleanedContent);
    throw new Error("Il servizio AI ha restituito un formato non valido. Riprova più tardi.");
  }

  return {
    rawResponse: parsedAnalysis,
    promptTokensUsed: data.usage?.input_tokens || 0,
    completionTokensUsed: data.usage?.output_tokens || 0,
    model: modelName
  };
}
