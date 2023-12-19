import * as Pitchfinder from "pitchfinder";

const AudioAnalyzer = () => {
  const analyze = async () => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    if (!navigator?.mediaDevices?.getUserMedia) {
      // No audio allowed
      alert("Sorry, getUserMedia is required for the app.");
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create a MediaStreamSource from the stream
      const source = audioContext.createMediaStreamSource(stream);

      // Create a ScriptProcessorNode
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      // Connect the source to the processor and the processor to the destination
      source.connect(processor);
      processor.connect(audioContext.destination);

      // Event handler to process audio buffer
      processor.onaudioprocess = function (e) {
        // Get the input buffer
        const inputBuffer = e.inputBuffer;
        const float32Array = inputBuffer.getChannelData(0);

        const detectPitch = Pitchfinder.AMDF();
        const pitch = detectPitch(float32Array);

        console.log(inputBuffer);
        console.log(pitch);
      };
    }
  };

  return (
    <>
      <button onClick={analyze} type="button">
        Start
      </button>
    </>
  );
};

export default AudioAnalyzer;
