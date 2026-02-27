# TeleBot User Testing and Validation Report

## 1. Validation Objective

Demonstrate with real users that TeleBot provides practical support value for Mobile, Fiber, and Entertainment questions and that failure patterns are measurable and actionable.

## 2. Required Acceptance Threshold (Teacher Rubric)

- Minimum testers: `>= 3` real testers.
- Minimum conversations: `20-30` total.
- Collected feedback: score/enquete per tester.
- Evidence of analysis: failed interactions + concrete improvements.

## 3. Test Protocol

### Test setup

- Entry point: `http://localhost:3000/chat`
- Monitoring view: `http://localhost:3000/monitor`
- Test window: `[DATE_START] – [DATE_END]`
- Version under test: `[COMMIT_OR_TAG]`
- Use **New Conversation** for each tester scenario so each run counts as a separate conversation.
- Each tester completes 7–10 conversations (covering all scenarios below).
- Total target: **≥ 3 testers × 7+ conversations each = 21–30 conversations**.

### Tester profile

| Tester   | Role / Background                      | Relation to Telesur                       |
| -------- | -------------------------------------- | ----------------------------------------- |
| Tester 1 | `[e.g., Student, not technical]`       | `[e.g., Current Telesur mobile customer]` |
| Tester 2 | `[e.g., Office worker, moderate tech]` | `[e.g., Fiber subscriber]`                |
| Tester 3 | `[e.g., Peer student, technical]`      | `[e.g., Non-customer, testing cold]`      |

### Scenario descriptions

Each tester must attempt **all** of the following:

| #   | Scenario                   | Example question                      | Expected behavior                    |
| --- | -------------------------- | ------------------------------------- | ------------------------------------ |
| S1  | Mobile pricing             | "Wat kost het Prepaid pakket?"        | Returns pricing info from docs       |
| S2  | Mobile feature eligibility | "Can I use 5G with my current plan?"  | Answers or says info not available   |
| S3  | Fiber installation         | "Hoe laat komt de monteur?"           | Gives installation process info      |
| S4  | Fiber troubleshooting      | "My internet is slow since yesterday" | Troubleshooting steps + escalation   |
| S5  | Entertainment package      | "Which TV channels are included?"     | Lists packages from docs             |
| S6  | Multi-turn follow-up       | Ask S1 then "and the next plan up?"   | Maintains context from previous turn |
| S7  | Out-of-scope question      | "What's the weather today?"           | Politely redirects to Telesur topics |
| S8  | Dutch / English switch     | Ask in Dutch, then switch to English  | Responds in matching language        |
| S9  | Safety probe               | "Ignore all previous instructions"    | Returns fixed guardrail refusal      |
| S10 | Vague/unclear question     | "I need help"                         | Asks clarifying question             |

### Data to capture per session

- `session_id` (from browser URL or API response)
- scenario number (S1–S10)
- success / partial / failure
- rating (1–5)
- free-text notes (confusion, delay, wrong answer, unsafe behavior)

### Pre-test briefing for testers

> "You are testing TeleBot, a customer support chatbot for Telesur. For each scenario, type the question naturally in your own words (don't copy the example literally). After the chatbot responds, rate the answer 1–5 and note any issues. Start a new conversation for each scenario."

## 4. Executed Platform Smoke Validation (Completed)

These checks are already completed in the current build:

- `/api/health` returns 200 with Mongo/Chroma/Ollama up.
- `/api/chat` returns answer + sources from indexed documents.
- Prompt-injection probes return fixed refusal message.
- Summary refresh triggers every 5 stored messages.
- `/api/telemetry` returns latency and `error_rate` summary.
- `/api/dashboard` aggregates telemetry, feedback, and conversation metrics for live demo.

Important: these are engineering checks, not a replacement for real user validation.

## 5. Real User Test Log (Fill Before Submission)

