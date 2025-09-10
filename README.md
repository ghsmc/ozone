# Milo - AI Discovery Engine for Yale Students

Milo is an intelligent career discovery platform that helps Yale students find opportunities, connect with alumni, and build their careers through AI-powered recommendations.

## Features

- **Company Discovery**: Get personalized company recommendations with specific teams and application links
- **High-Leverage Next Moves**: Receive actionable career steps tailored to your interests
- **Yale Alumni Network**: Connect with alumni at target companies
- **Real-time AI Insights**: Get intelligent analysis of opportunities and career paths

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **AI**: OpenAI GPT-4
- **Database**: SQLite + Supabase
- **Vector Search**: Pinecone
- **Styling**: Tailwind CSS + Framer Motion

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file with:
   ```
   OPENAI_API_KEY=your_openai_key
   PINECONE_API_KEY=your_pinecone_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   ```

3. **Run development server**:
   ```bash
   npm run dev:full
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Project Structure

```
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utility libraries
│   ├── services/          # API services
│   └── types/             # TypeScript types
├── server.js              # Express server
├── chat-backend.js        # AI chat backend
├── supabase/              # Supabase configuration
└── public/                # Static assets
```

## Key Components

- **Companies to Consider**: AI-curated company recommendations with match scores
- **High-Leverage Next Moves**: Specific, actionable career steps
- **Alumni Network**: Yale alumni connections at target companies
- **Real-time Chat**: Interactive AI assistant for career guidance

## Deployment

This project is configured for deployment on Bolt.new with:
- Automatic builds from git
- Environment variable management
- Static file serving
- API endpoint handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Private project for Yale students.
# ozone
