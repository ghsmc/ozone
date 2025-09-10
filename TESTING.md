# Backend API Testing Guide

This guide shows you how to test the backend functionality that uses OpenAI from the command line.

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Set up environment variables:**
   Make sure you have your OpenAI API key set in your environment:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

## Testing Methods

### 1. Node.js Test Script (Recommended)

**Run the comprehensive test:**
```bash
node test-backend.js
```

**What it tests:**
- ✅ Universal Search API
- ✅ Dream Processing API  
- ✅ Milo Opportunities API
- ✅ Streaming Search API
- ✅ Error handling and timeouts

### 2. Curl Commands (Quick Tests)

**Run the curl test script:**
```bash
./test-curl.sh
```

**Or test individual endpoints:**

**Universal Search:**
```bash
curl -X POST "http://localhost:5173/api/search/universal" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "software engineering internships",
    "userId": "test-user"
  }'
```

**Dream Processing:**
```bash
curl -X POST "http://localhost:5173/api/dreams/process" \
  -H "Content-Type: application/json" \
  -d '{
    "dream": "I want to become a software engineer at Google",
    "userId": "test-user"
  }'
```

**Milo Opportunities:**
```bash
curl -X POST "http://localhost:5173/api/milo/opportunities" \
  -H "Content-Type: application/json" \
  -d '{
    "studentProfile": {
      "name": "Test Student",
      "class_year": 2025,
      "major": "Computer Science",
      "skills_and_clubs": ["Python", "JavaScript"],
      "interests": ["Software Engineering", "AI"],
      "constraints": ["paid"],
      "current_term": "Fall 2024",
      "current_date": "2024-01-15",
      "location": "New Haven, CT"
    }
  }'
```

### 3. Python Test Script

**Run the Python test:**
```bash
python3 test-python.py
```

**Requirements:**
```bash
pip install requests
```

## API Endpoints

### Universal Search
- **Endpoint:** `POST /api/search/universal`
- **Purpose:** Search across careers, alumni, research, opportunities
- **Input:** `{ query: string, userId: string }`
- **Output:** Search results with relevance scores

### Dream Processing  
- **Endpoint:** `POST /api/dreams/process`
- **Purpose:** Process student dreams and generate action plans
- **Input:** `{ dream: string, userId: string }`
- **Output:** Action steps, opportunities, connections

### Milo Opportunities
- **Endpoint:** `POST /api/milo/opportunities`
- **Purpose:** Generate personalized opportunities for students
- **Input:** `{ studentProfile: object }`
- **Output:** Opportunities, Yale connections, weekly plan

### Streaming Search
- **Endpoint:** `POST /api/search/stream`
- **Purpose:** Real-time streaming search results
- **Input:** `{ query: string, userId: string }`
- **Output:** Server-Sent Events stream

## Expected Responses

### Successful Response Example:
```json
{
  "success": true,
  "query": "software engineering internships",
  "searchType": "career",
  "results": [
    {
      "type": "career",
      "title": "Software Engineering Intern at Google",
      "description": "Build scalable systems and work on cutting-edge AI projects",
      "relevance": 95,
      "metadata": {
        "company": "Google",
        "location": "Mountain View, CA",
        "salary": "$8,000-12,000/month"
      }
    }
  ],
  "totalResults": 5
}
```

### Error Response Example:
```json
{
  "success": false,
  "error": "Failed to process search query"
}
```

## Troubleshooting

### Common Issues:

1. **Connection Refused:**
   - Make sure the dev server is running: `npm run dev`
   - Check the port (default: 5173)

2. **OpenAI API Errors:**
   - Verify your API key is set: `echo $OPENAI_API_KEY`
   - Check your OpenAI account has credits

3. **Timeout Errors:**
   - OpenAI API calls can take 10-30 seconds
   - Increase timeout in test scripts if needed

4. **CORS Errors:**
   - Make sure you're testing from the same origin
   - Check browser console for CORS issues

### Debug Mode:

Add debug logging to see what's happening:
```bash
DEBUG=* node test-backend.js
```

## Performance Testing

### Load Testing with curl:
```bash
# Test multiple concurrent requests
for i in {1..5}; do
  curl -X POST "http://localhost:5173/api/search/universal" \
    -H "Content-Type: application/json" \
    -d '{"query": "test query '${i}'", "userId": "test-user"}' &
done
wait
```

### Response Time Testing:
```bash
# Measure response time
time curl -X POST "http://localhost:5173/api/search/universal" \
  -H "Content-Type: application/json" \
  -d '{"query": "software engineering", "userId": "test-user"}'
```

## Monitoring

### Check API Health:
```bash
curl -I http://localhost:5173/
```

### Monitor OpenAI Usage:
- Check your OpenAI dashboard for API usage
- Monitor rate limits and costs

## Next Steps

1. **Run the tests** to verify everything works
2. **Check the responses** to ensure data quality
3. **Monitor performance** for optimization opportunities
4. **Test edge cases** like empty queries or invalid data

Happy testing! 🚀
