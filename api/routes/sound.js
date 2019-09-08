const language = require('@google-cloud/language');
const NLPClient = new language.LanguageServiceClient();
const fetch = require('node-fetch');
const SlideFunctions = require('../SlideFunctions');
var express = require('express');
var router = express.Router();

router.post('/api/record', (req, res, next) => {
  const transcript = req.body.transcript;
  fetch('http://localhost:8080/nlp/entity_sentiments', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: transcript }),
  }).then(r => {
    r.json().then(resp => {
    // Todo logic for updating the slides
    console.log(resp);
    if (transcript.toLowerCase() == 'next slide') {
      SlideFunctions.createSlide({});
    }
  })});
});

function authors() {}

function two() {}

function three() {}

function four() {}

function five() {]

function six() {}

function image() {}

// ========================================
// NLP stuff

router.post('/nlp/entity_sentiments', function(req, res, next) {
  nlpRequest(req, res);
});

function returnResponse(res, data) {
  res.json(JSON.stringify(data));
}

function nlpRequest(req, res) {
  const text = req.body.text;

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  NLPClient
    .analyzeEntitySentiment({document})
    .then(results => {
      returnResponse(res, results[0]);
    })
    .catch(err => {
      returnResponse(res, { error: err.message });
    });
}

module.exports = router;
