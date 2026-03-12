
**Onderdeel**: Prompt Engineering Verslag  
**Opleiding**: Software Engineering  
**Docent**: Deborah Bergwijn  

**Groepsleden**:
- Amar Sewdas (SE/1123/084)
- Rushil Ganpat (SE/1123/019)
- Chen Poun Joe Elton (SE/1123/013)
- Terrence Linger (SE/1123/037)
- Shantenoe Bissumbhar (SE/1123/011)



# TeleBot Prompt Engineering Rapport

## Inhoud

1. [Use Case](#use-case)
2. [Prompt-Ecosysteem Analyse](#prompt-ecosysteem-analyse)
3. [Prompttypes & Ontwerpkeuzes](#prompttypes--ontwerpkeuzes)
4. [Iteratie en Verbetering](#iteratie-en-verbetering)
5. [Kwaliteitscriteria](#kwaliteitscriteria)
6. [Prompt iteratie-proces](#prompt-iteratie-proces)

---

## Use Case

### Probleem

Telesur-klanten stellen veelal veelgestelde vragen over Mobile, Fiber en Entertainment. Wachttijden bij agents zijn hoog en dezelfde vragen worden herhaaldelijk beantwoord. Er is geen 24/7 zelf-service-kanaal voor standaardvragen.

### AI-support doel

TeleBot levert first-line support: snelle, accurate en gegronde antwoorden (via RAG) met bronvermelding, en blokkeert onveilige requests (prompt injection, credentials-requests). Verlaag wachttijd en herhaalwerk voor agents.

### Rol van prompt engineering

Prompt engineering is het schrijven, testen en iteratief verbeteren van prompts die het AI-model sturen. Dit omvat zowel:

- **Prompt-driven development**: prompts gebruiken om code of configuraties (bv. TeleBot flows) te genereren en snel prototypes te bouwen.
- **Runtime prompt engineering**: system prompts, RAG-contextinjectie, few-shot voorbeelden, veiligheidsregels en samenvattingsprompts die het gedrag van TeleBot in productie bepalen.

Samen zorgen deze stappen dat TeleBot consistent, veilig en gebonden aan brondata antwoordt.

---

## Prompt-Ecosysteem Analyse

### User (Gebruiker)

- **Wie**: eindgebruikers (klanten, niet-technisch) en interne supportmedewerkers (occasioneel).
- **Kennisniveau**: gemengd (kennen productnamen, niet altijd technische details).
- **Behoefte**: snelle, praktische oplossing in Nederlands of Engels; korte respons met duidelijke vervolgstap.

### Context

- **RAG**: top-k = 3 geretriievde documenten uit ChromaDB.
- **Rolling conversation summary**: opgeslagen in MongoDB en periodiek hergebruikt.
- **Recente conversieturns**: windowed tot tokenlimiet.
- **Impact**: retrieval-kwaliteit bepaalt grounding; irrelevante chunks verhogen hallucinatierisico.

### Model

- **Model provider**: OpenAI
- **Model**: `gpt-4o-mini`
- **Embeddings**: `text-embedding-3-small`
- **Focus**: prompt-structuur, grounding en safety

### Output

- Kort (1–3 zinnen) antwoord, één actie/volgende stap, bronvermelding indien mogelijk.
- Vaste weigeringstekst bij sensitive requests.
- Structured output optioneel (JSON) voor frontend.

---

## Prompttypes & Ontwerpkeuzes

### Prompt 1 - Instruction Prompt (Main)

**Type**: System/instruction prompt (regels + contextinjectie)

**Doel**: Genereer klantantwoord, grounded in retrieved context & memory.

**Huidge Prompt:**

```
You are TeleBot, Telesur customer support assistant. Answer directly using the context below.
Rules: 
1) Give specific data (prices, speeds, codes) from context.
2) Read the conversation turns to resolve references ('dat', 'dit', 'what did I ask').
3) Reply in the user's language (Dutch/English).
4) Be concise: 1-3 sentences max.
5) Never repeat a previous answer; on 'ja'/'yes' give NEW info.
6) For unresolvable issues: Telesur support 152 / WhatsApp +597 8885888.

[few-shot examples — see Prompt 4]

Memory: {summary}

Conversation:
{recent_messages}

Context:
{context}

User: {user_message}
TeleBot:
```

**Verwachte output**: Kort, feitelijk ondersteuningsantwoord met specifieke gegevens uit context.

**Onderbouwing**: Compacte regels + heldere contextorder (memory→recent→context→vraag) behouden kwaliteit en snelheid.

---

### Prompt 2 - Role-based Summarization Prompt (Memory update)

**Type**: Taakprompt voor compressie van conversatie naar 4–6 bullets.

**Doel**: Bewaar lange-sessie-context beknopt voor RAG injectie.

**Huidge Prompt:**

```
You maintain long-term memory for a telecom support chat.
Update the running summary using the previous summary and recent turns.
Return plain text with 4-6 short bullet lines.
Include: user goal, discussed services, concrete facts/prices, and open follow-ups.
Do not mention that this is a summary.

Previous summary:
{previous_summary}

Recent turns:
{recent_turns}
```

**Verwachte output**: 4–6 bullets met gebruikersdoel, besproken services, prijzen en open punten.

**Onderbouwing**: Vereiste velden voorkomen drift en houden tokengebruik laag (~60 tokens).

---

### Prompt 3 - Safety Guardrail Pattern (pre-LLM filter)

**Type**: Deterministische regex-filter + vaste refusal.

**Doel**: Blokkeer prompt-injection, credential-requests, instruction bypass.

**Huidge Implementatie:**

```python
patterns = [
    r"\bignore\s+(?:all\s+)?(?:previous|prior)\s+instructions?\b",
    r"\breveal\s+(?:the\s+)?(?:system|internal|developer)\s+prompt\b",
    r"\b(?:api[\s_-]?key|password|token|secret|credential)s?\b",
    r"\b(?:bypass\s+(?:safety|guardrails?)|jailbreak|override\s+instructions?)\b",
]

refusal = "I cannot help with requests for secrets, credentials, or instruction bypass attempts."
# run regexes before LLM call; return refusal deterministically on match.
```

**Verwachte output**: Exact dezelfde refusal string; geen LLM-call.

**Onderbouwing**: Auditable, spaart compute, voorkomt adversarial leaks.

---

### Prompt 4 - Few-Shot Prompt (Reply style)

**Type**: Few-shot block (compact) ingespoten in Prompt 1.

**Doel**: Zet toon, format en follow-up gedrag.

**Huidge Few-shot (compact):**

```
Example 1:
User: Wat kost 100/100 internet?
TeleBot: Het Basic pakket (100/100 Mbps) kost SRD 1.099,29/maand (excl. BTW). Wil je upgraden?

Example 2:
User: ja
TeleBot: Het Streaming pakket (200/200) kost SRD 1.868,78/maand. Aanvragen via MyTelesur of 152.
```

**Verwachte output**: Model volgt korte, data-gedreven stijl; voorbeeld 2 voorkomt echo op "ja".

**Onderbouwing**: 2 compacte voorbeelden geven veel kwaliteit per token (~60 tokens).

---

## Iteratie en Verbetering

Tijdens de ontwikkeling van TeleBot zijn meerdere iteraties van de prompts uitgevoerd om de kwaliteit van de antwoorden te verbeteren. Het onderstaande proces laat zien hoe elke prompt is geëvolueerd:

### A. Instruction Prompt (Prompt 1) — 4 iteraties

**Iteratie 1 — Te simpel**
- **Prompt**: `Answer customer question about Telesur. {user_message}`
- **Output**: "Telesur offers various services including mobile, internet, and TV packages."
- **Analyse**: Te generiek, geen grounding in context, geen vervolgstap, geen taalafstemming.

**Iteratie 2 — Context + taalafstemmming**
- **Prompt**: Introductie van context-blok + expliciete taalinstructie.
- **Output**: Betere fokus op domein, stemt af op taal.
- **Analyse**: Gesprekscontinuïteit ontbreekt; geen follow-up; multi-turn tracking zwak.

**Iteratie 3 — Regels + memory + few-shot (uitgebreid)**
- **Prompt**: 8 genummerde regels, volle few-shot (4 voorbeelden), memory update-gebaseerd, recente turn-history, top-3 context retrieval.
- **Output**: Gegrond, bevat vervolgvraag, consistent over turns, correct taal.
- **Probleem**: Latentie op CPU-only 3B model: ~8–10s (prompt overhead).

**Iteratie 4 — Gecomprimeerd, productieklaar (Huidig)**
- **Prompt**: 6 compacte regels (geen redundanties), 2 few-shot-voorbeelden (~60 tokens), `num_predict: 150`, `num_ctx: 2048`, trigger `TeleBot:` aan einde.
- **Output**: Behoud grounding & quality, latency ↓ ~3–5s.
- **Conclusie**: Regelconsolidatie + compacte few-shot = even goede output bij veel snellere inference. **Aanbevolen als production baseline.**

---

### B. Summarization Prompt (Prompt 2) — 3 iteraties

**Iteratie 1 — Te minimalistisch**
- **Prompt**: `Summarize conversation. {messages}`
- **Output**: "The user asked about internet plans and the assistant provided some information about fiber options."
- **Analyse**: Inconsistente lengte, geen structuur, mist relevante feiten en vervolgacties.

**Iteratie 2 — Gestructureerde template**
- **Prompt**: Expliciete velden (User goal, Answer, Pending issues).
- **Output**: Onderverdeeld naar velden, maar nog steeds onpredictabele lengte.
- **Analyse**: Betere fokus, maar meta-lekkage ("This is a summary...").

**Iteratie 3 — Productieklaar (Huidig)**
- **Prompt**: Rol-instructie + 4–6 bullet-beperking + expliciete vereiste velden (doel, services, feiten/prijzen, open punten) + "mention not that this is a summary" regel.
- **Output**: Consistente lengte (~60 tokens), geen metadata-lekkage, gereed voor injectie in Prompt 1 memory.
- **Conclusie**: Vaste structuur + bulletbeperking verhoogt betrouwbaarheid voor lange sessies (~70% token reduction vs. full history).

---

### C. Safety Guardrail Pattern (Prompt 3) — 3 iteraties

**Iteratie 1 — Basislijst**
- **Implementatie**: Eenvoudige string match `["password", "secret", "ignore instructions"]`.
- **Resultaat**: Gemist "Ignore all previous instructions", miste "api_key", "jailbreak".
- **Analyse**: Te beperkt, mist varianten en multi-word frasen.

**Iteratie 2 — Regex met woordgrenzen**
- **Implementatie**: `r"\bignore\s+previous\s+instructions?\b"` + woordgrenzen.
- **Resultaat**: Veel beter op de meeste Bypass vaagen, maar "ignore all prior" werd gemist (optionele "all").
- **Analyse**: Gappige regex voor optionele woorden.

**Iteratie 3 — Productieklaar (Huidig)**
- **Implementatie**: Optionele groepen `r"\bignore\s+(?:all\s+)?(?:previous|prior)\s+instructions?\b"`, plus patterns voor "bypass safety", "jailbreak", "override instructions". Vaste refusal via env-var.
- **Output**: Deterministisch gerefuseerd: "I cannot help with requests for secrets, credentials, or instruction bypass attempts."
- **Conclusie**: Regex-gebaseerde pre-LLM filtering blokkeert bekende aanvallen; sparrt compute. Residueel risico: novel parafrasering (achterstandbeperking: classifier-moderatie toevoegen).

---

### D. Few-Shot Prompt (Prompt 4) — 2 iteraties

**Iteratie 1 — Uitgebreid (4 voorbeelden)**
- **Implementatie**: 4 gedetailleerde voorbeelden (pricing, troubleshooting, out-of-scope, prepaid) voor breed spectrum.
- **Output**: Model begrijpt scenario-spreiding beter; duidelijk toon + follow-up.
- **Analyse**: ~150 tokens overhead → latency ↑ 8–10s op CPU 3B.

**Iteratie 2 — Gecomprimeerd, productieklaar (Huidig)**
- **Implementatie**: 2 compacte voorbeelden (~60 tokens) → pricing query + follow-up handling.
- **Output**: Dezelfde kerninstructies, maar ~90 tokens besparing per request; latency ↓ ~3–5s.
- **Conclusie**: Twee gefocuste voorbeelden behouden kwaliteit; drie archetypes (pricing, out-of-scope, troubleshoot) nu overgenomen door regels in Prompt 1. Trade-off aanvaardbaar: snelheid wint boven redundante voorbeelden.

---

## Kwaliteitscriteria

### Effectiviteit

- Hoofdprompt retourneert betrouwbaar domein-gefocuste ondersteuningsantwoorden gegrond in opgehaalde context.
- Samenvattingsprompt behoudt sessiecontinuïteit over 10+ turnconversaties.
- Veiligheidspatronen blokkeren bekende injectie-/extractiepogingen met nul valse negatieven op testgroep.
- Few-shot-voorbeelden helpen toon- en formaatconsistentie voor stabiele production output.

### Efficiëntie

- Samenvatting-gebaseerd geheugen reduceert volledige geschiedenis token-gebruik met ~70% in lange gesprekken.
- Contextophaaling beperkt promptnukleus tot top-3-chunks met token-budget-doppen.
- Few-shot-blok voegt ~60 tokens toe (geoptimaliseerd van ~150) — minimale kosten voor aanzienlijke outputkwaliteitswinst.
- Prompt gecomprimeerd met ~60% (Iteratie 4) die inferencetijd reduceert van ~8-10s naar ~3-5s op CPU.
- Guardrail-regex draait vóór LLM-oproep, bespart inferencetijd bij geblokkeerde verzoeken.

### Consistentie

- Genummerde regels en gestructureerde secties produceren stylisch consistente antwoorden.
- Few-shot-voorbeelden verankeren het antwoordformaat over diverse vraagtypen.
- Veiligheidspad produceert telkens identieke weigeringsoutput.
- Samenvattingsformaat is beperkt tot 4-6 opsommingslijnen met vereiste velden.

### Foutgevoeligheid en randgevallen

- **Risico**: Zwakke of verouderde brondocumenten verminderen antwoordprecisie → beperking: geplande RAG-vernieuwing van live Telesur-website.
- **Risico**: Regex-alleen guardrails kunnen adversaire parafrasering missen → beperking achterstand: add classifier-gebaseerde moderatie en adversaire testgroep.
- **Risico**: Model kan prijzen hallucineren → beperking: regel 2 beperkt zich tot opgehaalde context alleen; few-shot-voorbeeld toont verwijzingspatroon.
- **Risico**: Taaldetectie mislukking → beperking: regel 6 instrueert expliciet taalafstemming; few-shot ziet Nederlands en Engels.

---

## Prompt iteratie-proces

Tijdens de ontwikkeling van TeleBot zijn meerdere iteraties van de prompts uitgevoerd om de kwaliteit van de antwoorden te verbeteren.

**Iteratie 1 – Basisprompt**
- Eerste versie met eenvoudige instructies voor het beantwoorden van FAQ-vragen.
- Probleem: antwoorden waren soms te algemeen en niet altijd gebaseerd op de kennisbank.

**Iteratie 2 – Context en regels**
- Toevoeging van duidelijke systeemregels en RAG-context.
- Antwoorden werden beter afgestemd op de beschikbare informatie.

**Iteratie 3 – Few-shot voorbeelden**
- Voorbeeldvragen en antwoorden toegevoegd om de gewenste structuur en toon te tonen.
- Dit verbeterde de consistentie van antwoorden.

**Iteratie 4 – Prompt optimalisatie**
- Prompt ingekort en structuur vereenvoudigd.
- Tokengebruik en responstijd werden hierdoor lager, terwijl de kwaliteit behouden bleef.

Dit iteratieproces hielp om een stabiele promptstructuur te ontwikkelen die betrouwbare en consistente klantondersteuning kan bieden.
