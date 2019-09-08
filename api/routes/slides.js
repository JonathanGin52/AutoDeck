const Auth = require('../Auth');
const unsplash = require('../unsplash');

let auth = new Auth();
let slideFunctions = auth.slideFunctions;
console.log(slideFunctions);
const imageCache = {};

var express = require('express');
var router = express.Router();

router.post('/api/add_slide', (req, res, next) => {
  console.log(req);
  console.log(slideFunctions);
  slideFunctions.createSlide({});
});

router.post('/api/add_text', (req, res, next) => {
  let entity = req.body.entity;
  let text = req.body.text;
  slideFunctions.upsertText({entity, text, delimiter: '\n'});
});

router.post('/api/add_header', (req, res, next) => {
  let text = req.body.text;
  slideFunctions.createHeader({text: text});
});

router.post('/api/add_image', async (req, res, next) => {
  let query = req.body.query;
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
});

router.post('/api/bullet_list', (req, res, next) => {
  let objectId = req.objectId;
  slideFunctions.createBulletedList({objectId});
});

module.exports = router;
