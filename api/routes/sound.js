const language = require('@google-cloud/language');
const nlp_client = new language.LanguageServiceClient();
const fetch = require('node-fetch');
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
    return r.json();
  }).then(r => {
    // Todo logic for updating the slides
    console.log(r);
  });
  res.status(200);
});

router.post('/nlp/entity_sentiments', function(req, res, next) {
  nlp_request(req, res);
});

function return_response(res, data) {
  res.json(JSON.stringify(data));
}

function nlp_request(req, res) {
  const text = req.body.text;

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };
  nlp_client
    .analyzeEntitySentiment({document})
    .then(results => {
      return_response(res, results[0]);
    })
    .catch(err => {
      return_response(res, { error: err });
    });
}

module.exports = router;
