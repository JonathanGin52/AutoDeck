const {google} = require('googleapis');

class SlideFunctions {
  constructor(auth, presentationId, debugMode = false) {
    this.debugMode = debugMode;
    return (async () => {
      this.slidesService = google.slides({version: 'v1', auth});

      // Begin keeping track of a client side model of the slide deck
      this.presentation = {
        presentationId: presentationId || this.createPresentation(),
      };
      this.presentation = await this.scanSlides();

      return this;
    })();
  }

  scanSlides() {
    return new Promise((resolve, reject) => {
      this.slidesService.presentations.get({
        presentationId: this.presentation.presentationId,
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        resolve(res.data);
      });
    });
  }

  createPresentation(title = 'Demo') {
    this.slidesService.presentations.create({
      title,
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      this.presentation = res.data;
      this.debugMode && console.log(`Created presentation with ID: ${res.data.presentationId}`);
    });
  }

  createSlide(params) {
    return new Promise((resolve, reject) => {
      let requests = [{
        createSlide: {
          insertionIndex: params.insertionIndex || this.presentation.slides.length - 1,
          slideLayoutReference: {
            predefinedLayout: params.predefinedLayout || 'BLANK',
          },
        },
      }];

      return this.slidesService.presentations.batchUpdate({
        presentationId: this.presentation.presentationId,
        resource: {
          requests,
        },
      }, async (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        this.debugMode && console.log(`Created slide with ID: ${res.data.replies[0].createSlide.objectId}`);
        // createSlide response doesn't return slidedeck model, therefore we must manually update model via scanSlides
        this.presentation = await this.scanSlides();
      });
    });
  }

  createTextboxWithText(params) {
    const {pageIndex, text} = params;

    let elementId = genId(5);
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
        text,
        objectId: elementId,
        insertionIndex: 0,
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
      this.debugMode && console.log(`Created textbox with ID: ${createShapeResponse.objectId}`);
    });
  }

  addImage(params) {
    const {imageUrl, pageIndex, name, portfolioUrl} = params;
    const pageObjectId = this.getPageIdFromPageIndex(pageIndex);
    const objectId = genId(5);
    const imageCreds = `Captured by: ${name}`;

    let pt350 = {
      magnitude: 350,
      unit: 'PT',
    };
    let requests = [
      {
        createImage: {
          url: imageUrl,
          elementProperties: {
            pageObjectId,
            size: {
              height: pt350,
              width: pt350,
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 375,
              translateY: 25,
              unit: 'PT',
            },
          },
        },
      },
      {
        createShape: {
          objectId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId,
            size: {
              height: pt350,
              width: pt350,
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 425,
              translateY: 370,
              unit: 'PT',
            },
          },
        },
      },
      {
        insertText: {
          text: imageCreds,
          objectId,
          insertionIndex: 0,
        },
      },
      {
        updateTextStyle: {
          objectId,
          textRange: {
            type: 'ALL',
          },
          style: {
            italic: true,
            fontSize: {
              magnitude: 10,
              unit: 'PT',
            },
          },
          fields: 'fontSize,italic',
        }
      },
      {
        updateTextStyle: {
          objectId,
          textRange: {
            startIndex: 13,
            type: 'FROM_START_INDEX',
          },
          style: {
            link: {
              url: portfolioUrl,
            },
          },
          fields: 'link',
        },
      },
    ];

    this.slidesService.presentations.batchUpdate({
      presentationId: this.presentation.presentationId,
      resource: {requests},
    }, async (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      let createImageResponse = res.data.replies;
      this.debugMode && console.log(`Created image with ID: ${createImageResponse[0].createImage.objectId}`);
      this.presentation = await this.scanSlides();
    });
  }

  getPageIdFromPageIndex(pageIndex) {
    if (!pageIndex) {
      const length = this.presentation.slides.length;
      return this.presentation.slides[length - 1].objectId;
    }
    if (pageIndex < 1 || pageIndex > this.presentation.slides.length) {
      throw new PageIndexOutOfBoundsException(`Page ${pageIndex} is out of range `);
    }
    return this.presentation.slides[pageIndex - 1].objectId;
  }
}

class PageIndexOutOfBoundsException extends Error {}

function genId(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

module.exports = SlideFunctions;
