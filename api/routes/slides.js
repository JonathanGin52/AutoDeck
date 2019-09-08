const Auth = require('../Auth');
const unsplash = require('../unsplash');

const imageCache = {};

var express = require('express');
var router = express.Router();

router.post('/api/add_slide', (req, res, next) => {
  Auth.create().then(auth => {
    let slideFunctions = auth;
    slideFunctions.createSlide({});
    res.status(200).end();
  });
});

router.post('/api/add_text', (req, res, next) => {
  Auth.create().then(auth => {
    let entity = req.body.entity;
    let text = req.body.text;
    auth.upsertText({entity, text, delimiter: '\n'});
    res.status(200).end();
  });
});

router.post('/api/add_header', (req, res, next) => {
  Auth.create().then(auth => {
    let text = req.body.text;
    auth.createHeader({text});
    res.status(200).end();
  });
});

router.post('/api/add_subheader', (req, res, next) => {
  Auth.create().then(auth => {
    let text = req.body.text;
    auth.createSubheader({text});
    res.status(200).end();
  });
});

router.post('/api/add_image', (req, res, next) => {
  Auth.create().then(async auth => {
    let slideFunctions = auth;
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
});

router.post('/api/bullet_list', (req, res, next) => {
  Auth.create().then(auth => {
    let objectId = req.objectId;
    auth.createBulletedList({objectId});
  });
});

module.exports = router;
