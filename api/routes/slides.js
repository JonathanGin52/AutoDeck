const Auth = require('../Auth');
const unsplash = require('../unsplash');
const express = require('express');
const router = express.Router();

let slideFunctions;
const imageCache = {};

router.post('/api/add_slide', async (req, res, next) => {
  if (!slideFunctions) {
    slideFunctions = await Auth.create();
  }
  slideFunctions.createSlide({});
  res.status(200).end();
});

router.post('/api/add_text', async (req, res, next) => {
  if (!slideFunctions) {
    slideFunctions = await Auth.create();
  }
  let entity = req.body.entity;
  let text = req.body.text;
  slideFunctions.upsertText({entity, text, delimiter: '\n'});
  res.status(200).end();
});

router.post('/api/add_header', async(req, res, next) => {
  if (!slideFunctions) {
    slideFunctions = await Auth.create();
  }
  let text = req.body.text;
  let isSubheading = req.body.isSubheading;
  slideFunctions.createHeader({text, isSubheading});
  res.status(200).end();
});

router.post('/api/add_subheader', async (req, res, next) => {
  if (!slideFunctions) {
    slideFunctions = await Auth.create();
  }
  let text = req.body.text;
  slideFunctions.createSubheader({text});
  res.status(200).end();
});

router.post('/api/add_image', async (req, res, next) => {
  if (!slideFunctions) {
    slideFunctions = await Auth.create();
  }
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
  res.status(200).end();
});

router.post('/api/bullet_list', async (req, res, next) => {
  if (!slideFunctions) {
    slideFunctions = await Auth.create();
  }
  let {delimiter, text, entity, bulletPreset} = req.body;
  await slideFunctions.upsertText({entity, text, delimiter});
  slideFunctions.createBulletedList({bulletPreset, objectId: entity});
  res.status(200).end();
});

module.exports = router;
