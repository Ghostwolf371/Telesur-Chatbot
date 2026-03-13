# ARCHITECTUUR VERSLAG

## Projectgegevens

| Item | Details |
|------|---------|
| **Onderdeel** | Architectuur verslag |
| **Opleiding** | Software Engineering |
| **Docent** | Rwynn Christian |
| **Groepsleden** | Amar Sewdas (SE/1123/084)<br/>Rushil Ganpat (SE/1123/019)<br/>Chen Poun Joe Elton (SE/1123/013)<br/>Terrence Linger (SE/1123/037)<br/>Shantenoe Bissumbhar (SE/1123/011) |

---

## Voorwoord

Dit document beschrijft het beroepsproduct TeleBot, een AI-gestuurde chatbot die ontwikkeld is voor het beantwoorden van klantvragen binnen een telecomomgeving. Dit verslag is opgesteld in het kader van een schoolopdracht en heeft als doel om de architectuur, technische keuzes en werking van het systeem te documenteren.

Tijdens de ontwikkeling van dit project is gebruikgemaakt van verschillende moderne technologieën, waaronder webframeworks, databases en AI-diensten. Door middel van dit document wordt inzicht gegeven in hoe deze componenten samenwerken om een functionele en schaalbare chatbotoplossing te realiseren.

Het verslag dient als technische beschrijving van het systeem en kan gebruikt worden om de opzet, werking en architectuur van TeleBot beter te begrijpen.

---

## Inhoud

