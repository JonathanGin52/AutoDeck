const axios = require('axios');

module.exports = axios.create({
  baseURL: 'https://api.unsplash.com',
  headers: {
    Authorization: 'Client-ID 930ce0cd101cbe3ac3e934e33c8a576de100c57244d8e62ab26f24e7e3263809',
  }
});
