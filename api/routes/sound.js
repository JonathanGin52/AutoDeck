const speech = require('@google-cloud/speech');
const language = require('@google-cloud/language');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.post('/', function(req, res, next) {
	const client = new speech.SpeechClient();

	const encoding = 'LINEAR16';
	const sampleRateHertz = 48000;
	const languageCode = 'en-US';

	const request = {
		config: {
			encoding: encoding,
			sampleRateHertz: sampleRateHertz,
			languageCode: languageCode,
		},
		interimResults: false, // If you want interim results, set this to true
	};

	// Create a recognize stream
	const recognizeStream = client
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

router.post('/nlp', function(req, res, next) {
  const client = new language.LanguageServiceClient();

  // The text to analyze
  const text = req.body.text;

  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  // Detects the sentiment of the text
  client
    .analyzeSentiment({document: document})
    .then(results => {
      const sentiment = results[0].documentSentiment;

      console.log(`Text: ${text}`);
      console.log(`Sentiment score: ${sentiment.score}`);
      console.log(`Sentiment magnitude: ${sentiment.magnitude}`);
      res.json({ 
        text: text,
        sentiment_score: sentiment.score,
        sentiment_magnitude: sentiment.magnitude,
      });
    })
    .catch(err => {
      res.json({
        error: err
      });
    });
});

module.exports = router;
