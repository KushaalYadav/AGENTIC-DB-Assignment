'use strict';

/**
 * routes/agent.js
 * POST /api/agent/query
 */

const express = require('express');
const { getClients } = require('../db/queries');

const router = express.Router();

const SYSTEM_PROMPT = `You are a data visualization expert. Given the client data and user request, return ONLY valid JSON matching this exact schema: 
{ 
  "charts": [
    {
      "chartType": "bar"|"pie"|"line", 
      "title": string, 
      "labels": string[], 
      "datasets": [{ "label": string, "data": number[] }]
    }
  ],
  "clientDetails": array
}

CRITICAL RULES:
1. The 'charts' array must contain multiple chart objects to provide clarity at any data size.
2. Specifically generate these charts:
   - A bar chart of revenue by client name (if the dataset has >10 clients, still include all of them).
   - A pie chart of client count grouped by industry.
   - A pie or bar chart of client count grouped by status (Active/Pending/Churned).
   - ONLY when the total client count is 10 or fewer, also include a line chart of revenue trend by joined_date. Omit this line chart if there are more than 10 clients.
3. The 'data' array MUST be numbers. NEVER use string arrays for data.
4. The 'clientDetails' array MUST contain the exact raw client rows passed to you, completely unchanged.

Do not include any explanation text, only the JSON object.`;

async function callModel(prompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:1.5b',
        prompt: prompt,
        stream: false,
        options: {
          num_predict: 4096, // Increased to allow the massive clientDetails array + 4 charts
          temperature: 0.1
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Ollama responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function tryParseJSON(text) {
  const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanText);
}

router.post('/query', async (req, res) => {
  try {
    const { prompt, testFailure } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "prompt" field in request body.',
      });
    }

    // Extract dynamic limit if specified in prompt (e.g. "first 8 clients")
    let limit = 20;
    const limitMatch = prompt.match(/(?:first|top|limit)\s+(\d+)/i);
    if (limitMatch && limitMatch[1]) {
      limit = parseInt(limitMatch[1], 10);
    }

    const clientRows = getClients(limit);
    const fullPrompt = `${SYSTEM_PROMPT}\n\nClient Data:\n${JSON.stringify(clientRows)}\n\nUser Request:\n${prompt}`;
    
    let rawText = '';
    try {
      if (testFailure) {
        // Dev toggle: Deliberately return bad JSON to trigger the fallback pipeline
        await new Promise(r => setTimeout(r, 600)); // artificial delay
        rawText = 'Here is the data you requested:\n{ chartType: broken format...';
      } else {
        rawText = await callModel(fullPrompt);
      }
    } catch (err) {
      console.error('[POST /api/agent/query] Model request failed:', err.message);
      return res.status(502).json({ success: false, error: 'Failed to communicate with local model', details: err.message });
    }
    
    let parsedData = null;
    try {
      parsedData = tryParseJSON(rawText);
    } catch (parseError) {
      console.log('[POST /api/agent/query] First JSON parse failed, retrying model...');
      const retryPrompt = `${fullPrompt}\n\nYour last response was not valid JSON or contained strings in the data arrays. Return ONLY the valid JSON object with NUMERIC data arrays and no markdown formatting or extra text.\n\nPrevious invalid response:\n${rawText}`;
      
      try {
        if (testFailure) {
          // Second deliberate failure
          await new Promise(r => setTimeout(r, 800));
          rawText = 'I am sorry, I still cannot format this correctly. { error...';
          parsedData = tryParseJSON(rawText); 
        } else {
          rawText = await callModel(retryPrompt);
          parsedData = tryParseJSON(rawText);
        }
      } catch (retryParseError) {
        // Send a 422 if it fails twice, which the frontend gracefully handles
        return res.status(422).json({
          success: false,
          error: 'Model failed to format JSON after retry',
          raw: rawText
        });
      }
    }

    return res.json({
      success: true,
      data: parsedData
    });

  } catch (err) {
    console.error('[POST /api/agent/query] Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error', details: err.message });
  }
});

module.exports = router;
