import { useState } from "react";
import "./App.css";

import AudioAnalyzer from "./components/AudioAnalyzer";

function App() {
  return (
    <>
      <h1>VoiceToolbox</h1>
      <AudioAnalyzer />
    </>
  );
}

export default App;
