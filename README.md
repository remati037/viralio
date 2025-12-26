# Viralio

A Next.js 15.1.9 application with Supabase integration for planning and managing viral content.

## Features

- 🔐 **Supabase Authentication** - Secure user authentication
- 📝 **Content Planning** - Kanban board and calendar view for content ideas
- 🤖 **AI Assistant** - ChatGPT-like AI assistant for generating content (titles, hooks, body, CTAs)
- 🎯 **Goal Tracking** - Monthly goals for short and long-form content
- 👥 **Competitor Analysis** - Track and analyze competitors
- 📊 **Case Studies** - Analyze successful content
- 🎨 **Modern UI** - Built with Tailwind CSS and Lucide icons

## Tech Stack

- **Next.js** 15.1.9
- **React** 19.1.2
- **TypeScript**
- **Supabase** (Auth + Database)
- **OpenAI** (AI Content Generation)
- **Tailwind CSS**
- **Lucide React** (Icons)

## Prerequisites

- Node.js 24.0.0 or higher
- npm 10.0.0 or higher (or yarn)
- A Supabase account and project

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your Project URL and anon/public key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key (optional, for payments)
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret (optional, for payments)
```

**Where to find the Service Role Key:**
1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** > **API**
3. Under "Project API keys", find the **`service_role`** key (⚠️ Keep this secret!)
4. Copy it to your `.env.local` file

**⚠️ Important Security Note:**
- The Service Role Key bypasses Row Level Security (RLS) and should **NEVER** be exposed to the client
- Only use it in server-side API routes (which we do)
- Never commit it to version control (it's already in `.gitignore`)

### 4. Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_auto_create_profile.sql`

Alternatively, if you have Supabase CLI installed:

```bash
supabase db push
```

### 5. Configure Supabase Auth

1. In Supabase Dashboard, go to Authentication > URL Configuration
2. Add your site URL (e.g., `http://localhost:3000`)
3. Add redirect URL: `http://localhost:3000/auth/callback`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following tables:

- **profiles** - User profile information and goals
- **social_links** - Social media links associated with profiles
- **tasks** - Content ideas and tasks
- **inspiration_links** - Inspiration links for tasks
- **competitors** - Competitor tracking

All tables have Row Level Security (RLS) enabled with policies that ensure users can only access their own data.

## Project Structure

```
viralio/
├── app/                    # Next.js app directory
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── login/              # Login/signup page
│   └── auth/               # Auth callback route
├── components/             # React components
├── lib/                    # Utilities and helpers
│   ├── supabase/          # Supabase client setup
│   ├── hooks/             # Custom React hooks
│   └── utils/              # Utility functions
├── types/                  # TypeScript type definitions
├── supabase/               # Database migrations
│   └── migrations/        # SQL migration files
└── public/                 # Static assets
```

## CRUD Operations

The application provides full CRUD operations for:

- **Profiles**: Create, read, update (via `useProfile` hook)
- **Tasks**: Create, read, update, delete (via `useTasks` hook)
- **Competitors**: Create, read, update, delete (via `useCompetitors` hook)
- **Social Links**: Add, remove (via `useProfile` hook)
- **Inspiration Links**: Add, remove (via `useTasks` hook)

## Authentication

The app uses Supabase Auth with email/password authentication. Users are automatically redirected to `/login` if not authenticated.

## Row Level Security (RLS)

All database tables have RLS policies that:
- Allow users to view only their own data
- Allow users to insert only their own data
- Allow users to update only their own data
- Allow users to delete only their own data

## Building for Production

```bash
npm run build
npm start
```

## License

MIT

