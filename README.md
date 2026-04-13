# KalaSarthi

AI-powered marketplace connecting Indian artisans with global customers.

## Project Structure

```
KalaSarthi/
├── frontend/          # Next.js React application
│   ├── app/          # Next.js App Router
│   ├── components/   # React components
│   ├── contexts/     # React contexts (Auth, Language, etc.)
│   ├── lib/          # Utility libraries
│   └── ...
│
├── backend/          # Python backend & API tests
│   ├── backend_test.py
│   ├── backend_additional_test.py
│   ├── utils/        # Backend utilities
│   └── tests/        # Test suite
│
└── .gitignore
```

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend Tests
```bash
cd backend
python backend_test.py
```

## Tech Stack

- **Frontend:** Next.js 14, React, TailwindCSS, shadcn/ui
- **Backend:** Python, FastAPI, MongoDB
- **AI:** OpenAI GPT-4 for product descriptions & scheme recommendations

## Features

- AI-powered product description generation
- Government scheme recommendations for artisans
- Digital Khata (transaction tracking)
- Voice assistant support
- Multi-language support

## License

MIT
