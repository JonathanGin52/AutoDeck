const language = require('@google-cloud/language');
const nlp_client = new language.LanguageServiceClient();
var express = require('express');
var router = express.Router();

router.post('/api/record', (req, res, next) => {
  const transcript = req.body.transcript;
  console.log(transcript); //mark
  res.status(200);
});

router.post('/nlp/entity_sentiments', function(req, res, next) {
  nlp_request(req, res);
});

function return_response(res, data) {
  console.log(data);
  res.json(data);
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