1. [Voorwoord](#voorwoord)
2. [Inleiding](#inleiding)
3. [Doel en Scope](#doel-en-scope)
4. [Architectuurcomponenten](#architectuurcomponenten)
5. [Diagrammen](#diagrammen)
6. [Datastromen](#datastromen)
7. [Afhankelijkheden](#afhankelijkheden)
8. [Onderbouwing van Keuzen](#onderbouwing-van-keuzen)
9. [Schaalbaarheid](#schaalbaarheid)
10. [Globale Kosteninschatting](#globale-kosteninschatting)
11. [Security, Privacy & Betrouwbaarheid](#security-privacy--betrouwbaarheid)
12. [Scalability, Risico's en Beperkingen](#scalability-risicos-en-beperkingen)
13. [Implementatie & Deployment](#implementatie--deployment)

---

## Inleiding

Binnen telecombedrijven zoals Telesur ontvangen klantenservices dagelijks veel vragen over abonnementen, internetinstallaties, storingen en andere diensten. Het handmatig beantwoorden van al deze vragen kan tijd kosten en leiden tot langere wachttijden voor klanten. Om dit proces te ondersteunen kan een chatbot worden ingezet die automatisch veelgestelde vragen kan beantwoorden.

In dit beroepsproduct is TeleBot ontwikkeld: een AI-gebaseerde chatbot die gebruikers helpt bij het verkrijgen van informatie over diensten zoals mobiele abonnementen, fiberinstallaties en entertainmentpakketten. De chatbot is ontworpen met een moderne softwarearchitectuur waarbij een webinterface, backend-API, vector database en een AI-model samenwerken om relevante en contextbewuste antwoorden te genereren.

Dit document beschrijft de architectuur van TeleBot, de gebruikte technologieën en de manier waarop de verschillende systeemcomponenten met elkaar communiceren. Het doel van dit verslag is om een duidelijk technisch overzicht te geven van de opbouw en werking van het systeem.

---

## Doel en Scope

### Doel

Het doel van TeleBot is om klanten van telecomdiensten snel en automatisch te helpen bij vragen over mobiele diensten, fiber internet, storingen en pakketinformatie. In plaats van te moeten wachten op een reactie van de klantenservice (bijvoorbeeld via WhatsApp of e-mail), kunnen gebruikers hun vraag direct aan de chatbot stellen en vrijwel onmiddellijk een antwoord ontvangen.

De chatbot fungeert als een eerste lijn van klantenservice en helpt gebruikers met veelvoorkomende vragen. Hierdoor worden wachttijden verminderd en kunnen klanten sneller geholpen worden zonder direct contact te hoeven opnemen met de klantenservice van Telesur.

### Scope

De scope van dit project omvat de ontwikkeling van een AI-chatbot die in de cloud wordt gehost en toegankelijk is via een webinterface.

Het systeem bestaat uit:
- Een frontend webinterface waar gebruikers vragen kunnen stellen
- Een backend API die gebruikersvragen verwerkt
- Een vector database voor document retrieval
- Integratie met een Large Language Model (LLM) voor het genereren van antwoorden
- Opslag van sessies, berichten en telemetry data
- Monitoring en basis security- en privacymaatregelen

De chatbot wordt volledig gehost in de cloud via Render en is toegankelijk via een webbrowser op zowel desktop als mobiele apparaten. Het systeem is niet bedoeld om lokaal te draaien, maar is ontworpen als een online service die centraal wordt beheerd.

---

## Architectuurcomponenten

### Frontend
- **Next.js 14**
- **Tailwind CSS**
- **Shadcn-style UI components**
- **SSE streaming ondersteuning**
- **react-markdown** voor geformatteerde chatantwoorden
- **Feedback UI**: thumbs-up / thumbs-down knoppen per chatbericht (POST naar `/api/feedback`)
- **Monitoring dashboard** (`/monitor`): stat-kaarten, kosteninschatting, latency-sparkline en feedback-overzicht

### Backend
- **Django 4.2**
- **Django REST Framework**
- **Gunicorn + gevent**
- **DRF orchestration API**
- **Endpoints:**
  - `/api/chat`
  - `/api/chat/stream`
  - `/api/summarize`
  - `/api/health`
  - `/api/telemetry`
  - `/api/dashboard`
  - `/api/feedback`

### ChromaDB
- Lokale persistente vectoropslag
- Metadata filtering
- Top-k retrieval

### MongoDB
- Sessies
- Geschiedenis van chatberichten
- Telemetry data
- Gebruikersfeedback

### OpenAI API
- Chat Completions (gpt-4o-mini)
- Embeddings (text-embedding-3-small)

### Deployment
- **Render** (primair)
- **HTTPS** standaard via platform
- **Lokale development** via runserver en npm run dev

---

## Diagrammen

### System Architecture Diagram

```mermaid
graph TB
    User(["👤 Gebruiker (Browser)"])

    subgraph RENDER ["Render Cloud Platform — HTTPS"]
        FE["<b>Frontend</b><br/>Next.js 14 · Tailwind CSS<br/>Chat UI met SSE Streaming<br/>Monitor Dashboard · Feedback pagina<br/>Client-side PII-blokkade"]

        BE["<b>Backend API</b><br/>Django 4.2 · Django REST Framework<br/>Gunicorn + gevent workers<br/>Rate Limiting (DRF Throttle)"]

        GUARD["<b>Guardrail Service</b><br/>Prompt-injection filter (4 regex-patronen)<br/>PII-detectie (telefoon, e-mail, BSN, CC)"]

        RAG["<b>RAG Service</b><br/>Retrieval-Augmented Generation<br/>Top-k context retrieval"]

        CHROMA[("<b>ChromaDB</b><br/>Vectoropslag<br/>Persistent Disk")]
    end

    OPENAI["<b>OpenAI API</b><br/>Chat: gpt-4o-mini<br/>Embeddings: text-embedding-3-small"]

    MONGO[("<b>MongoDB Atlas</b><br/>Sessions · Messages<br/>Telemetry · Feedback")]

    User <-->|"HTTPS"| FE
    FE -->|"REST API-calls"| BE
    BE -->|"Invoercontrole"| GUARD
    GUARD -->|"Veilige invoer"| RAG
    RAG <-->|"Embedding query ↔<br/>Relevante documenten"| CHROMA
    BE -->|"Prompt + context"| OPENAI
    OPENAI -->|"AI-antwoord"| BE
    BE <-->|"Opslag &amp; ophalen"| MONGO
    BE -->|"Response (JSON / SSE)"| FE
```

### Sequence Diagram - Chat Flow

```mermaid
sequenceDiagram
    participant User as 👤 Gebruiker
    participant FE as Frontend (Next.js)
    participant BE as Backend (Django + DRF)
    participant Guard as Guardrail Service
    participant RAG as RAG Service
    participant Chroma as ChromaDB
    participant LLM as OpenAI API
    participant DB as MongoDB Atlas

    User->>FE: Stuur chatbericht

    Note over FE: Client-side PII-check<br/>(telefoon, e-mail, BSN, CC)
    alt PII gedetecteerd (client-side)
        FE-->>User: Inline waarschuwing — bericht NIET verzonden
    else Invoer is schoon
        FE->>BE: POST /api/chat/stream

        BE->>DB: Sessie aanmaken / ophalen
        BE->>DB: Gebruikersbericht opslaan
        BE->>DB: Recente berichten ophalen

        BE->>Guard: Invoercontrole (injection + PII)

        alt Prompt-injection gedetecteerd
            Guard-->>BE: Geblokkeerd
            BE-->>FE: Weigeringsrespons (JSON)
            FE-->>User: Toon weigering
        else PII gedetecteerd (server-side)
            Guard-->>BE: PII gevonden
            BE-->>FE: PII-waarschuwing (JSON)
            FE-->>User: Toon PII-waarschuwing
        else Invoer is veilig
            Guard-->>BE:  Goedgekeurd

            BE->>RAG: Context ophalen
            RAG->>Chroma: Embedding-query
            Chroma-->>RAG: Relevante documenten
            RAG-->>BE: Context resultaten

            BE->>LLM: Prompt + context + samenvatting
            LLM-->>BE: AI-antwoord (streaming tokens)

            BE-->>FE: SSE stream (tokens + bronnen + telemetry)
            FE-->>User: Toon antwoord in real-time

            BE->>DB: Assistentbericht + bronnen opslaan
            BE->>DB: Telemetry loggen (latency, tokens, status)

            opt Elke 5 berichten
                BE->>LLM: Samenvattingsverzoek (achtergrond)
                LLM-->>BE: Bijgewerkte samenvatting
                BE->>DB: Samenvatting opslaan
            end
        end
    end
```

---

## Datastromen

### Request Flow

- De gebruiker stuurt een bericht via de chatinterface van de frontend.
- De frontend stuurt een verzoek naar POST /api/chat.
- De backend voert guardrail-controles uit: eerst prompt-injection detectie (`is_blocked`), daarna PII-detectie (`contains_pii`) voor telefoonnummers, e-mailadressen, BSN-nummers en creditcardnummers.
- Als het bericht veilig is en geen PII bevat, haalt de backend context op uit Chroma (RagService).
- De backend voegt de samenvatting en de opgehaalde context toe aan de LLM-prompt en roept OpenAI API (gpt-4o-mini) aan.
- De backend slaat de berichten van de gebruiker en de assistent op in MongoDB.
- Na elke 5 opgeslagen berichten vernieuwt de backend de samenvatting via een verborgen LLM-samenvattingsoproep.
- De backend registreert een telemetry-record en stuurt het antwoord van de assistent plus de gebruikte bronnen terug.
- Feedback van testers kan worden verzonden en opgeslagen via POST /api/feedback.

### Request Protection

DRF scoped throttles zorgen voor rate limits (snelheidslimieten) op de endpoints `/api/chat` en `/api/summarize`.

### Data Flow & Opslag

#### Mongo Collections:
- **sessions**: sessie metadata en een doorlopende samenvatting
- **messages**: gespreksgeschiedenis
- **telemetry**: endpoint prestaties en fouten
- **feedback**: tester beoordelingen / succesnotities voor user-validation bewijs

#### Chroma Collection:
- **telesur_docs** met documentfragmenten (chunks), metadata en embeddings

---

## Afhankelijkheden

### Runtime
- Python 3.12+
- Node.js 20+

### Externe Services
- OpenAI API
- MongoDB
- ChromaDB

### Configuratie
- .env bestand
- Environment variables voor secrets

### Observability
- `/api/telemetry` — per-request latency, tokens, status
- `/api/dashboard` — geaggregeerde statistieken inclusief tokenkosten (`cost_usd_est`) en feedback-samenvatting
- Frontend `/monitor` pagina met:
  - Stat-kaarten (requests, error rate, latency, tokens, kosten, conversations)
  - Feedback-overzicht (entries, avg rating, success rate)
  - **Latency-sparkline** (kleurgecodeerde staafgrafiek van de laatste 25 requests)
  - Telemetry-logtabel met per-rij kostenkolom

---

## Onderbouwing van Keuzen

### 1. RAG (Retrieval-Augmented Generation) boven pure LLM-prompts
Verbetert antwoord tracering (grounding) en brondocumentatie. Gebruikers zien welke Telesur-documenten zijn gebruikt, wat vertrouwen opbouwt en hallucinaties vermindert.

### 2. Hybrid MongoDB-aanpak (djongo functionaliteit + actieve pymongo repository-laag)
Behoudt Django-compatibiliteit terwijl directe, performante bewerkingen worden gebruikt voor kritieke code-paden. Zo krijgen we het beste van beide werelden — Django's stabiliteit plus direct database-performance.

### 3. OpenAI API (gpt-4o-mini)
Levert hoge-kwaliteit antwoorden met consistente embeddings via text-embedding-3-small, tegen lage kosten. Deze small model houdt token-kosten minimaal terwijl deze lokale alternatieven (bijv. Ollama) overtreft in snelheid en kwaliteit.

### 4. Render Hosting
Nul-ops deployment met gratis tier, persistente schijf voor ChromaDB (vector-index overleeft container-restarts), en automatische TLS/HTTPS-certificaten. Geen complexe infrastructure-beheer nodig.

---

## Schaalbaarheid

### Huidige Setup
Geschikt voor development en lichte productie.

### Bottlenecks
- OpenAI API latency
- Vector retrieval performance

### Schaalstrategie
1. Backend stateless maken.
2. Meerdere backend-replicas achter load balancer.
3. Managed vector database bij groei.
4. Caching implementeren voor frequente queries.
5. CDN voor statische frontend assets.

---

## Globale Kosteninschatting

### Kleine Productie
- Render Free: €0
- MongoDB Shared: €0–€9/maand
- OpenAI API (~100 req/dag): €20/maand
- Domein: €1/maand
- **Totaal: €22-30/maand**

### Medium productie
- Render betaald: ~€14/maand
- MongoDB M5: ~€57/maand
- OpenAI API (~1000 req/dag): €50–€100/maand
- **Totaal: ~€121–€171/maand**

### Grootte productie
- Render (Auto-scaling): ~€300/maand
- MongoDB Dedicated (M30+): ~€400 – €750/maand
- OpenAI API (~100.000 req/dag): €500 (Mini) – €8.500 (Full)/maand
- Infrastructuur (CDN/Mail/Logs): ~€250/maand
- **Totaal: ~€1.450 – €9.800/maand**

---

## Security, Privacy & Betrouwbaarheid

### 1. Prompt Injection Risico's & Beveiliging

TeleBot verwerkt vrije-tekst invoer van onbekende gebruikers. Dit maakt het systeem vatbaar voor prompt-injection aanvallen, waarbij een kwaadwillende gebruiker probeert het systeemgedrag te manipuleren.

**Geïmplementeerde mitigaties:**

- **Regex-guardrail (pre-LLM filter):** Elke gebruikersinvoer wordt vóór de LLM-aanroep gecontroleerd door `GuardrailService`. De service bevat 4 regex-patronen tegen prompt injection (`_blocked_patterns`):
  - `ignore (all) previous/prior instructions` — instruction bypass
  - `reveal (the) system/internal/developer prompt` — prompt exfiltratie
  - `api key / password / token / secret / credential` — credential extractie
  - `bypass safety / jailbreak / override instructions` — guardrail omzeiling
- **PII-detectie guardrail:** Een tweede guardrail (`_pii_patterns`) herkent persoonlijke gegevens zoals BSN-nummers (9-cijferig), telefoonnummers (+597 / 06 / internationaal), e-mailadressen en creditcardnummers. Berichten met PII worden direct geweigerd.
- **Vaste weigeringstekst:** Bij een match wordt een deterministische refusal geretourneerd (bijv. *"I cannot help with requests for secrets, credentials, or instruction bypass attempts."*). Er vindt geen LLM-aanroep plaats.
- **Case-insensitive matching:** Alle patronen werken met `re.IGNORECASE` om variaties te vangen.

**Residueel risico:** Patroongebaseerde guardrails kunnen onbekende, creatieve herformuleringen missen. Aanbeveling voor toekomstige versie: classifier-gebaseerde moderatie (bijv. OpenAI Moderation API) toevoegen als extra laag.

### 2. Misbruikpreventie

| Maatregel | Implementatie | Configuratie |
|---|---|---|
| Rate limiting (chat) | DRF `ScopedRateThrottle` op `/api/chat` | `CHAT_RATE_LIMIT` = 30/min |
| Rate limiting (samenvatting) | DRF `ScopedRateThrottle` op `/api/summarize` | `SUMMARIZE_RATE_LIMIT` = 20/min |
| Rate limiting (feedback) | DRF `ScopedRateThrottle` op `/api/feedback` | `FEEDBACK_RATE_LIMIT` = 30/min |
| Rate limiting (anoniem) | Globale anonieme limiet | `ANON_RATE_LIMIT` = 120/min |
| Inputvalidatie | DRF serializers controleren invoerformaat | Automatisch via Django REST Framework |
| Foutafscherming | Fallback error responses zonder stacktrace | `DEBUG=0` in productie |

Bij overschrijding van rate limits retourneert de API een `HTTP 429 Too Many Requests` response.

**Aanbeveling:** Bij toekomstige authenticatie per-gebruiker quota's toevoegen en reverse-proxy WAF-regels overwegen.

### 3. Persoonsgegevens en AVG (GDPR)

**Dataminimalisatie — huidige maatregelen:**

| Opgeslagen data | Doel | Bevat PII? |
|---|---|---|
| `sessions` (MongoDB) | Sessie-metadata, rolling summary | Nee — sessie-ID is random UUID |
| `messages` (MongoDB) | Gespreksgeschiedenis | Mogelijk — gebruikers kunnen persoonlijke info typen |
| `telemetry` (MongoDB) | Endpoint prestaties, fouten | Nee — alleen operationele metadata |
| `feedback` (MongoDB) | Tester beoordelingen | Nee — tester-ID is pseudoniem |

- **Geen authenticatie:** Er worden geen accounts, e-mailadressen of wachtwoorden opgeslagen.
- **Pseudonimisering:** Sessie-ID's en tester-ID's zijn willekeurige UUID's zonder koppeling aan echte identiteiten.
- **Telemetry bevat geen prompts:** Alleen operationele metadata (latency, tokenaantallen, foutmeldingen) wordt gelogd, niet de volledige promptinhoud.
- **Verwerking door derden:** Gebruikersberichten worden naar de OpenAI API gestuurd voor generatie en embedding. Volgens het OpenAI API-beleid worden API-data niet gebruikt voor modeltraining. Een Data Processing Agreement (DPA) is beschikbaar voor AVG-compliance.

**Vereiste productieacties:**
- Retentiebeleid definiëren voor berichten en telemetry (bijv. automatisch verwijderen na 90 dagen).
- Data-export en verwijderworkflows implementeren (recht op vergetelheid).
- Privacyverklaring opstellen die gebruikers informeert over derde-partij verwerking (OpenAI).

### 4. Secrets Management

- Alle API-sleutels en configuratie via environment variables (`.env` lokaal, Render environment variables in productie).
- `.env` staat in `.gitignore` — geen secrets in versiebeheer.
- Frontend-container ontvangt alleen `NEXT_PUBLIC_API_BASE_URL` — geen backend-secrets worden blootgesteld.
- `SECRET_KEY` wordt automatisch gegenereerd door Render Blueprint (`generateValue: true` in `render.yaml`).
- OpenAI API-sleutel wordt encrypted-at-rest opgeslagen door Render.

### 5. Foutafhandeling en Fallbacks

- **Health endpoint:** `GET /api/health` controleert MongoDB, ChromaDB en OpenAI API status. Retourneert `{"status": "ok"}` met per-service statusmeldingen.
- **Chat fallback:** Het chat-endpoint vangt runtime-exceptions op en retourneert een veilige foutmelding in plaats van een stacktrace.
- **Retrieval degradation:** Als ChromaDB-retrieval faalt, kan het systeem graceful degraderen zonder de hele request te laten crashen.
- **CORS-bescherming:** Alleen geconfigureerde origins (`CORS_ALLOWED_ORIGINS`) mogen de API benaderen. In productie staat `CORS_ALLOW_ALL_ORIGINS` op `0`.
- **HTTPS:** Automatisch TLS-certificaat via Render voor alle productie-endpoints.

---

## Scalability, Risico's en Beperkingen

- Applicatie draait momenteel als single instance op Render (free tier).
- Mogelijke bottlenecks: OpenAI API latency, Chroma queries, MongoDB netwerk latency en Render cold starts.
- Rate limiting en caching helpen om overbelasting te voorkomen.
- Regex-guardrails zijn beperkt tegen geavanceerde prompt-injection.
- Afhankelijkheid van OpenAI API uptime.
- Documenten moeten regelmatig worden bijgewerkt voor correcte antwoorden.

---

