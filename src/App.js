import React from 'react';
import './App.css';

class App extends React.Component {
  render() {
    return (
      <div id="home-page">
        <header className="masthead d-flex">
          <div className="container text-center my-auto">
            <h1 className="mb-1">Stylish Portfolio</h1>
            <h3 className="mb-5" style={{color: "#eee", textShadow: "2px 2px 5px #333"}}>
              <em>A Free Bootstrap Theme by Start Bootstrap</em>
            </h3>
            <a className="btn btn-primary btn-xl js-scroll-trigger" href="#about">Find Out More</a>
          </div>
          <div className="overlay"></div>
        </header>
      </div>
    );
  }
}

export default App;
