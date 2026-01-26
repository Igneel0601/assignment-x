# Project Reference — assignment (Next.js + MongoDB quiz manager)

> Detailed project documentation generated from repository sources. Includes architecture, API, client components, DB flow, setup, examples, and recommended improvements.

## Table of contents
- Project overview
- Quick start
- Architecture & key files
- Database schema & id flow
- API endpoints (full examples)
- Client components (detailed)
  - `QuizForm.tsx`
  - `QuizTable.tsx`
- Pages (App Router)
- Server helpers
- Error handling & validation
- TypeScript types and runtime shapes
- Testing, linting, deployment
- Recommendations & next steps

---

## Project overview

This repository is a small admin application built on Next.js (App Router), React, and MongoDB. It provides features to create, edit, publish/unpublish and list quizzes. The core concepts:
- MongoDB stores quiz documents in a `quiz` collection.
- Each quiz document has an auto-generated `_id` (MongoDB ObjectId).
- Clients create quizzes via `POST /api/quiz`; the server returns the created id as a string.
- Clients edit quizzes via `PUT /api/quiz/:id` and fetch via `GET /api/quiz/:id`.

The admin UI includes:
- `QuizForm` — a client component for creating/editing quizzes.
- `QuizTable` — lists quizzes with actions (edit, publish).
- App pages under `app/admin/*` to list, create, and edit quizzes.

---

## Quick start

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

Environment variables (example `.env.local`):

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.example.mongodb.net/mydb
NEXTAUTH_SECRET=some-secret"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Quiz {
  _id: string;
  title: string;
  questions: any[];
  createdAt?: string | Date;
  published?: boolean;
}

