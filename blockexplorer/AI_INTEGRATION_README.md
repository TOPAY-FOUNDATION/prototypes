# ChainGPT AI Integration

This document explains the AI-powered instant report review feature integrated into the block explorer.

## Features

- **Instant Analysis**: Real-time AI review of reports as users fill out the form
- **Risk Assessment**: Automated risk scoring and severity classification
- **Smart Recommendations**: AI-generated suggestions for report improvement
- **Evidence Analysis**: Intelligent flagging of suspicious elements
- **Confidence Scoring**: Transparency in AI analysis reliability

## Setup

### 1. Environment Configuration

Update your `.env.local` file with ChainGPT API credentials:

```env
CHAINGPT_API_KEY=your_actual_api_key_here
CHAINGPT_API_URL=https://api.chaingpt.org/v1
CHAINGPT_MODEL=gpt-3.5-turbo
```

### 2. Get ChainGPT API Key

1. Visit [ChainGPT Platform](https://app.chaingpt.org/)
2. Create an account or sign in
3. Navigate to API section
4. Generate a new API key
5. Replace `your_actual_api_key_here` in `.env.local`

## How It Works

### Automatic Triggering

The AI review is automatically triggered when:
- User fills in the main identifier (transaction hash or wallet address)
- Selects a reason for reporting
- Provides a description (minimum 20 characters)
- After a 1.5-second debounce delay

### API Endpoints

- `POST /api/ai-review` - Submit report for AI analysis
- `GET /api/ai-review` - Health check for ChainGPT service

### Response Format

```json
{
  "review": {
    "severity": "high" | "medium" | "low",
    "riskScore": 85,
    "analysis": "Detailed AI analysis...",
    "flaggedElements": ["suspicious pattern", "high value transaction"],
    "recommendations": ["Add more evidence", "Verify transaction details"],
    "confidence": 92
  }
}
```

## Components

### ChainGPT Service (`/src/lib/chaingpt.ts`)
- Handles API communication
- Manages request/response formatting
- Implements error handling and retries

### AI Review Component (`/src/components/AIReview.tsx`)
- Displays AI analysis results
- Shows loading states and error messages
- Responsive design with dark mode support

### API Route (`/src/app/api/ai-review/route.ts`)
- Processes review requests
- Validates input data
- Returns formatted AI responses

## Testing

### Sample Test Data

**Revert Report:**
- Transaction Hash: `0x1234567890abcdef...`
- Reason: "Suspicious Activity"
- Description: "This transaction reverted unexpectedly with high gas usage and suspicious contract interactions."

**Wallet Report:**
- Wallet Address: `0xabcdef1234567890...`
- Reason: "Scam or Fraud"
- Description: "This wallet has been involved in multiple phishing attempts and fraudulent token transfers."

## Error Handling

- **API Unavailable**: Graceful fallback with user notification
- **Invalid Responses**: Error logging with user-friendly messages
- **Rate Limiting**: Automatic retry with exponential backoff
- **Network Issues**: Timeout handling and connection error recovery

## Security Considerations

- API keys stored in environment variables
- Input validation and sanitization
- Rate limiting on API endpoints
- No sensitive data logged in production

## Troubleshooting

### Common Issues

1. **"AI analysis temporarily unavailable"**
   - Check API key configuration
   - Verify ChainGPT service status
   - Check network connectivity

2. **No AI review appearing**
   - Ensure form fields meet minimum requirements
   - Check browser console for errors
   - Verify API endpoint accessibility

3. **Slow response times**
   - ChainGPT API may be experiencing high load
   - Check network latency
   - Consider implementing caching for repeated requests

## Future Enhancements

- Caching for improved performance
- Advanced prompt engineering for better analysis
- Integration with blockchain data for enhanced context
- Multi-language support for international users
- Historical analysis trends and patterns