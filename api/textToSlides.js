const SlideFunctions = require('./SlideFunctions');
const unsplash = require('./unsplash');
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const inquirer = require('inquirer');

const TOKEN_PATH = 'token.json';
let slideFunctions;
const imageCache = {};

async function main(auth) {
  if (!slideFunctions) {
    console.log('created slide function class');
    slideFunctions = await new SlideFunctions(auth, '1EMoPRZLQvzkKSPrSIVVTY0bwf7of71eb1i47Adciqjw');
  }
  while (true) {
    const {selection} = await inquirer.prompt({
      type: 'list',
      name: 'selection',
      message: 'Select an option',
      choices: [
        'Add slide',
        'Add text',
        'Add header',
        'Add subheader',
        'Add an image',
        'Convert to bulleted list',
        'Quit',
      ],
    });
    switch (selection) {
    case 'Add slide':
      slideFunctions.createSlide({});
      break;
    case 'Add text':
      const {entity, text} = await inquirer.prompt([{name: 'entity'}, {name: 'text'}]);
      slideFunctions.upsertText({entity, text, delimiter: '\n'});
      break;
    case 'Add header':
      const {content} = await inquirer.prompt([{name: 'content'}]);
      slideFunctions.createHeader({text: content, pageIndex: 1});
      break;
    case 'Add subheader':
      const {subheader} = await inquirer.prompt([{name: 'subheader'}]);
      slideFunctions.createSubheader({text: subheader});
      break;
    case 'Add an image':
      const {query} = await inquirer.prompt({name: 'query'});

      let images;
      let ids;
      let index = 0;
      if (imageCache[query]) {
        console.log('Cache hit!');
        images = imageCache[query];
        index = imageCache[query].index;
        if (index === 10) index = 0;

        ids = await slideFunctions.updateImage({
          ids: images.ids,
          imageUrl: images[index].urls.raw,
          name: images[index].user.name,
          portfolioUrl: images[index].user.links.html,
        });
      } else {
        console.log('Cache miss!');
        const response = await unsplash.get('/search/photos', { params: { query } });
        images = response.data.results;
        imageCache[query] = images;

        ids = await slideFunctions.addImage({
          imageUrl: images[index].urls.raw,
          name: images[index].user.name,
          portfolioUrl: images[index].user.links.html,
        });
      }

      imageCache[query].ids = ids;
      imageCache[query].index = index + 1;
      console.log(imageCache[query]);
      break;
    case 'Convert to bulleted list':
      const {objectId} = await inquirer.prompt({name: 'objectId'});
      slideFunctions.createBulletedList({objectId});
      break;
    case 'Quit':
      return;
    default:
      console.log(`${selection} is not a valid option`);
      break;
    }
  }
}

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Slides API.
  authorize(JSON.parse(content), main);
});

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