export default function QuizTable({ initialQuizzes }: { initialQuizzes: Quiz[] }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes || []);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const publish = async (id: string) => {
    const quiz = quizzes.find((q) => q._id === id);
    const currentlyPublished = !!quiz?.published;
    if (!confirm(currentlyPublished ? "Unpublish this quiz?" : "Publish this quiz?")) return;
    setLoadingId(id);
    try {
      const res = await fetch("/api/quiz/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, publish: !currentlyPublished }),
      });

      if (!res.ok) throw new Error(await res.text());

      const body = await res.json();
      setQuizzes((prev) => prev.map((q) => (q._id === id ? { ...q, published: !!body.published } : q)));
      alert(body.published ? "Published" : "Unpublished");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      alert(currentlyPublished ? "Failed to unpublish" : "Failed to publish");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Title</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Questions</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Created</th>
            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y">
          {quizzes.map((q) => (
            <tr key={q._id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{q.title}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{Array.isArray(q.questions) ? q.questions.length : 0}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{q.createdAt ? new Date(q.createdAt).toLocaleString() : "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                <div className="inline-flex items-center gap-2">
                  <Link href={`/admin/edit/${q._id}`} className="text-indigo-600 hover:text-indigo-800">
                    Edit
                  </Link>

                  <button
                    onClick={() => publish(q._id)}
                    disabled={loadingId === q._id}
                    className={`px-3 py-1 rounded-md text-sm ${q.published ? "bg-yellow-100 text-yellow-800" : "bg-blue-600 text-white hover:bg-blue-700"} disabled:opacity-50`}
                  >
                    {loadingId === q._id ? (q.published ? "Updating..." : "Publishing...") : q.published ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

```

---

## Architecture & key files

- `app/api/quiz/route.ts` — POST to create a quiz (returns `insertedId`).
- `app/api/quiz/[id]/route.ts` — GET and PUT for reading/updating an individual quiz (converts path id -> `ObjectId`).
- `components/forms/QuizForm.tsx` — client-side editor and saver with redirect to `/admin` after save.
- `components/QuizTable.tsx` — admin table with publish action that calls `/api/quiz/publish`.
- `lib/mongoClient.ts` — exports `clientPromise` to share a single MongoDB connection.

---

## Database schema & id flow

A quiz document example (MongoDB stored object):

```json
{
  "_id": { "$oid": "64c8f9..." },
  "title": "Sample Quiz",
  "questions": [
    {"id": 1, "question": "...", "options": ["a","b","c","d"], "correctAnswer": 1}
  ],
  "createdAt": "2024-01-01T12:00:00.000Z",
  "published": false
}
```

Flow summary:
1. Client calls `POST /api/quiz` with `title` and `questions`.
2. Server executes `collection.insertOne(doc)`. MongoDB generates `_id` (ObjectId).
3. Server returns `insertedId.toString()` to client.
4. Client uses that string in routes `/admin/edit/:id` and API calls `/api/quiz/:id`.
5. Server-side route takes the path param string and does `new ObjectId(id)` to query/update the DB.

---

## API endpoints (full examples)

### POST /api/quiz — create quiz

Server-side (simplified):

```ts
// app/api/quiz/route.ts
import clientPromise from '../../../lib/mongoClient';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  if (!body || !Array.isArray(body.questions)) {
    return new NextResponse('Invalid payload', { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db();
  const doc = { title: body.title || 'Untitled Quiz', questions: body.questions, createdAt: new Date() };
  const result = await db.collection('quiz').insertOne(doc);
  return NextResponse.json({ insertedId: result.insertedId.toString() }, { status: 201 });
}
```

Client example:

```js
const res = await fetch('/api/quiz', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title, questions }),
});
const data = await res.json();
console.log('new id', data.insertedId);
```

### GET /api/quiz/:id — read quiz

Server-side (important: path param to ObjectId):

```ts
// app/api/quiz/[id]/route.ts
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongoClient';
import { NextResponse } from 'next/server';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // string from path
  const client = await clientPromise;
  const db = client.db();
  const quiz = await db.collection('quiz').findOne({ _id: new ObjectId(id) });
  if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(quiz);
}
```

### PUT /api/quiz/:id — update quiz

```ts
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json();
  const client = await clientPromise;
  const db = client.db();
  await db.collection('quiz').updateOne({ _id: new ObjectId(id) }, { $set: { title: body.title, questions: body.questions, published: body.published } });
  return NextResponse.json({ success: true });
}
```

### POST /api/quiz/publish — toggle publish

Server accepts `{ id, publish }` and sets `published` boolean. The `QuizTable` uses this.

---

## Client components (detailed)

### `components/forms/QuizForm.tsx`

Responsibilities:
- Render an editor for title + list of questions and options.
- Support adding/removing questions, reordering pages of questions via index.
- Save the quiz: create (POST) or update (PUT) depending on `quizId` prop.
- After successful save redirect to `/admin`.

Key implementation notes:
- `"use client"` — must run in client, uses `useState` and `useRouter`.
- When editing, the component receives `initialData` and `quizId`.
- `saveQuiz` should await fetch, check `res.ok`, then `router.push('/admin')`.

Full (representative) snippet:

```tsx
// save function inside QuizForm
const saveQuiz = async () => {
  const quizData = { title, questions };
  const res = await fetch(quizId ? `/api/quiz/${quizId}` : '/api/quiz', {
    method: quizId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quizData),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to save');
  }
  const body = await res.json();
  // if you need the id after create:
  // const newId = body.insertedId ?? body.id;
  router.push('/admin');
};
```

Edge-cases to handle:
- Ensure `questions` is always an array of objects with `options` array.
- Prevent navigation away while saving.
- Validate at least one non-empty question and non-empty options before saving.


### `components/QuizTable.tsx`

Responsibilities:
- Render list of quizzes (prop `initialQuizzes`).
- Provide Edit link that navigates to `/admin/edit/${q._id}`.
- Publish/unpublish action calls `/api/quiz/publish` with `{ id, publish }`.

Representative code:

```tsx
<Link href={`/admin/edit/${q._id}`}>Edit</Link>
<button onClick={() => publish(q._id)}>Publish</button>
```

---

## Pages (App Router)

- `app/admin/page.tsx` — renders `QuizTable`, may fetch quizzes server-side or client-side.
- `app/admin/create/page.tsx` — includes `QuizForm` with no `quizId`.
- `app/admin/edit/[id]/page.tsx` — loads quiz data then renders `QuizForm` with `initialData` and `quizId`.

Example `edit` page client-side loader:

```tsx
"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import QuizCreator from '@/components/forms/QuizForm';

export default function EditQuizPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/quiz/${id}`).then(r => r.json()).then(setQuiz);
  }, [id]);
  if (!quiz) return <div>Loading...</div>;
  return <QuizCreator quizId={id} initialData={{ title: quiz.title, questions: quiz.questions ?? [] }} />;
}
```

---

## Server helpers

`lib/mongoClient.ts` should export a single connection promise and respect serverless limitations (reuse client across hot reloads):

```ts
import { MongoClient } from 'mongodb';
const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;
if (!uri) throw new Error('MONGODB_URI missing');
client = new MongoClient(uri);
clientPromise = client.connect();
export default clientPromise;
```

(You may use a global cached client in development to avoid multiple connections.)

---

## Error handling & validation

Server-side recommendations:
- Validate incoming JSON shape for POST/PUT (check `questions` is array, each question has `question`, `options` with 2-6 strings, `correctAnswer` index in range).
- Validate `id` strings before converting to `ObjectId`: catch invalid ObjectId errors and return 400.

Client-side recommendations:
- Display helpful validation messages before sending request.
- Disable Save button while request in progress.

Example server-side `id` validation:

```ts
import { ObjectId } from 'mongodb';
function isValidObjectId(id: string) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}
if (!isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
```

---

## TypeScript types and runtime shapes

Define shared types (e.g., `types/quiz.ts`) to keep client and server in sync:

```ts
export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}
export interface Quiz {
  _id?: string;
  title: string;
  questions: Question[];
  createdAt?: string;
  published?: boolean;
}
```

---

## Testing, linting, deployment

- Lint: `pnpm lint` (uses ESLint configured in repo).
- Test: Add unit tests for API handlers (node test runner or jest) mocking `mongodb`.
- Deployment: Host on Vercel for seamless Next.js support. Set `MONGODB_URI` in environment on the host.

---

## Recommendations & next steps

1. Add server validation & robust error messages.
2. Return normalized IDs in API responses: include both `id` and `_id` (or map `_id` -> `id`).
   - Example: `return NextResponse.json({ id: result.insertedId.toString() })`.
3. Harden `QuizForm` validation (non-empty question text and options, correctAnswer in range).
4. Add tests for the API and client flows.
5. Add pagination and server-side listing for admin table.
6. Consider rate limiting and authentication (NextAuth is present in the repo).

---

## Where this file is saved
- Project root: `ai.md`

If you want, I can also:
- Include full verbatim source for a list of files (e.g., `lib/mongoClient.ts`, `app/api/quiz/route.ts`, `components/forms/QuizForm.tsx`) inside `ai.md`.
- Produce a condensed `README.md` or a developer `CONTRIBUTING.md` from this content.

