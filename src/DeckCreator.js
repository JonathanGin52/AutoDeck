import React from 'react';
import axios from 'axios';

const webkitSpeechRecognition = window.webkitSpeechRecognition
const SpeechRecognition = webkitSpeechRecognition
const recognition = new SpeechRecognition()

recognition.continous = true
recognition.autoStart = false
recognition.interimResults = true
recognition.lang = 'en-US'

class DeckCreator extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      recognition: recognition,
      transcript: 'Start by saying something',
      count: 0,
    };

    this.toggleListen = this.toggleListen.bind(this)
    this.handleListen = this.handleListen.bind(this)

    this.state.recognition.onresult = this.handleListen

    this.state.recognition.onend = function(event) {
      recognition.start();
    };
  }

  toggleListen() {
    recognition.start();
  }

  handleListen(event) {
    if (event.results[0][0].confidence > 0.90) {
      // console.log(event.results[0][0].transcript);

      axios.post('/api/record', {
        transcript: event.results[0][0].transcript
      });

      if (this.state.count === 3) {
        window.location.reload();
        this.setState({count: 0});
      } else {
        this.setState((oldState) => {
          return {count: oldState.count + 1};
        });
      }
    }
    if (event.results[0][0].confidence > 0.85) {
      this.setState({
        transcript: event.results[0][0].transcript
      });
    }
  }

  componentDidMount() {
    this.toggleListen();
  }

  render() {
    return (
      <div style={{textAlign: "center"}}>
        <div id="google-slides">
          <div id="live-speech">
            <p>{this.state.transcript}</p>
          </div>
        </div>
      </div>
    );
  }
}

export default DeckCreator;
