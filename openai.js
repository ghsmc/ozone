// openai.js
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const MODEL = process.env.OPENAI_MODEL || "gpt-5"; // latest and most capable model

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function openaiJSON({ system, user, schema, temperature = 0.6, max_output_tokens = 1200, enableWebSearch = false }) {
  console.log("Making OpenAI request with model:", MODEL);
  console.log("API Key starts with:", process.env.OPENAI_API_KEY?.substring(0, 20) + "...");
  console.log("Web search enabled:", enableWebSearch);

  try {
    const response = await openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text: system
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: user
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "payload",
          schema: schema,
          strict: true
        },
        verbosity: "medium"
      },
      reasoning: {
        effort: "medium"
      },
      tools: enableWebSearch ? [
        {
          type: "web_search",
          user_location: {
            type: "approximate",
            country: "US"
          },
          search_context_size: "medium"
        }
      ] : [],
      store: true,
      include: [
        "reasoning.encrypted_content",
        "web_search_call.action.sources"
      ]
    });

    console.log("OpenAI response received successfully");
    
    // Extract the JSON content from the response
    // The response has reasoning first, then the actual message
    const messageOutput = response.output?.find(output => output.type === "message");
    const content = messageOutput?.content?.[0];
    
    if (!content || content.type !== "output_text") {
      throw new Error("No valid JSON content in response");
    }
    
    const parsed = JSON.parse(content.text);
    return parsed;
    
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

const withTimeout = (p, ms, label) => {
  let t;
  const timer = new Promise((_, rej) => (t = setTimeout(() => rej(new Error(`${label} timed out`)), ms)));
  return Promise.race([p.finally(() => clearTimeout(t)), timer]);
};

export { openaiJSON, withTimeout };
