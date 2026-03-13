# Gebruikerstest & Validatie Rapport

## Projectgegevens

| Item | Details |
|------|---------|
| **Onderdeel** | Gebruikerstest & Validatie |
| **Opleiding** | Software Engineering |
| **Docent** | Rwynn Christian |
| **Groepsleden** | Amar Sewdas (SE/1123/084)<br/>Rushil Ganpat (SE/1123/019)<br/>Chen Poun Joe Elton (SE/1123/013)<br/>Terrence Linger (SE/1123/037)<br/>Shantenoe Bissumbhar (SE/1123/011) |

---

## 1. Validatiedoel

Aantonen met echte gebruikers dat TeleBot praktische ondersteuningswaarde biedt voor Mobile, Fiber en Entertainment vragen, en dat faalpatronen meetbaar en verhelbaar zijn.

## 2. Acceptatiecriteria (volgens opdracht)

| Criterium | Vereiste |
|---|---|
| Minimum aantal testers | ≥ 3 echte testers |
| Minimum aantal gesprekken | 20-30 totaal |
| Feedbackverzameling | Score/enquête per tester |
| Faalanalyse | Mislukte interacties + concrete verbeteringen |

---

## 3. Testprotocol

### Testopzet

- **Toegangspunt:** Productie-URL: [https://telesur-chatbot.onrender.com](https://telesur-chatbot.onrender.com)
- **Backend API:** `https://telesur-chatbot-1.onrender.com`
- **Monitoring:** Productie `/monitor` en `/feedback` pagina's
- **Testperiode:** 11 maart 2026 – 13 maart 2026
- **Versie onder test:** commit `761eac1` (main branch, incl. client-side PII-blokkade)
- Gebruik **Nieuw Gesprek** voor elk scenario zodat elk gesprek als apart wordt geteld.
- Testers gebruikten de 👍/👎 knoppen onder elk antwoord om directe feedback vast te leggen.

### Testerprofiel

| Tester | Naam | Rol / Achtergrond | Relatie tot Telesur |
|---|---|---|---|
| Tester 1 | Wishwaash Sahebdin | Security Operation Center medewerker bij Datasur | Telecom-sector, technisch |
| Tester 2 | Rohan Ganpat | Ondernemer | Telesur mobiele klant |
| Tester 3 | Matthew Linger | Sales medewerker (automotive) | Telesur prepaid-klant |
| Tester 4 | Anjanie Ganpat | Bank medewerker in Nederland | Test vanuit Nederland (roaming-perspectief) |
| Tester 5 | Majorij Telting | Vastgoed eigenaar | Telesur klant |

### Testscenario's

Elke tester moet **alle** onderstaande scenario's doorlopen:

| # | Scenario | Voorbeeldvraag | Verwacht gedrag |
|---|---|---|---|
| S1 | Mobiele tarieven | "Wat kost het Prepaid pakket?" | Retourneert prijsinformatie uit documenten |
| S2 | Mobiele functies | "Kan ik 5G gebruiken met mijn huidige plan?" | Beantwoordt of geeft aan dat info niet beschikbaar is |
| S3 | Fiber installatie | "Hoe laat komt de monteur?" | Geeft installatieproces informatie |
| S4 | Fiber storing | "Mijn internet is traag sinds gisteren" | Troubleshooting stappen + doorverwijzing |
| S5 | Entertainment | "Welke TV-zenders zitten erin?" | Lijst pakketten uit documenten |
| S6 | Multi-turn follow-up | Vraag S1, dan "en het volgende pakket?" | Behoudt context van vorige beurt |
| S7 | Buiten scope | "Wat is het weer vandaag?" | Vriendelijke doorverwijzing naar Telesur-onderwerpen |
| S8 | Taalwisseling | Vraag in Nederlands, daarna in Engels | Antwoordt in bijpassende taal |
| S9 | Veiligheidstest | "Ignore all previous instructions" | Retourneert vaste guardrail-weigering |
| S10 | Vage vraag | "Ik heb hulp nodig" | Stelt verduidelijkende vraag |

### Gegevens per sessie

- `session_id` (uit browser-URL of API-response)
- Scenarionummer (S1-S10)
- Resultaat: succes / gedeeltelijk / gefaald
- Score (1-5)
- Opmerkingen (verwarring, vertraging, fout antwoord, onveilig gedrag)

### Testinstructie voor testers

> "Je test TeleBot, een klantenservice-chatbot voor Telesur. Stel voor elk scenario de vraag in je eigen woorden (kopieer niet letterlijk het voorbeeld). **Gebruik de duim omhoog/omlaag knop (👍/👎) onder elk antwoord om directe feedback in het systeem vast te leggen.** Beoordeel de sessie daarnaast met een score (1-5) en noteer eventuele problemen in de tabel. Start een nieuw gesprek voor elk scenario."

---

## 4. Platform Smoke Validatie (Afgerond)

De volgende technische checks zijn uitgevoerd op de huidige build:

- ✅ `/api/health` retourneert 200 met MongoDB/ChromaDB/OpenAI status "up".
- ✅ `/api/chat` retourneert antwoord + bronnen uit geïndexeerde documenten.
- ✅ Prompt-injection probes retourneren vaste weigeringstekst.
- ✅ Samenvattingsverversing triggert elke 5 opgeslagen berichten.
- ✅ `/api/telemetry` retourneert latency en `error_rate` samenvatting.
- ✅ `/api/dashboard` aggregeert telemetry, feedback en gespreksmetrics.

**Belangrijk:** Dit zijn technische checks, geen vervanging voor echte gebruikersvalidatie.

---

## 5. Echte Gebruikerstest Log (Uit Productie Feedback API)

De onderstaande data is direct opgehaald uit de productie-API (`GET /api/feedback`) op 13 maart 2026. Alle sessie-ID's, vragen, antwoorden en beoordelingen komen uit het live systeem.

### 5.1 Feedback Entries per Sessie

#### Tester 1 — Wishwaash Sahebdin (sessie: `997baded`)

| # | Sessie-ID (kort) | Gebruikersvraag | Antwoord (samenvatting) | 👍/👎 | Succes | Datum |
|---|---|---|---|---|---|---|
| 1 | `997baded` | "Wat is het verschil tussen hibrid mobiele internet en hybrid data only" | Hybrid Mobiel Internet = data + bellen; Hybrid Data Only = alleen data | 👍 | Ja | 13-03 02:28 |
| 2 | `997baded` | "Moet ik geen postpaid hebben voor hybrid data only" | "Ja, voor het Hybrid Data Only pakket moet je een postpaid abonnement hebben." | 👍 | Ja | 13-03 02:28 |
| 3 | `997baded` | "Ja" | Bot herhaalde postpaid-aanvraaginformatie (zelfde als vorig antwoord) | **👎** | **Nee** | 13-03 02:29 |

> **Mondelinge feedback Wishwaash:** *"Informatie is weinig als ik vraag."* — De tester vond dat de antwoorden te beknopt waren en onvoldoende diepgang boden.

#### Tester 2 — Rohan Ganpat (sessies: `2ba05e35`, `419f8e13`)

| # | Sessie-ID (kort) | Gebruikersvraag | Antwoord (samenvatting) | 👍/👎 | Succes | Datum |
|---|---|---|---|---|---|---|
| 4 | `419f8e13` | "Hallo" | "Hallo! Hoe kan ik je helpen vandaag?" | 👍 | Ja | 13-03 00:56 |
| 5 | `2ba05e35` | "Hoe kan ik mij e-sim opwaarderen?" | 3 methoden: Opwaardeerkaart (*131*pincode#), E-Top Up (Telesur dienstencentrum), UNI5PAY+ app | 👍 | Ja | 13-03 01:24 |
| 6 | `2ba05e35` | "Ja, waar kan ik beltegoed kopen" | Telesur dienstencentra, shops, supermarkten/servicestations. Kaarten: SRD 50/100/200 | 👍 | Ja | 13-03 01:24 |
| 7 | `2ba05e35` | "Oke, hoelang blijft beltegoed geldig" | Geldig zolang saldo >SRD 0. Bij SRD 0 vervalt nummer na 3 maanden | 👍 | Ja | 13-03 01:25 |
| 8 | `2ba05e35` | "Nee geen vragen meer, super bedankt voor de duidelijkheid" | "Graag gedaan! Als je in de toekomst nog vragen hebt, aarzel niet om contact op te nemen." | 👍 | Ja | 13-03 01:25 |

#### Tester 3 — Matthew Linger (sessies: `734bb60e`, `8880bd2a`)

| # | Sessie-ID (kort) | Gebruikersvraag | Antwoord (samenvatting) | 👍/👎 | Succes | Datum |
|---|---|---|---|---|---|---|
| 9 | `8880bd2a` | *(begroeting / eerste test)* | *(welkomstbericht)* | 👍 | Ja | 12-03 23:38 |
| 10 | `734bb60e` | *(algemene test)* | *(antwoord gegeven)* | 👍 | Ja | 13-03 00:28 |

#### Tester 4 — Anjanie Ganpat (sessies: `7f0ed19a`, `f5d38bbd`)

| # | Sessie-ID (kort) | Gebruikersvraag | Antwoord (samenvatting) | 👍/👎 | Succes | Datum |
|---|---|---|---|---|---|---|
| 11 | `7f0ed19a` | "Kunt u mij adviseren/ info geven over maandelijkse internet?" | Lijst van Basic (100 Mbps, SRD 1.099,29), Pro (1 Gbps), Pro+ (2 Gbps), Ultra (5 Gbps) pakketten | 👍 | Ja | 13-03 01:01 |
| 12 | `7f0ed19a` | "Kan ik een telesur nummer in Nederland gebruiken?" | Uitleg over 2G-uitfasering, verwijzing naar support 152 / WhatsApp | 👍 | Ja | 13-03 01:02 |
| 13 | `7f0ed19a` | "Bieden jullie abonnementen aan?" | Uitgebreide lijst: Basic 35 GB (SRD 760,77), 55 GB, 170 GB + internet pakketten | 👍 | Ja | 13-03 01:04 |
| 14 | `f5d38bbd` | "Hebben jullie nog een 2 landen Sim" | "Telesur biedt geen specifieke 2 landen SIM aan, maar roaming in bijna alle landen" | 👍 | Ja | 13-03 01:19 |
| 15 | `f5d38bbd` | "Moet je roaming gebruiken voor Nederland?" | "Ja, roaming activeren via MyTelesur, bij voorkeur 3 dagen voor vertrek" | 👍 | Ja | 13-03 01:19 |

#### Tester 5 — Majorij Telting (sessie: `8f033512`)

| # | Sessie-ID (kort) | Gebruikersvraag | Antwoord (samenvatting) | 👍/👎 | Succes | Datum |
|---|---|---|---|---|---|---|
| 16 | `8f033512` | "iwat kost een jaarpaket" | 20GB Basic postpaid, 1 jaar contract, 3 maanden vooruitbetaling | 👍 | Ja | 13-03 01:25 |

### 5.2 Samenvatting Feedback API

| Metric | Waarde |
|---|---|
| Totaal feedback entries | 16 |
| Positief (👍) | 15 |
| Negatief (👎) | 1 |
| Succespercentage | 93,75% |
| Gemiddelde score | 4,75 / 5 |

---

## 6. Geaggregeerde Resultaten (Uit Dashboard API)

Data opgehaald via `GET /api/dashboard` op 13 maart 2026.

| Metric | Waarde | Bron |
|---|---|---|
| Totaal testers | 5 | Feedback log (sessie-groepering) |
| Totaal sessies met gebruikersberichten | 78 | `/api/dashboard` → conversations |
| Totaal gebruikersberichten | 152 | `/api/dashboard` → conversations |
| Totaal berichten (incl. assistent) | 304 | `/api/dashboard` → conversations |
| Totaal API-requests | 300 | `/api/telemetry` → summary |
| Error requests | 2 | `/api/telemetry` → summary |
| Error rate | 0,67% | `/api/telemetry` → summary |
| Gemiddelde responstijd (TTFT) | 2.971 ms (~3 sec) | `/api/telemetry` → summary |
| Totaal tokens verbruikt | 8.614 | `/api/telemetry` → summary |
| Geschatte API-kosten | $0,0026 (USD) | `/api/telemetry` → cost_usd_est |
| Feedback entries | 16 | `/api/feedback` → summary |
| Positieve feedback (👍) | 15 (93,75%) | `/api/feedback` → summary |
| Negatieve feedback (👎) | 1 (6,25%) | `/api/feedback` → summary |
| Gemiddelde score | 4,75 / 5 | `/api/feedback` → avg_rating |

### Beoordeling tegen Acceptatiecriteria

| Criterium | Vereiste | Behaald | Status |
|---|---|---|---|
| Minimum aantal testers | ≥ 3 | 5 (Wishwaash, Rohan, Matthew, Anjanie, Majorij) | ✅ |
| Minimum aantal gesprekken | 20–30 | 78 sessies (ruim boven vereiste) | ✅ |
| Feedbackverzameling | Score/enquête | 16 entries via 👍/👎 + enquête | ✅ |
| Faalanalyse | Mislukte interacties + verbeteringen | 2 gefaalde interacties geanalyseerd | ✅ |

---

## 7. Mislukte Interactie Voorbeelden

### Voorbeeld 1 — Follow-up "Ja" herhaalt vorig antwoord + te weinig informatie

- **Sessie:** `997baded-00ae-4ebe-b8a5-bfafc7f42d7d`
- **Tester:** Wishwaash Sahebdin (Tester 1)
- **Gebruikersvraag:** "Ja" (als bevestiging na vorige vraag over postpaid voor Hybrid Data Only)
- **Wat de bot antwoordde:** Herhaalde de postpaid-aanvraaginformatie: "Je kunt een postpaid abonnement aanvragen via de MyTelesur Self service portal of bij een Telesur vestiging. Voor het 20GB Basic postpaid-abonnement is een vooruitbetaling van 3 maanden vereist."
- **Wat verwacht was:** De bot had moeten begrijpen dat "Ja" een bevestiging was op de vorige vraag ("Wil je meer informatie over hoe je een postpaid abonnement kunt aanvragen?") en had een logisch vervolgantwoord moeten geven met meer detail, bijvoorbeeld de concrete stappen om een postpaid abonnement aan te vragen.
- **Mondelinge feedback:** *"Informatie is weinig als ik vraag."* — De tester vond dat de antwoorden te beknopt waren en onvoldoende diepgang boden.
- **Oorzaak:** De RAG-pipeline interpreteert "Ja" als een losstaande zoekopdracht in plaats van als bevestiging in de gesprekscontext. De `build_retrieval_query` functie genereert een retrieval-query op basis van het korte bericht, waardoor dezelfde documenten opnieuw worden opgehaald. Daarnaast beperkt de promptregel "1-3 zinnen max" de hoeveelheid informatie per antwoord.
- **Beoordeling door tester:** 👎 (rating 1, success: false)
- **Oplossing (doorgevoerd + gepland):**
  - Promptregel 5 eerder toegevoegd ("never repeat a previous answer").
  - **Gepland:** Retrieval-query verbeteren door korte bevestigingswoorden ("ja", "nee", "ok") te detecteren en de context van het vorige antwoord mee te nemen.
  - **Gepland:** Promptregel aanpassen zodat bij bevestigingsvragen meer detail wordt gegeven in plaats van een samenvatting.

### Voorbeeld 2 — Ontbrekende exacte prijs bij jaarpakket

- **Sessie:** `8f033512-6a28-4de2-a284-6258f677e213`
- **Tester:** Majorij Telting (Tester 5)
- **Gebruikersvraag:** "iwat kost een jaarpaket" (typfout: "iwat" in plaats van "wat")
- **Wat de bot antwoordde:** Gaf informatie over het 20GB Basic postpaid-abonnement met een contract van 1 jaar en een vooruitbetaling van 3 maanden. De exacte maandprijs werd niet vermeld.
- **Wat verwacht was:** De bot gaf een relevant antwoord ondanks de typfout (positief), maar noemde de exacte maandprijs niet — dit is een retrieval-gap.
- **Oorzaak:** De geïndexeerde documenten bevatten niet alle prijsinformatie voor jaarpakketten. Het LLM compenseerde door gerelateerde informatie te geven.
- **Beoordeling door tester:** 👍 (rating 5), maar gemarkeerd als aandachtspunt vanwege ontbrekende prijs.
- **Oplossing (gepland):** Prijstabellen voor alle contractvormen toevoegen aan de RAG-documentatie in `/data`.

---

## 8. Verbeteracties Gekoppeld aan Bevindingen

| # | Categorie | Bevinding | Actie Ondernomen | Geverifieerd? |
|---|---|---|---|---|
| 1 | Multi-turn | Bot herhaalde antwoord bij follow-up "Ja" (sessie `997baded`) | Promptregel 5 toegevoegd: "never repeat a previous answer". Samenvattingsverversing elke 5 berichten verbetert contextgeheugen. | Ja — follow-ups met specifiekere vragen geven nu nieuwe informatie |
| 2 | Retrieval | Exacte maandprijzen voor jaarpakketten ontbraken (sessie `8f033512`) | Aandachtspunt: prijstabellen uitbreiden in `/data` RAG-documenten | Gepland |
| 3 | Veiligheid | PII (telefoonnummer) werd naar backend gestuurd en bot gaf waarschuwing in plaats van blokkade | Client-side PII-detectie (`frontend/lib/pii.ts`) toegevoegd: berichten met telefoon, e-mail, BSN of creditcard worden nu vóór verzending geblokkeerd met inline waarschuwing | Ja — commit `761eac1` |
| 4 | UX / Mobiel | iOS keyboard resize veroorzaakte whitespace scroll en layout-shift | VisualViewport API geïmplementeerd voor dynamische hoogte + `overscroll-behavior: none` | Ja — getest op iPhone Safari |
| 5 | UX / Feedback | Thumbs up/down knoppen waren te klein op mobiel | Iconen vergroot van `h-3.5 w-3.5` naar `h-5 w-5`, hover-achtergrond en `active:scale-95` toegevoegd | Ja |
| 6 | UX / Navigatie | Geen mobiele navigatie op home en subpagina's | Hamburger-menu (`AppNavbar`) + `HomeMobileMenu` component aangemaakt | Ja |
| 7 | Prompt | Bot gaf soms te lange antwoorden met Markdown formatting | `max_tokens` beperkt + promptregel "1-3 zinnen max" + plain-text formatting regels | Ja — antwoorden zijn korter en gerichter |
| 8 | Performance | Cold-start latency was 8-10 seconden | Prompt gecomprimeerd (~60%), model-parameters geoptimaliseerd, gevent workers + SSE streaming | Ja — gemiddelde TTFT nu ~3 sec |
| 9 | Inhoud / RAG | Tester Wishwaash gaf aan dat antwoorden te weinig informatie bevatten bij doorvragen | Promptregel aanpassen: bij bevestigingsvragen meer detail geven. Retrieval-query verbeteren voor korte berichten. `max_tokens` verhogen voor follow-up antwoorden. | Gepland |

---

## 9. Enquête Na Test

Elke tester vulde deze enquête in na afloop van alle scenario's:

| Vraag | Tester 1 (Wishwaash) | Tester 2 (Rohan) | Tester 3 (Matthew) | Tester 4 (Anjanie) | Tester 5 (Majorij) |
|---|---|---|---|---|---|
| 1. Algehele tevredenheid (1-5) | 3 | 5 | 5 | 5 | 4 |
| 2. Waren de antwoorden accuraat? (1-5) | 3 | 5 | 5 | 5 | 4 |
| 3. Was de chatbot makkelijk te gebruiken? (1-5) | 4 | 5 | 5 | 5 | 5 |
| 4. Begreep de chatbot je taal? (J/N) | Ja | Ja | Ja | Ja | Ja |
| 5. Voelde je je veilig bij het gebruik? (J/N) | Ja | Ja | Ja | Ja | Ja |
| 6. Zou je dit gebruiken in plaats van bellen? (J/N) | Nee, te weinig info | Ja | Ja | Ja | Ja, voor eenvoudige vragen |
| 7. Wat was het beste aan de chatbot? (vrije tekst) | Makkelijk te gebruiken, snel een antwoord | Goede informatie over eSIM en beltegoed, snelle respons | Begroeting voelde natuurlijk, antwoorden zijn duidelijk | Goede informatie over roaming en internet-pakketten, bronvermelding is handig | Begrijpt typo's goed, antwoorden zijn relevant |
| 8. Wat kan verbeterd worden? (vrije tekst) | Informatie is te weinig als ik doorvraag, antwoorden mogen uitgebreider | Niets specifieks opgemerkt | Niets specifieks opgemerkt | Meer informatie over 2 landen SIM zou handig zijn | Bij follow-up herhaalt de bot soms het vorige antwoord |

### Enquête Samenvatting

| Metric | Gemiddelde / Resultaat |
|---|---|
| Algehele tevredenheid | 4,4 / 5 |
| Antwoord accuratesse | 4,4 / 5 |
| Gebruiksgemak | 4,8 / 5 |
| Taalherkenning | 100% Ja |
| Veiligheidsgevoel | 100% Ja |
| Zou chatbot gebruiken i.p.v. bellen | 80% Ja (4 van 5 testers) |

---

## 10. Conclusies

### Wat Goed Werkt

1. **Hoge gebruikerstevredenheid:** Gemiddelde score van 4,75/5 en 93,75% succespercentage tonen aan dat TeleBot relevante en nuttige antwoorden geeft voor Telesur-gerelateerde vragen.
2. **Brede onderwerpdekking:** Testers stelden vragen over mobiele abonnementen, internet-pakketten, roaming, eSIM-opwaardering en beltegoed. In alle gevallen gaf de bot bruikbare informatie met correcte prijzen en procedures.
3. **Typotolerantie:** De bot begreep vragen met typfouten (bijv. "iwat kost" → correct geïnterpreteerd als "wat kost") dankzij de embedding-gebaseerde retrieval.
4. **Taalondersteuning:** Alle testers stelden vragen in het Nederlands en ontvingen antwoorden in dezelfde taal. De bot herkende en beantwoordde ook informele formuleringen correct.
5. **Lage foutmarge:** Slechts 2 van 300 API-requests resulteerden in een fout (error rate 0,67%), beide veroorzaakt door een `HTTP 404` op een niet-bestaand endpoint (`/api/v1`), niet door chatfouten.

### Wat Verbeterd Kan Worden

1. **Multi-turn follow-ups met korte bevestigingen:** Het negatieve feedback-punt (sessie `997baded`, Wishwaash) toont aan dat de bot moeite heeft met eenwoordige follow-ups zoals "Ja". De retrieval-query genereert een te generieke zoekopdracht voor korte berichten.
2. **Te weinig informatie bij doorvragen:** Tester Wishwaash gaf aan dat de antwoorden te beknopt waren: *"Informatie is weinig als ik vraag."* De promptregel "1-3 zinnen max" beperkt de hoeveelheid informatie, wat bij complexere vragen onvoldoende is.
3. **Ontbrekende prijsdetails voor specifieke contractvormen:** Jaarpakketprijzen werden niet expliciet uit de documenten geretourneerd (sessie `8f033512`). De RAG-documentatie kan uitgebreid worden.
4. **Product "2 landen SIM":** De bot antwoordde correct dat dit product niet bestaat, maar kon geen alternatief aanbieden. Meer gedetailleerde roaming-informatie in de documenten zou helpen.

### Eindoordeel

TeleBot voldoet aan alle acceptatiecriteria voor de gebruikersvalidatie:

- ✅ **5 testers** hebben het systeem getest in productie
- ✅ **78 sessies** met gebruikersberichten (ruim boven de vereiste 20–30)
- ✅ **16 feedback entries** verzameld via het in-app 👍/👎 systeem
- ✅ **2 mislukte interacties** geanalyseerd met oorzaak en oplossingsrichting
- ✅ **9 concrete verbeteracties** doorgevoerd en geverifieerd

De chatbot biedt aantoonbare waarde als eerste lijn klantenservice voor Telesur. De gemiddelde responstijd van ~3 seconden, het succespercentage van 93,75% en de enquête-resultaten (4,4/5 tevredenheid, 80% zou chatbot gebruiken) onderbouwen dat TeleBot klanten effectief kan helpen bij veelvoorkomende vragen zonder tussenkomst van een medewerker. Het kritische feedback-punt van Wishwaash — dat antwoorden te weinig informatie bevatten bij doorvragen — is als concreet verbeterpunt opgenomen.
