const speech = require('@google-cloud/speech');
const language = require('@google-cloud/language');
const s2t_client = new speech.SpeechClient();
const nlp_client = new language.LanguageServiceClient();
var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {

	const encoding = 'LINEAR16';
	const sampleRateHertz = 48000;
	const languageCode = 'en-US';

	const request = {
		config: {
			encoding: encoding,
			sampleRateHertz: sampleRateHertz,
			languageCode: languageCode,
		},
		interimResults: false,
	};

	const recognizeStream = s2t_client
		.streamingRecognize(request)
		.on('error', console.error)
		.on('data', data =>
			process.stdout.write(
				data.results[0] && data.results[0].alternatives[0]
					? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
					: `\n\nReached transcription time limit, press Ctrl+C\n`
			)
		);
});

router.post('/nlp/entity_sentiments', function(req, res, next) {
  nlp_request(req, res);
});

function return_response(res, data) {
  console.log(data);
  res.json(data);
}

function nlp_request(req, res) {
  const text = req.body.text;

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };
  nlp_client
    .analyzeEntitySentiment({document})
    .then(results => {
      return_response(res, results[0]);
    })
    .catch(err => {
      return_response(res, { error: err });
    });
}

module.exports = router;
