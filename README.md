# Poneglyph

![cover.png](Poneglyph)

Poneglyph is an AI powered document search and chat platform built with Next.js. It integrates the [Gemini File Search API](https://ai.google.dev/gemini-api/docs/file-search) to deliver Retrieval Augmented Generation, allowing users to upload documents, build searchable stores, and chat with an AI assistant that provides citations.

---

## Features

### Core Capabilities

* **Document Upload and Management**
  Upload files, create searchable stores, and customize chunking and metadata.

* **AI Powered Chat**
  Conversational interface supporting Gemini 2.5 Flash and Pro.

* **Citations**
  Responses include references to exact documents and sections.

* **Conversation History**
  View, resume, and delete past conversations.

* **User Authentication**
  Secure login with NextAuth using a Prisma adapter.

### UI and Rendering

* **Responsive Interface** built with Tailwind CSS
* **Icons** via Lucide React
* **Markdown Rendering** using React Markdown with GitHub Flavored Markdown and syntax highlighting

---

## Tech Stack

| Area              | Technologies                                        |
| ----------------- | --------------------------------------------------- |
| Frontend          | Next.js 15, React 19, TypeScript                    |
| Styling           | Tailwind CSS, PostCSS                               |
| Backend           | Next.js API routes, Prisma ORM                      |
| Database          | Any Prisma compatible database such as PostgreSQL   |
| Authentication    | NextAuth 5                                          |
| AI Integration    | Google Gemini API                                   |

---

## Installation

### 1. Clone the repository

```sh
git clone https://github.com/ashwnn/poneglyph
cd poneglyph
```

### 2. Install dependencies

```sh
npm install
```

### 3. Set environment variables

Copy `.env.example` to `.env` and fill in:

* Database URL
* Google API keys
* NextAuth secrets

### 4. Generate Prisma client

```sh
npm run db:generate
```

### 5. Run database migrations

```sh
npm run db:migrate
```

### 6. Start the development server

```sh
npm run dev
```

Your app will be available at:

```
http://localhost:3000
```

---

## Usage

### Sign In

Create an account or log in with NextAuth.

### Create a Store

Upload documents and configure chunking and metadata.

### Start Chatting

Choose a model, enable citations if needed, and ask questions about your documents.

### Manage Conversations

Use the sidebar to browse or delete previous conversations.

---

## Scripts

| Script                | Description              |
| --------------------- | ------------------------ |
| `npm run dev`         | Start development server |
| `npm run build`       | Build for production     |
| `npm run start`       | Start production server  |
| `npm run lint`        | Run ESLint               |
| `npm run db:generate` | Generate Prisma client   |
| `npm run db:migrate`  | Run database migrations  |
| `npm run db:studio`   | Open Prisma Studio       |

---

## Project Structure

```
.
├─ app                 Next.js app directory
├─ components          Reusable React components
├─ lib                 Utility functions and API handlers
├─ prisma              Database schema and migrations
├─ types               TypeScript type definitions
└─ public              Static assets
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes and ensure tests pass
4. Open a pull request

---

## License

Licensed under the MIT License. Refer to the LICENSE file for details.