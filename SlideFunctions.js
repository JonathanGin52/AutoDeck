const {google} = require('googleapis');

class SlideFunctions {
  constructor(auth, presentationId) {
    this.slidesService = google.slides({version: 'v1', auth});
    this.presentationId = presentationId || this.createPresentation();
  }

  listSlides() {
    this.slidesService.presentations.get({
      presentationId: this.presentationId,
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const length = res.data.slides.length;
      console.log('The presentation contains %s slides:', length);
      res.data.slides.forEach((slide, i) => {
        console.log(`- Slide #${i + 1} contains ${slide.pageElements.length} elements.`);
      });
    });
  }

  async createPresentation(title = 'Demo') {
    return new Promise((resolve, reject) => {
      this.slidesService.presentations.create({
        title,
      }, (err, presentation) => {
        console.log(`Created presentation with ID: ${presentation.data.presentationId}`);
        resolve(presentation.data.presentationId);
      });
    });
  }

  async createSlide(params) {
    return new Promise((resolve, reject) => {
      let requests = [{
        createSlide: {
          insertionIndex: params.insertionIndex || '1',
          slideLayoutReference: {
            predefinedLayout: params.predefinedLayout || 'TITLE_AND_TWO_COLUMNS',
          },
        },
      }];
      // If you wish to populate the slide with elements, add element create requests here,
      // using the pageId.

      // Execute the request.
      return this.slidesService.presentations.batchUpdate({
        presentationId: this.presentationId,
        resource: {
          requests,
        },
      }, (err, res) => {
        console.log(`Created slide with ID: ${res.data.replies[0].createSlide.objectId}`);
        resolve(res);
      });
    });
  }
}

module.exports = SlideFunctions;
