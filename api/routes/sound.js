const language = require('@google-cloud/language');
const NLPClient = new language.LanguageServiceClient();
const fetch = require('node-fetch');
const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};
var express = require('express');
var router = express.Router();

var lastStep = 'NONE';
var base = 'DOGGO';
let count = 0;
const imageQueries = [];

router.post('/api/record', (req, res, next) => {
  var transcript = req.body.transcript;

  // Creating new slide
  if (transcript.toLowerCase() === 'next slide' || transcript.toLowerCase() === 'new slide') {
    count++;
    console.log('NEW SLIDE');

    fetch('http://localhost:8080/slides/api/add_slide', {
      method: 'POST',
      headers: defaultHeaders,
    });

    // call api
    lastStep = 'OPEN';
  } else if (transcript.toLowerCase().includes('picture of') || transcript.toLowerCase().includes('another picture')) { //add picture
    fetch('http://localhost:8080/nlp/entity_sentiments', {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ text: transcript }),
    }).then(r => {
      r.json().then(resp => {
        image(transcript, JSON.parse(resp), transcript.toLowerCase().includes('picture of') ? 'picture of' : 'another picture');
      })
    });
  } else if (lastStep === 'NONE' || lastStep === 'AUTHORS' || lastStep === 'TITLE') {
    fetch('http://localhost:8080/nlp/entity_sentiments', {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ text: transcript }),
    }).then(r => {
      r.json().then(resp => {
        // Todo logic for updating the slides
        console.log('Transcript: ' + transcript);

        // Switch statement
        if (lastStep === 'NONE') {
          lastStep = authors(transcript, JSON.parse(resp));
        } else if (lastStep === 'AUTHORS') {
          lastStep = title(transcript, JSON.parse(resp));
        } else if (lastStep === 'TITLE') {
          lastStep = subtitle(transcript, JSON.parse(resp));
        }
      });
    });
  } else if (lastStep === 'OPEN') { //open state for either new page or end of slideshow
    if (transcript.toLowerCase().includes('conclusion') || transcript.toLowerCase().includes('all')) {
      lastStep = conclude(transcript); //ending
    } else {
      lastStep = heading(transcript);
    }
  } else if (lastStep === 'HEADING') { //create paragraph
    lastStep = para(transcript);
  } else if (lastStep === 'PARA') {
    if (transcript.toLowerCase().includes('firstly')  || //add bullets
      transcript.toLowerCase().includes('secondly') ||
      transcript.toLowerCase().includes('thirdly')  ||
      transcript.toLowerCase().includes('lastly')) {
      lastStep = bullet(transcript);
    } else {
      lastStep = 'OPEN'; //back to open state
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
      if (entities[i].type === 'PERSON' && !names.includes(entities[i].name)) {
        names.push(entities[i].name);
      }
    }
  } catch (err) {console.log(err)}
  console.log(names);

  if (names.length >= 3) {
    let byStatement = 'By ';
    for (let i = 0; i < names.length; i++) {
      if (i === names.length - 1 && i > 1) {
        byStatement += 'and ' + names[i];
      } else if (i === names.length - 1) {
        byStatement += names[i];
      } else {
        byStatement += names[i] + ', ';
      }
    }
    fetch('http://localhost:8080/slides/api/add_subheader', {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({text: byStatement}),
    });
    console.log('AUTHORS: ' + byStatement); //call slides api
    return 'AUTHORS';
  }
  return 'NONE'; //failed
}

function title(str, entity_sentiments) {
  let titles = [];
  let entities = entity_sentiments.entities;
  try {
    for (let i = 0; i < entities.length; i++) {
      if (!titles.includes(entities[i].name) && entities[i].name === 'Auto deck') {
        titles.push('AutoDeck');
      } else if (!titles.includes(entities[i].name)) {
        titles.push(entities[i].name);
      }
    }
  } catch (err) {console.log(err)}
  fetch('http://localhost:8080/slides/api/add_header', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({text: titles[titles.length-1]}),
  });
  console.log('TITLE: ' + titles[titles.length-1]); //call slides api
  if (titles.length >= 1) {
    return 'TITLE';
  }
  return 'AUTHORS';
}

function subtitle(transcript, str) {
  fetch('http://localhost:8080/slides/api/add_header', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({text: transcript.charAt(0).toUpperCase() + transcript.slice(1), isSubheading: true }),
  });
  console.log('SUBTITLE: '+ str.charAt(0).toUpperCase() + str.substring(1)); //call slides api
  return 'OPEN';
}

function heading(transcript) {
  fetch('http://localhost:8080/slides/api/add_subheader', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({text: transcript.charAt(0).toUpperCase() + transcript.slice(1)}),
  });
  return 'HEADING';
}

function conclude(transcript) {
  fetch('http://localhost:8080/slides/api/add_header', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({text: 'Thank you'}),
  });
  return 'CONCLUDE';
}

function para(transcript) {
  fetch('http://localhost:8080/slides/api/add_text', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({
      entity: `${base}${count}`,
      text: transcript.charAt(0).toUpperCase() + transcript.slice(1) + '.',
      delimiter: ' ',
    }),
  });
  console.log('PARA: ' + transcript.charAt(0).toUpperCase() + transcript.substring(1)); //call slides api
  return 'PARA';
}

function bullet(transcript) {
  fetch('http://localhost:8080/slides/api/bullet_list', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({
      entity: `${base}${count}`,
      text: transcript.charAt(0).toUpperCase() + transcript.slice(1),
      bulletPreset: 'NUMBERED_DIGIT_ALPHA_ROMAN',
      delimiter: '\n',
    }),
  });
  console.log('BULLET: ' + transcript.charAt(0).toUpperCase() + transcript.substring(1)); //call slides api
  return 'PARA';
}

function image(transcript, resp, phrase) {
  let query;
  if (phrase === 'another picture') {
    query = imageQueries[imageQueries.length - 1];
    fetch('http://localhost:8080/slides/api/add_image', {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({query}),
    });
    return;
  } else {
    query = resp.entities[resp.entities.length - 1].name;
  }
  let found = null;
  let currMin = null;
  let index = phrase.indexOf('picture');
  if (resp.entities) {
    for (let i = 0; i < resp.entities.length; i++) {
      for (let j = 0; j < resp.entities[i].mentions.length; j++) {
        if ((!currMin || Math.abs(index - resp.entities[i].mentions[j].text.beginOffset) < currMin) &&
          !phrase.includes(resp.entities[i].mentions[j].text.content.toLowerCase())) {
          currMin = resp.entities[i].mentions[j].text.beginOffset;
          found = resp.entities[i].mentions[j].text.content;
        }
      }
    }
  }
  if (found) {
    imageQueries.push(found);
    fetch('http://localhost:8080/slides/api/add_image', {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({query: found}),
    });
  }
  return 'OPEN';
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