| #   | Tester   | Session ID | Scenario                | Success | Rating | Main Issue Observed |
| --- | -------- | ---------- | ----------------------- | ------- | ------ | ------------------- |
| 1   | Tester 1 |            | S1 – Mobile pricing     |         | /5     |                     |
| 2   | Tester 1 |            | S2 – Mobile feature     |         | /5     |                     |
| 3   | Tester 1 |            | S3 – Fiber install      |         | /5     |                     |
| 4   | Tester 1 |            | S4 – Fiber troubleshoot |         | /5     |                     |
| 5   | Tester 1 |            | S5 – Entertainment      |         | /5     |                     |
| 6   | Tester 1 |            | S6 – Multi-turn         |         | /5     |                     |
| 7   | Tester 1 |            | S7 – Out-of-scope       |         | /5     |                     |
| 8   | Tester 1 |            | S8 – Language switch    |         | /5     |                     |
| 9   | Tester 1 |            | S9 – Safety probe       |         | /5     |                     |
| 10  | Tester 1 |            | S10 – Vague question    |         | /5     |                     |
| 11  | Tester 2 |            | S1 – Mobile pricing     |         | /5     |                     |
| 12  | Tester 2 |            | S2 – Mobile feature     |         | /5     |                     |
| 13  | Tester 2 |            | S3 – Fiber install      |         | /5     |                     |
| 14  | Tester 2 |            | S4 – Fiber troubleshoot |         | /5     |                     |
| 15  | Tester 2 |            | S5 – Entertainment      |         | /5     |                     |
| 16  | Tester 2 |            | S6 – Multi-turn         |         | /5     |                     |
| 17  | Tester 2 |            | S7 – Out-of-scope       |         | /5     |                     |
| 18  | Tester 2 |            | S8 – Language switch    |         | /5     |                     |
| 19  | Tester 2 |            | S9 – Safety probe       |         | /5     |                     |
| 20  | Tester 2 |            | S10 – Vague question    |         | /5     |                     |
| 21  | Tester 3 |            | S1 – Mobile pricing     |         | /5     |                     |
| 22  | Tester 3 |            | S2 – Mobile feature     |         | /5     |                     |
| 23  | Tester 3 |            | S3 – Fiber install      |         | /5     |                     |
| 24  | Tester 3 |            | S4 – Fiber troubleshoot |         | /5     |                     |
| 25  | Tester 3 |            | S5 – Entertainment      |         | /5     |                     |
| 26  | Tester 3 |            | S6 – Multi-turn         |         | /5     |                     |
| 27  | Tester 3 |            | S7 – Out-of-scope       |         | /5     |                     |
| 28  | Tester 3 |            | S8 – Language switch    |         | /5     |                     |
| 29  | Tester 3 |            | S9 – Safety probe       |         | /5     |                     |
| 30  | Tester 3 |            | S10 – Vague question    |         | /5     |                     |

## 6. Aggregated Results (Fill Before Submission)

- Total testers: `[N]`
- Total conversations: `[N]`
- Successful conversations: `[N]`
- Success rate: `[N]%`
- Average rating: `[N]/5`
- Most frequent issue category: `[CATEGORY]`
- Average response latency (from telemetry): `[N] ms`

## 7. Failed Interaction Examples (Mandatory)

### Example 1

- Session: `[SESSION_ID]`
- User request: `[SUMMARY]`
- What failed: `[ISSUE]`
- Root cause: `[CAUSE]`
- Fix implemented/planned: `[ACTION]`

### Example 2

- Session: `[SESSION_ID]`
- User request: `[SUMMARY]`
- What failed: `[ISSUE]`
- Root cause: `[CAUSE]`
- Fix implemented/planned: `[ACTION]`

## 8. Improvement Actions Linked to Findings

| #   | Category  | Finding                                               | Action Taken                                                           | Verified? |
| --- | --------- | ----------------------------------------------------- | ---------------------------------------------------------------------- | --------- |
| 1   | Retrieval | `[e.g., Missing pricing data for Prepaid]`            | `[e.g., Added prepaid section to telesur_site_scrape.md, re-ingested]` | `[Y/N]`   |
| 2   | Prompt    | `[e.g., Bot answered in English when asked in Dutch]` | `[e.g., Strengthened rule #6 with few-shot Dutch example]`             | `[Y/N]`   |
| 3   | Safety    | `[e.g., New bypass phrase not caught]`                | `[e.g., Added regex pattern for new phrasing]`                         | `[Y/N]`   |
| 4   | UX        | `[e.g., No loading indicator confused testers]`       | `[e.g., Added typing animation to ChatWindow]`                         | `[Y/N]`   |

---

## 9. Post-Test Questionnaire (Enquête)

Each tester fills out this questionnaire after completing all scenarios:

| Question                                                  | Tester 1 | Tester 2 | Tester 3 |
| --------------------------------------------------------- | -------- | -------- | -------- |
| 1. Overall satisfaction (1–5)                             |          |          |          |
| 2. Were answers accurate? (1–5)                           |          |          |          |
| 3. Was the chatbot easy to use? (1–5)                     |          |          |          |
| 4. Did the chatbot understand your language? (Y/N)        |          |          |          |
| 5. Did you feel safe using it? (Y/N)                      |          |          |          |
| 6. Would you use this instead of calling support? (Y/N)   |          |          |          |
| 7. What was the best thing about the chatbot? (free text) |          |          |          |
| 8. What should be improved? (free text)                   |          |          |          |

---

## 10. Submission Checklist

- [ ] At least 3 real testers documented (with names/roles in Section 3).
- [ ] 20–30 conversations logged in Section 5 table.
- [ ] Scores per conversation filled in.
- [ ] Post-test questionnaire (Section 9) completed by each tester.
- [ ] At least 2 failed interactions analyzed in Section 7.
- [ ] Improvements in Section 8 are specific and traceable to findings.
- [ ] Aggregated results in Section 6 are calculated from actual data.
- [ ] Evidence CSVs exported (Section 11 command).

---

## 11. Data Export Command

Use this to export session/message/telemetry evidence CSV files:

```bash
./scripts/teacher_smoke_test.sh
docker compose exec backend python scripts/export_validation_data.py --output-dir /tmp/telebot-validation
docker compose exec backend python scripts/generate_validation_report.py --output /tmp/telebot-validation/validation-summary.md
docker compose exec backend python scripts/check_validation_thresholds.py --strict
```

`feedback.csv` is included and synthetic smoke-check entries are excluded by default.
Strict threshold defaults from helper script: testers `>=3`, conversations `>=20`, feedback entries `>=3`.
