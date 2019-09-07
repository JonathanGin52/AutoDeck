const {google} = require('googleapis');

class SlideFunctions {
  constructor(auth, presentationId) {
    return (async () => {
      this.slidesService = google.slides({version: 'v1', auth});

      // Begin keeping track of a client side model of the slide deck
      this.presentation = {
        presentationId: presentationId || this.createPresentation(),
      };
      await this.scanSlides();

      return this;
    })();
  }

  scanSlides() {
    return new Promise((resolve, reject) => {
      this.slidesService.presentations.get({
        presentationId: this.presentation.presentationId,
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        this.presentation = res.data;
        resolve('Done');
      });
    });
  }

  createPresentation(title = 'Demo') {
    this.slidesService.presentations.create({
      title,
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      this.presentation = res.data;
      console.log(`Created presentation with ID: ${res.data.presentationId}`);
    });
  }

  createSlide(params) {
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
      presentationId: this.presentation.presentationId,
      resource: {
        requests,
      },
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      console.log(`Created slide with ID: ${res.data.replies[0].createSlide.objectId}`);
      this.presentation = res.data;
    });
  }

  createTextboxWithText(pageIndex) {
    let elementId = 'MyTextBox_01';
    let pt350 = {
      magnitude: 350,
      unit: 'PT',
    };
    let requests = [{
      createShape: {
        objectId: elementId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: this.getPageIdFromPageIndex(pageIndex),
          size: {
            height: pt350,
            width: pt350,
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 350,
            translateY: 100,
            unit: 'PT',
          },
        },
      },
    },
    // Insert text into the box, using the supplied element ID.
    {
      insertText: {
        objectId: elementId,
        insertionIndex: 0,
        text: 'New Box Text Inserted!',
      },
    }];
      // Execute the request.
    this.slidesService.presentations.batchUpdate({
      presentationId: this.presentation.presentationId,
      resource: {requests},
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      this.presentation = res.data;
      let createShapeResponse = res.data.replies[0].createShape;
      console.log(`Created textbox with ID: ${createShapeResponse.objectId}`);
    });
  }

  getPageIdFromPageIndex(pageIndex) {
    //console.log(this.presentation);
    if (pageIndex < 1 || pageIndex > this.presentation.slides.length) {
      throw new PageIndexOutOfBoundsException(`Page ${pageIndex} is out of range `);
    }
    return this.presentation.slides[pageIndex - 1].objectId;
  }
}

class PageIndexOutOfBoundsException extends Error {}

module.exports = SlideFunctions;
