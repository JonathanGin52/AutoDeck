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

var lastStep = "NONE";

router.post('/api/record', (req, res, next) => {
  var transcript = req.body.transcript;

  // Creating new slide
  if (transcript.toLowerCase() === 'next slide' || transcript.toLowerCase() === 'new slide') {
    console.log("NEW SLIDE");
    // call api
    lastStep = "OPEN";
  }

  // Introduction
  else if (lastStep === "NONE" || lastStep === "AUTHORS" || lastStep === "TITLE") {
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
      console.log("Transcript: " + transcript);

      // Switch statement
      if (lastStep === "NONE")
        lastStep = authors(transcript, JSON.parse(resp));
      else if (lastStep === "AUTHORS")
        lastStep = title(transcript, JSON.parse(resp));
      else if (lastStep === "TITLE")
        lastStep = subtitle(transcript, JSON.parse(resp));
    })});
  }

  // Actual slides
  else if (lastStep === "OPEN") { //open state for either new page or end of slideshow
    if (transcript.toLowerCase().includes("conclusion") || transcript.toLowerCase().includes("all"))
      lastStep = conclude(transcript); //ending
    else
      lastStep = heading(transcript);
  }
  else if (lastStep === "HEADING") { //create paragraph
    lastStep = para(transcript);
  }
  else if (lastStep === "PARA") {
    if (transcript.toLowerCase().includes("firstly")  || //add bullets
        transcript.toLowerCase().includes("secondly") || 
        transcript.toLowerCase().includes("thirdly")  || 
        transcript.toLowerCase().includes("lastly")) {
      lastStep = bullet(transcript);
    }
    else if (transcript.toLowerCase().includes("picture of")) { //add picture
      lastStep = picture(transcript, JSON.parse(resp));  
    }
    else {
      lastStep = "OPEN"; //back to open state
    }
  }
});

function authors(str, entity_sentiments) {
  /*
   * Given an array of strings (e.g):
   *  - "Hey my name is Rui"(1) "I'm alex"(2) "And I am john"(3)
   *  - "I'm John"(1) "I'm Alex"(2) "And I'm Rui"(3)
   * 
   * Return string of names (i.e):
   *  - Names are capitalized
   *  - "Rui" is spelt correctly
   * - Extract names using Entity 
   */
  
  let entities = entity_sentiments.entities;
  let names = [];

  try {
    for (let i = 0; i < entities.length; i++) {
      if (entities[i].type === "PERSON" && !names.includes(entities[i].name))
         names.push(entities[i].name);
    }
  } catch (err) {console.log(err)}
  console.log(names);

  if (names.length >= 3) {
    byStatement = "By ";
    for (let i = 0; i < names.length; i++) {
      if (i === names.length - 1 && i > 1)
        byStatement += "and " + names[i];
      else if (i === names.length - 1)
        byStatement += names[i];
      else
        byStatement += names[i] + ", ";
    }
    console.log("AUTHORS: " + byStatement); //call slides api
    return "AUTHORS";
  }
  return "NONE"; //failed
}

function title(str, entity_sentiments) {
  let titles = ['Enter title'];
  let entities = entity_sentiments.entities;
  try {
    for (let i = 0; i < entities.length; i++) {
      if (!titles.includes(entities[i].name) && entities[i].name === "Auto deck")
        titles.push("AutoDeck");
      else if (!titles.includes(entities[i].name))
        titles.push(entities[i].name);
    }
  } catch (err) {console.log(err)}
  console.log("TITLE: " + titles[titles.length-1]); //call slides api
  if (titles.length > 1)
    return "TITLE";
  return "AUTHORS";
}

function subtitle(str) {
  console.log("SUBTITLE: "+ str.charAt(0).toUpperCase() + str.substring(1)); //call slides api
  return "OPEN";
}

function heading(transcript) {
  console.log("HEADING: " + transcript.charAt(0).toUpperCase() + transcript.substring(1)); //call slides api
  return "HEADING";
}

function para(transcript) {
  console.log("PARA: " + transcript.charAt(0).toUpperCase() + transcript.substring(1)); //call slides api
  return "PARA";
}

function bullet(transcript) {
  console.log("BULLET: " + transcript.charAt(0).toUpperCase() + transcript.substring(1)); //call slides api
  return "PARA";
}

function image(transcript, entity_sentiments) {
  console.log("IMAGE: " + entity_sentiments.entities[0].name); //call slides api
  return "OPEN";
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
