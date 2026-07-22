# Florilegium

## *A digital renaissance book garden*

Florilegium is a sanctuary designed, first and foremost, for myself to rekindle and cultivate my love for reading.  
It is also built as an antidote to the hyper-optimized, data-harvesting modern internet. There are no algorithms here, no endless scrolling feeds, and no arbitrary reading challenges. It does not track user behavior, it does not use advertising pixels, and it respects the sovereignty of the user's data.

It is a quiet, constrained space to track your reading journey.

## The Architecture of the Garden

The application is built around strict, intentional constraints to prioritize focus and intentionality over accumulation:

* **The Horizon:** A curated queue capped strictly at five books. These are not passing curiosities, but the dense, meaningful masterpieces you are actively cultivating momentum towards.
* **Reading Tracks:** Your active workbench. You are limited to three tracks (e.g., Fiction, Non-fiction, Before Bedtime). Each track holds exactly two slots: one book you are *Currently Reading*, and one *Up Next*.
* **Reading Journeys:** Every time you read a book, a journey is logged. When you finish, you are prompted to capture your "raw thoughts"; the immediate, unpolished feelings you have upon turning the last page.
* **The Bookshelf:** Your master archive. A place to rate books, write polished reviews, and log the names of the people who recommended them to you.

## Technical Foundation

Florilegium is a full-stack web application leveraging the modern web, while heavily adhering to "Slow Web" principles.

* **Framework:** Next.js (App Router, utilizing Server Components for data fetching and Route Handlers for API mutations)
* **Database:** PostgreSQL (via `pg`), entirely self-managed relational data without relying on an ORM.
* **Styling:** Tailwind CSS, utilizing a custom typography stack (EB Garamond, Source Serif 4, Inter).
* **External Data:** The [Open Library API](https://openlibrary.org/developers/api) proxy for fetching book metadata, page counts, and cover art without tracking the user.
* **Authentication:** Custom, lightweight JWT-based session management using `jose`.

## Local Cultivation

To run your own instance of Florilegium locally:

1. **Clone the repository:**
```bash
git clone https://github.com/stevenlomon/florilegium.git
cd florilegium

```


2. **Install dependencies:**
```bash
npm install

```


3. **Set up your environment:**
Create a `.env.local` file in the root directory and provide the necessary keys:
```env
DATABASE_URL="postgres://username:password@your-database-host:port/database-name"
JWT_SECRET="your-cryptographically-secure-secret-string"

```


4. **Start the development server:**
```bash
npm run dev

```


*The garden will be open at `http://localhost:3000`.*

## Philosophy

I have done my best to have the code reflect the main ethos of the app: Deliberate, thoughtful, human.

Built with love and care.  
/Steven 🌿