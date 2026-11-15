# Senior Signal Exchange

Build a responsive web app called "Seniors' Wisdom", a platform where college seniors share tips about courses, professors and placements, and juniors ask questions that are answered from those tips. Use React, Tailwind and shadcn/ui. For now use mock data stored in local state; I will connect Supabase and an AI backend later, so keep all data access in a separate file (src/lib/api.ts) with functions like getTips(), submitTip(), askQuestion() that currently return mock data.

DESIGN

- Friendly, modern, student-focused. Clean white/off-white background, one warm accent color (indigo or amber), rounded cards, soft shadows, generous spacing.

- Fully mobile responsive, since most students will use phones. Support dark mode.

- Top navbar with the logo, links to Ask, Browse Tips and Share a Tip, and a dark mode toggle.

PAGES

1. Home (/)

- Hero: headline "Advice from seniors who've been there", subtext "Ask anything about courses, professors and placements. Answers come only from real senior tips."

- A large search box ("How do I prepare for the OS course?") with a button "Ask". Submitting goes to /ask with the question.

- Three clickable example question chips under the search box.

- A small stats row: number of tips, courses covered, and seniors contributing (from mock data).

- Two CTA cards: "I'm a junior, I have questions" and "I'm a senior, I want to share tips".

2. Ask (/ask)

- Chat-style interface. User question appears as a bubble, and the bot answer appears below it with a typing/loading skeleton first.

- Each answer has:

  a) The answer text with short paragraphs or bullets.

  b) A line like "Based on 6 tips from 2023-25" with a freshness badge.

  c) A "Seniors disagree" highlighted callout when tips conflict, showing both sides.

  d) A collapsible "Sources" section listing the tips used, each showing course, tip type, year, and verified badge ("Class of 2025, CSE") or "Anonymous".

  e) Thumbs up/down feedback buttons.

- If no relevant tips exist, show an empty state: "No seniors have shared tips on this yet" with a button "Be the first to contribute" linking to /share.

- Optional filter dropdowns above the chat: Course, Professor, Tip type.

- Follow-up question input stays pinned at the bottom.

3. Browse Tips (/browse)

- Search bar plus filters: course, professor, tip type (Prep, Grading, Placements, Projects, General), year.

- Grid of tip cards: course tag, tip type badge, tip text (truncated with "read more"), year/semester, verified or anonymous badge, upvote button with count, and a small "Report" flag icon.

- Sort by Most helpful or Most recent.

4. Share a Tip (/share)

- Simple form: Course (searchable select), Professor (optional), Tip type, Year and semester, Tip text (textarea with character counter, min 50 chars), checkbox "Post anonymously", checkbox "Show my verified badge".

- Short guidelines box: "Focus on teaching style, exam format and prep strategy. No personal attacks."

- Also a "Bulk paste" tab: a large textarea where seniors can paste old WhatsApp/Notion advice, with a "Process" button that shows a preview list of tips split out (mock this for now), each editable before submitting.

- Success toast and confirmation screen after submitting.

5. Placements (/placements)

- Company cards (e.g. TCS, Infosys, Amazon, Google) with the number of tips.

- Clicking a company opens a detail page with tabs: Rounds, Prep Resources, Interview Experiences, each filled from mock tips.

6. Unanswered Questions (/requests)

- Board of questions juniors asked that had no good answer, with an "I can answer this" button that opens the Share form prefilled with the topic.

MOCK DATA

Create about 25 realistic tips across 6 courses (Operating Systems, DBMS, Data Structures, Computer Networks, Machine Learning, Software Engineering) with different professors, years from 2022 to 2025, and a mix of tip types. Include at least one course where tips contradict each other, to demonstrate the disagreement callout. Create a mock askQuestion() function that picks relevant tips by course keyword and returns a formatted answer plus the source tips.

COMPONENTS TO MAKE REUSABLE

TipCard, AnswerCard, SourcesList, DisagreementCallout, VerifiedBadge, FilterBar, EmptyState.

EXTRAS

- Skeleton loaders, toasts for actions, and basic form validation.

- A simple report-tip dialog with reasons (Personal attack, Spam, Outdated, Incorrect).

- Accessible: keyboard navigable, proper labels, good contrast.

Do not add login yet; just include a placeholder "Sign in" button in the navbar.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/89d6a9cf-1ed1-59ca-9fde-c2f40cf38b7f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## PostgreSQL + pgvector Database Schema

The tips database schema is defined in [db/schema.sql](file:///c:/Users/rishi/senior-signal-exchange/db/schema.sql) with support for pgvector semantic search:

- **Columns**: `id`, `author_id`, `text`, `category` (`'course'`, `'professor'`, `'company'`, `'general'`), `course_code`, `course_name`, `professor`, `company`, `author_batch`, `anonymous`, `embedding vector(1536)`, and `created_at`.
- **Excluded**: `upvotes` and `status` are omitted as per specifications.
- **pgvector**: Stores 1536-dimensional embeddings capturing the composite representation of `(tip, category, course name/code, professor, company)`.
- **HNSW Index & Matching**: Fast cosine distance vector search function `match_tips`.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
