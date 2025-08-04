import express from 'express';
import { readFile } from 'fs/promises';

const router = express.Router();

// Load dataset
const dataset = JSON.parse(
  await readFile(new URL('../data/medchain_chatbot_dataset.json', import.meta.url))
);

// Process user query
router.post('/query', (req, res) => {
  const { query, language = 'en' } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = processQuery(query, dataset);
    res.json({ response });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ error: 'Error processing query' });
  }
});

// Get all intents
router.get('/intents', (req, res) => {
  res.json(dataset.intents);
});

// Process query function
function processQuery(userQuery, dataset) {
  const normalizedQuery = userQuery.toLowerCase().replace(/[^\w\s]/g, '');
  const queryTokens = new Set(normalizedQuery.split(/\s+/));

  let bestMatchScore = 0;
  let bestAnswer = "I'm sorry, I couldn't find a relevant answer. Could you please rephrase your question?";

  for (const intentData of dataset.intents) {
    for (const question of intentData.questions) {
      const normalizedQuestion = question.toLowerCase().replace(/[^\w\s]/g, '');
      const questionTokens = new Set(normalizedQuestion.split(/\s+/));
      
      const overlap = new Set([...queryTokens].filter(token => questionTokens.has(token)));
      const score = overlap.size;
      
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestAnswer = intentData.answers[0];
      }
    }
  }

  return bestAnswer;
}

export default router;