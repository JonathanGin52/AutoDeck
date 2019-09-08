const {google} = require('googleapis');

class SlideFunctions {
  constructor(auth, presentationId, debugMode = false) {
    this.debugMode = debugMode;
    this.entityList = {};
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
          insertionIndex: params.insertionIndex || this.presentation.slides.length,
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

  async upsertText(params) {
    const {text, entity, delimiter} = params;
    const newEntity = !this.entityList[entity];

    console.log(this.entityList);
    if (newEntity) {
      // await this.createSlide({});
      await this.createTextbox(params);
    }
    await this.appendText(params);

    if (newEntity) {
      this.entityList[entity] = text;
    } else {
      this.entityList[entity] += `${delimiter || '\n'}${text}`;
    }
  }

  createTextbox(params) {
    return new Promise((resolve, reject) => {
      const {pageIndex, entity} = params;

      let requests = [{
        createShape: {
          objectId: entity,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: this.getPageIdFromPageIndex(pageIndex),
            size: {
              height: {
                magnitude: 300,
                unit: 'PT',
              },
              width: {
                magnitude: 600,
                unit: 'PT',
              },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 50,
              translateY: 100,
              unit: 'PT',
            },
          },
        },
      }];

      this.slidesService.presentations.batchUpdate({
        presentationId: this.presentation.presentationId,
        resource: {requests},
      }, async (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        this.presentation = res.data;
        let createShapeResponse = res.data.replies[0].createShape;
        this.debugMode && console.log(`Created textbox with ID: ${createShapeResponse.objectId}`);
        this.presentation = await this.scanSlides();
        resolve(res.data);
      });
    });
  }

  appendText(params) {
    return new Promise((resolve, reject) => {
      const {entity, text} = params;
      let delimiter = params.delimiter || '\n';
      let insertionIndex = 0;
      if (this.entityList[entity] && this.entityList[entity].length !== 0) {
        insertionIndex = this.entityList[entity].length;
      } else {
        delimiter = '';
      }

      let requests = [{
        insertText: {
          text: `${delimiter}${text}`,
          insertionIndex,
          objectId: entity,
        }
      }];

      this.slidesService.presentations.batchUpdate({
        presentationId: this.presentation.presentationId,
        resource: {requests},
      }, async (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        this.presentation = await this.scanSlides();
        resolve(res);
      });
    });
  }

  createHeader(params) {
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
            translateX: 180,
            translateY: 15,
            unit: 'PT',
          },
        },
      },
    },
    {
      insertText: {
        text,
        objectId: elementId,
        insertionIndex: 0,
      },
    },
    {
      updateTextStyle: {
        objectId: elementId,
        style: {
          bold: true,
          fontSize: {
            magnitude: 52,
            unit: 'PT',
          },
        },
        textRange: {
          type: 'ALL',
        },
        fields: 'bold,fontSize',
      },
    },
    {
      updateShapeProperties: {
        objectId: elementId,
        shapeProperties: {
          contentAlignment: 'MIDDLE',
        },
        fields: 'contentAlignment',
      },
    },
    {
      updateParagraphStyle: {
        objectId: elementId,
        style: {
          alignment: 'CENTER',
        },
        textRange: {
          type: 'ALL',
        },
        fields: 'alignment',
      },
    }];

    this.slidesService.presentations.batchUpdate({
      presentationId: this.presentation.presentationId,
      resource: {requests},
    }, async (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      let createShapeResponse = res.data.replies[0].createShape;
      this.debugMode && console.log(`Created textbox with ID: ${createShapeResponse.objectId}`);
      this.presentation = await this.scanSlides();
    });
  }

  createSubheader(params) {
    const {pageIndex, text} = params;

    let elementId = genId(5);
    let requests = [{
      createShape: {
        objectId: elementId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: this.getPageIdFromPageIndex(pageIndex),
          size: {
            height: {
              magnitude: 40,
              unit: 'PT',
            },
            width: {
              magnitude: 650,
              unit: 'PT',
            },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: 35,
            translateY: 30,
            unit: 'PT',
          },
        },
      },
    },
    {
      insertText: {
        text,
        objectId: elementId,
        insertionIndex: 0,
      },
    },
    {
      updateTextStyle: {
        objectId: elementId,
        style: {
          fontSize: {
            magnitude: 28,
            unit: 'PT',
          },
        },
        textRange: {
          type: 'ALL',
        },
        fields: 'fontSize',
      },
    }];

    this.slidesService.presentations.batchUpdate({
      presentationId: this.presentation.presentationId,
      resource: {requests},
    }, async (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      let createShapeResponse = res.data.replies[0].createShape;
      this.debugMode && console.log(`Created textbox with ID: ${createShapeResponse.objectId}`);
      this.presentation = await this.scanSlides();
    });
  }

  createBulletedList(params) {
    const {bulletPreset, objectId} = params;

    let requests = [
      {
        createParagraphBullets: {
          objectId,
          bulletPreset,
          textRange: {
            type: 'ALL',
          },
        }
      }
    ];

    this.slidesService.presentations.batchUpdate({
      presentationId: this.presentation.presentationId,
      resource: {requests},
    }, async (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      this.presentation = await this.scanSlides();
    });
  }

  addImage(params) {
    return new Promise((resolve, reject) => {
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
                translateX: 200,
                translateY: 20,
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
                translateX: 275,
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
        resolve({
          imageId: createImageResponse[0].createImage.objectId,
          textboxId: objectId,
        });
      });
    });
  }

  updateImage(params) {
    return new Promise((resolve, reject) => {
      const {imageUrl, pageIndex, name, portfolioUrl, ids} = params;
      const pageObjectId = this.getPageIdFromPageIndex(pageIndex);
      const objectId = ids.textboxId;
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
                translateX: 200,
                translateY: 20,
                unit: 'PT',
              },
            },
          },
        },
        {
          deleteObject: {
            objectId: ids.imageId,
          },
        },
        {
          deleteText: {
            objectId,
            textRange: {
              type: 'ALL',
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
        resolve({
          imageId: createImageResponse[0].createImage.objectId,
          textboxId: objectId,
        });
      });
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
