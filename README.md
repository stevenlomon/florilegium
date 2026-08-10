# Florilegium

> **Status:** Currently in Beta, live at [beta.florilegium.page](https://beta.florilegium.page)

## *A digital renaissance book garden*

Florilegium is a sanctuary designed, first and foremost, for myself to rekindle and cultivate my love for reading.  

My own personal problem with modern book tracking sites is that somewhere along the way we started valuing noise over signal. Before we have even read the first page our mind is poisoned by aggregated scores from thousands of strangers and the top-voted "hot takes" that generate cynical discourse and confirmation bias. It's cognitive pollution. It's all noise.  

Florilegium is an invitation to get back to reading the way we did as children. An invitation to start prioritizing signal over noise.

In the cases where we weren't told what to read, the most magical and formative reading experiences were those grounded in resonance and curiosity. You finished a book a friend recommended and you can't stop thinking about it. You saw a book that simply spoke to you at Barnes & Noble and it kept you up at night.

How does this translate to us now as adults in the Attention Economy age?  

One or two strong recommendations from Booktubers we resonate with. A recommendation from a friend we hold close to our heart. A book that genuinely draws you in and compels you at a second hand store or the local library. And a page estimate. I would argue that that's all we truly need to make a decision to read something.

And from there it's simply a question of discernment: _Do I commit to reading this now? After the book I'm currently reading? Or sometime shortly thereafter?_

All while also having a clear sense of where our reading journey is headed. The dense masterpieces we want to cultivate momentum towards. Our reading life's North Star.

I have done my best to have the code reflect the core ethos of the app: _Intentional, grounded, and human._

Built with love and care.  
/Steven 🌿

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
