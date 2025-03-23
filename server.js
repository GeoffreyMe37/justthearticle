// server.js (Node.js + Express backend)
const express = require('express');
const axios = require('axios');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
require('dotenv').config();

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/summarize', async (req, res) => {
  const { url } = req.body;

  try {
    const response = await axios.get(url);
    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    const prompt = `Summarize the following article in a one-sentence TL;DR, followed by a bullet-point summary (or numbered list if it's a list-based article):\n\n"""${article.textContent}"""`;

    const summary = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      title: article.title,
      summary: summary.data.choices[0].message.content.trim()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to extract and summarize the article.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
