const SlideFunctions = require('./SlideFunctions');
const unsplash = require('./unsplash');
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const inquirer = require('inquirer');

const TOKEN_PATH = 'token.json';

async function main(auth) {
  const slideFunctions = await new SlideFunctions(auth, '1EMoPRZLQvzkKSPrSIVVTY0bwf7of71eb1i47Adciqjw');
  const imageCache = {};
  while (true) {
    const {selection} = await inquirer.prompt({
      type: 'list',
      name: 'selection',
      message: 'Select an option',
      choices: [
        'Add slide',
        'Add text',
        'Add header',
        'Add an image',
        'Quit',
      ],
    });
    switch (selection) {
    case 'Add slide':
      slideFunctions.createSlide({});
      break;
    case 'Add text':
      const {entity, text} = await inquirer.prompt([{name: 'entity'}, {name: 'text'}]);
      slideFunctions.upsertText({entity, text, delimiter: ' '});
      break;
    case 'Add header':
      const {content} = await inquirer.prompt([{name: 'content'}]);
      slideFunctions.createHeader({text: content});
      break;
    case 'Add an image':
      const {query} = await inquirer.prompt({name: 'query'});

      let images;
      if (imageCache[query]) {
        console.log('Cache hit!');
        images = imageCache[query];
      } else {
        console.log('Cache miss!');
        const response = await unsplash.get('/search/photos', { params: { query } });
        images = response.data.results;
        imageCache[query] = images;
      }

      slideFunctions.addImage({
        imageUrl: images[0].urls.raw,
        name: images[0].user.name,
        portfolioUrl: images[0].user.links.html,
      });
      break;
    case 'Quit':
      return;
    default:
      break;
    }
  }
}

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Slides API.
  authorize(JSON.parse(content), main);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  debugger;
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/presentations',
    ],
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}
