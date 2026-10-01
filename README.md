# Study Companion

This is one of the first full-stack projects I built while I was learning how to code seriously.

The idea was simple: instead of studying from a static page, create a subject-specific AI tutor you can actually talk to.

A user can create a “companion” for a topic, choose its subject and teaching style, and launch a voice session with it. The app keeps track of companions and recent study sessions so the experience feels more like returning to a tutor than opening a generic chatbot.

## Why I keep this project public

The code is not as polished as the things I build now — and that is partly why I like keeping it here.

There are verbose comments, rough edges, and decisions I would make differently today. But this was one of the projects where concepts like server actions, authentication, databases, API integrations, and typed React components stopped being abstract and became things I could actually assemble into a working product.

It is a useful snapshot of where I started.

## What it does

- create subject-specific AI study companions,
- browse and filter companions by subject/topic,
- launch voice-based tutoring sessions,
- store companions and session history,
- authenticate users,
- show recently completed sessions,
- gate companion creation based on account permissions.

## Stack

I built it with:

- **Next.js 15 / React 19**
- **TypeScript**
- **Supabase** for companion and session data
- **Clerk** for authentication and account permissions
- **Vapi** for real-time voice interaction
- **Sentry** for error monitoring
- **Tailwind CSS** for the UI

## Basic flow

```text
create a companion
       ↓
choose subject / topic / voice
       ↓
save to Supabase
       ↓
launch lesson
       ↓
voice conversation through Vapi
       ↓
store session history
```

## Repository structure

```text
app/            # Next.js routes and pages
components/     # cards, forms, voice-session UI
lib/
├── action/     # server actions / Supabase queries
├── supbase.ts  # database client
├── utils.ts    # assistant configuration + helpers
└── vapi.sdk.ts # voice client

constants/      # subject/voice configuration
types/          # shared TypeScript types
public/         # icons and static assets
```

## Running locally

Install dependencies:

```bash
npm install
```

Create the environment variables required for Clerk, Supabase, Vapi, and Sentry, then run:

```bash
npm run dev
```

The app uses Next.js server actions for database operations, so credentials that belong on the server should stay out of client-side code.

## Looking back

If I rebuilt this today, I would simplify parts of the architecture, write less explanatory code comments, tighten up the data layer, and spend more time on the actual learning loop rather than just the product plumbing.

But building this was important because it taught me how all of those pieces fit together. Later projects got much more technically ambitious, but this is one of the places where the progression started.
