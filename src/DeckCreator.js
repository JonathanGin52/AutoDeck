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
      transcript: '',
    };

    recognition.onresult = function(event) {
      if (event.results[0][0].confidence > 0.90) {
        console.log(event.results[0][0].transcript);
        try {
          axios.post('/api/record', {
            transcript: event.results[0][0].transcript
          })
        } catch (err) {}
      }
    };

    recognition.onend = function(event) {
      recognition.start();
    }

    this.toggleListen = this.toggleListen.bind(this)
    this.handleListen = this.handleListen.bind(this)
  }

  toggleListen() {
    this.state.recognition.start();
  }
  
  handleListen(){
    // handle speech recognition here 
  }

  componentDidMount() {
    this.toggleListen();
  }

  render() {
    return (
      <div style={{textAlign: "center"}}>
        <div id="google-slides">
          
        </div>
        <div id="live-speech">
          <p>{this.state.}</p>
        </div>
      </div>
    );
  }
}

export default DeckCreator;
