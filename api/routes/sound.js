const language = require('@google-cloud/language');
const NLPClient = new language.LanguageServiceClient();
const fetch = require('node-fetch');
const pictureMatches = ['picture of', 'image of', 'depiction of', 'pic of'];
const bulletMatches = ['firstly', 'secondly', 'thirdly', 'fourthly', 'finally', 'first', 'second', 'third'];
const unsplash = require('../unsplash');
const fs = require('fs');
const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};
var express = require('express');
var router = express.Router();

router.post('/api/record', (req, res, next) => {
  const transcript = req.body.transcript;
  fetch('http://localhost:8080/nlp/entity_sentiments', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ text: transcript }),
  }).then(r => {
    r.json().then(resp => {
    // Todo logic for updating the slides
    console.log(resp);
    
    if (transcript.includes('next slide')) {
      fetch('http://localhost:8080/slides/api/add_slide', {
        method: 'POST',
        headers: defaultHeaders,
      });
      firstSentence = true;
      subTitle = true;
      return;
    }
    let phrase = pictureMatches.find(element => transcript.includes(element))
    if (transcript.includes("conclusion")) {
    } else if (phrase) {
      image(transcript, JSON.parse(resp), phrase.toLowerCase());
    } else {
      four(transcript);
    }
  })});
});

function authors() {
}

function two() {
}

function three() {
}

function four(transcript) {
  if (firstSentence) {
    fetch('http://localhost:8080/slides/api/add_header', {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({text: transcript.charAt(0).toUpperCase() + transcript.slice(1)}),
    });
    firstSentence = false;
  } else {
    five(transcript);
  }
}

function five(transcript) {
  if (subTitle) {
    SlideFunctions.createTextboxWithText({text: transcript.charAt(0).toUpperCase() + transcript.slice(1)});
    subTitle = false;
  } else {
    six(transcript);
  }
}

function six(transcript) {
  let phrase = bulletMatches.find(element => transcript.includes(element));
  if (phrase) {
    SlideFunctions.upsertText({ entity, text: transcript.replace('phrase', '').charAt(0).toUpperCase() + transcript.slice(1), delimiter: '\n'});
  }
}

async function image(transcript, resp, phrase) {
  let index = transcript.indexOf(phrase) + phrase.length;
  let found = null;
  let currMin = null;
  if (resp.entities) {
    for (let i = 0; i < resp.entities.length; i++) {
      for (let j = 0; j < resp.entities[i].mentions.length; j++) {
        if ((!currMin ||
            Math.abs(index - resp.entities[i].mentions[j].text.beginOffset) < currMin) &&
            !phrase.includes(resp.entities[i].mentions[j].text.content.toLowerCase())) {
          currMin = resp.entities[i].mentions[j].text.beginOffset;
          found = resp.entities[i].mentions[j].text.content;
        }
      }
    }
  }
  console.log(found);
  if (found) {
    const response = await unsplash.get('/search/photos', { params: { query: found } });
    let images = response.data.results;
    SlideFunctions.addImage({
      imageUrl: images[0].urls.raw,
      name: images[0].user.name,
      portfolioUrl: images[0].user.links.html,
    });
  }
}

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
