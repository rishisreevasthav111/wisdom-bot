# Database Connection & Setup Guide

This guide walks through setting up **PostgreSQL with `pgvector`** and connecting it to the Seniors' Wisdom app.

---

## 1. Prerequisites & Running the Web App

### Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```
   *(or `bun install` if using Bun)*

2. **Create your `.env` file**:
   ```bash
   cp .env.example .env
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 2. Setting Up PostgreSQL with pgvector

You can choose either **Supabase (Cloud)** or **Local Docker**.

### Option A: Supabase (Recommended)

Supabase provides hosted PostgreSQL with `pgvector` enabled out of the box.

1. **Create a project**:
   * Go to [supabase.com](https://supabase.com) and create a free project.

2. **Execute the Schema**:
   * In the Supabase Dashboard, go to **SQL Editor**.
   * Open [db/schema.sql](file:///c:/Users/rishi/senior-signal-exchange/db/schema.sql), copy its contents, paste into the SQL editor, and click **Run**.
   * Next, open [db/seed.sql](file:///c:/Users/rishi/senior-signal-exchange/db/seed.sql), paste and click **Run** to load initial sample rows.

3. **Grab your API Keys**:
   * In Dashboard -> **Project Settings** -> **API**:
     * Copy **Project URL** -> `VITE_SUPABASE_URL`
     * Copy **anon/public key** -> `VITE_SUPABASE_ANON_KEY`

4. **Paste into `.env`**:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

---

### Option B: Local Docker with pgvector

If you prefer running a local database without cloud dependencies:

1. **Run the pgvector Docker container**:
   ```bash
   docker run -d \
     --name seniors-pg \
     -p 5432:5432 \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=seniors_wisdom \
     pgvector/pgvector:pg16
   ```

2. **Run schema and seed files**:
   ```bash
   psql -h localhost -p 5432 -U postgres -d seniors_wisdom -f db/schema.sql
   psql -h localhost -p 5432 -U postgres -d seniors_wisdom -f db/seed.sql
   ```

---

## 3. Connecting the App to the Database

The application encapsulates all data access in [src/lib/api.ts](file:///c:/Users/rishi/senior-signal-exchange/src/lib/api.ts).

### Using the Supabase Client

When you install `@supabase/supabase-js`:
```bash
npm install @supabase/supabase-js
```

Initialize the client in `src/lib/supabase.ts`:
```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
```

And in `src/lib/api.ts`, query the `tips` table directly:

```ts
// Example: Storing a tip in PostgreSQL with pgvector
export async function submitTipToDb(tip: NewTipInput) {
  if (!supabase) return submitTipMock(tip); // Fallback to mock

  const embedding = generateTipEmbedding({
    text: tip.text,
    category: tip.category,
    course_code: tip.course_code,
    professor: tip.professor,
    company: tip.company,
  });

  const { data, error } = await supabase
    .from("tips")
    .insert({
      text: tip.text,
      category: tip.category,
      course_code: tip.course_code,
      course_name: tip.course_name,
      professor: tip.professor,
      company: tip.company,
      author_batch: tip.author_batch,
      anonymous: tip.anonymous,
      embedding,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

```ts
// Example: Semantic vector similarity search via match_tips()
export async function searchTipsSemantic(queryText: string) {
  if (!supabase) return [];

  const queryEmbedding = generateTipEmbedding({ text: queryText });

  const { data, error } = await supabase.rpc("match_tips", {
    query_embedding: queryEmbedding,
    match_threshold: 0.3,
    match_count: 5,
  });

  if (error) throw error;
  return data;
}
```
