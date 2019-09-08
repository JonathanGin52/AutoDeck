const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SlideFunctions = require('./SlideFunctions');
const TOKEN_PATH = './api/token.json';

class Auth {
  static create() {
    console.log('Current directory: ' + process.cwd());
    return new Promise((resolve, reject) => {
      fs.readFile('./api/credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Slides API.
        this.authorize(JSON.parse(content), async(auth) => {
          resolve(await new SlideFunctions(auth, '1EMoPRZLQvzkKSPrSIVVTY0bwf7of71eb1i47Adciqjw'));
        });
      });
    });
  }

  static authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]
    );

    let client = null;
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return this.getNewToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      return callback(oAuth2Client);
    });
  }

  static getNewToken(oAuth2Client, callback) {
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
}

module.exports = Auth;
