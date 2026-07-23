# NVIDIA NIM AI Chatbot

A fast, responsive web application for interacting with LLMs powered by NVIDIA NIM endpoints (such as Gemma-2-27B-IT and Llama models) and Google Gemini models.

## Features

- **NVIDIA NIM Integration**: Fast inference with models like `google/gemma-2-27b-it` and `meta/llama-3.1-70b-instruct`.
- **Full-Stack Vercel & Cloud Run Support**: Standalone Express server for local/Cloud Run environments and isolated Vercel Serverless Function handlers under `/api/`.
- **Detailed Logging & Error Handling**: Comprehensive console logs and error reporting for easy debugging.
- **Custom System Prompts & Temperature**: Easily adjust model parameters and persona instructions.
- **API Key Management**: Option to pass your own `x-nvidia-api-key` via header or environment variable.

## Environment Variables

Create a `.env` file or configure your deployment environment variables:

```env
NVIDIA_API_KEY=your_nvidia_api_key_here
```

## Deployment on Vercel

1. Push this repository to GitHub or import it in Vercel.
2. Select **Other** as the Framework Preset in Vercel if needed.
3. Add `NVIDIA_API_KEY` under Environment Variables in Vercel Project Settings.
4. Deploy! Vercel automatically routes `/api/chat` and `/api/health` to the standalone serverless functions in the `/api` directory.

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

## Project Structure

- `server.ts` - Local/Cloud Run Express backend server
- `api/_chatHandler.ts` - Shared handler logic for NVIDIA NIM chat requests
- `api/chat.ts` - Vercel Serverless Function endpoint for `/api/chat`
- `api/health.ts` - Vercel Serverless Function endpoint for `/api/health`
- `src/` - React front-end built with Vite and Tailwind CSS
- `vercel.json` - Vercel routing configuration
