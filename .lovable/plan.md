
# Plan: Switch to Your Own Gemini API Key

## Overview
Replace the Lovable AI Gateway calls with direct Google Gemini API calls using your own API key. This will route all AI costs to your Google account instead of your Lovable Cloud usage.

## What Changes

### 1. Add Your Gemini API Key as a Secret
- You'll need to add your Gemini API key as a backend secret called `GEMINI_API_KEY`
- Get your key from: https://aistudio.google.com/apikey

### 2. Update Edge Functions
Modify both edge functions to use Google's Gemini API directly:

**Changes to `supabase/functions/process-document/index.ts`:**
- Change API endpoint from `https://ai.gateway.lovable.dev/v1/chat/completions` to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Use `GEMINI_API_KEY` instead of `LOVABLE_API_KEY`
- Adjust request/response format for Google's native API

**Changes to `supabase/functions/process-bulk-questions/index.ts`:**
- Same API endpoint and key changes
- Adapt the prompt format for Gemini's native structure

## Technical Details

### Google Gemini API Format
```typescript
// Current (Lovable Gateway - OpenAI format)
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: [{ role: "user", content: "..." }]
  })
});

// New (Google Gemini Direct)
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "..." }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  }
);
```

### Files to Modify
1. `supabase/functions/process-document/index.ts` - 3 functions using AI
2. `supabase/functions/process-bulk-questions/index.ts` - 1 function using AI

## Google Gemini Free Tier Benefits
- **Free requests**: 15 requests per minute
- **Free tokens**: 1 million tokens per month
- **No credit card required** for free tier
- With your paid account, you get even higher limits

## Steps to Implement
1. Get your API key from Google AI Studio
2. Add the key as a secret in your backend
3. Update both edge functions to use Google's API format
4. Test document processing and bulk question import

## Cost Comparison
| Service | Cost |
|---------|------|
| Lovable AI Gateway | Deducts from your Lovable credits |
| Google Gemini (Free) | $0 up to generous limits |
| Google Gemini (Paid) | Pay-as-you-go on your Google account |
