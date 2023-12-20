import React, { useRef, useEffect } from "react";
import * as Pitchfinder from "pitchfinder";

const VALUES_TO_STORE = 60;
const MAX_DRAWABLE_PITCH = 350;

const AudioAnalyzer = () => {
  const canvasRef = useRef(null);
  const pitches = useRef(Array(VALUES_TO_STORE).fill(null));
  const requestRef = useRef(); // To store the requestAnimationFrame reference

  useEffect(() => {
    return () => {
      cancelAnimationFrame(requestRef.current); // Cleanup the animation frame on component unmount
    };
  }, []);

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const maxPitch = 350; // Maximum pitch for scaling

    // Calculate y-coordinates for 170 Hz and 190 Hz
    const y170Hz = (1 - 170 / maxPitch) * canvas.height;
    const y190Hz = (1 - 190 / maxPitch) * canvas.height;

    // Fill above 190 Hz with transparent pink
    ctx.fillStyle = "rgba(255, 192, 203, 0.3)"; // Transparent pink color
    ctx.fillRect(0, 0, canvas.width, y190Hz);

    // Fill below 170 Hz with transparent blue
    ctx.fillStyle = "rgba(173, 216, 230, 0.3)"; // Transparent blue color
    ctx.fillRect(0, y170Hz, canvas.width, canvas.height - y170Hz);

    // Draw permanent lines and labels at specific pitches
    const specificPitches = [50, 100, 170, 190, 200, 250, 300];
    ctx.font = "10px Arial"; // Font for the labels
    ctx.fillStyle = "#666"; // Color for the labels

    specificPitches.forEach((pitch) => {
      const y = (1 - pitch / maxPitch) * canvas.height;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.strokeStyle = "#ddd"; // Light grey color for the lines
      ctx.stroke();

      ctx.fillText(`${pitch} Hz`, 5, y - 2); // Position the label slightly above the line
    });

    // Draw pitch data
    ctx.beginPath();
    ctx.strokeStyle = "#000"; // Black color for the pitch data
    let moveToNext = true;

    pitches.current.forEach((pitch, index) => {
      if (pitch !== null) {
        const x = (index / pitches.current.length) * canvas.width;
        const y = (1 - pitch / maxPitch) * canvas.height;

        if (moveToNext) {
          ctx.moveTo(x, y);
          moveToNext = false;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        moveToNext = true;
      }
    });

    ctx.stroke();

    requestRef.current = requestAnimationFrame(draw);
  };

  const analyze = async () => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    if (!navigator?.mediaDevices?.getUserMedia) {
      alert("Sorry, getUserMedia is required for the app.");
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContext.destination);

      let lastNonNullPitch = null;
      let nullCounter = 0; // Counter for nulls after a non-null pitch

      processor.onaudioprocess = function (e) {
        const inputBuffer = e.inputBuffer;
        const float32Array = inputBuffer.getChannelData(0);
        const detectPitch = Pitchfinder.AMDF();
        const pitch = detectPitch(float32Array);

        if (pitch !== null) {
          pitches.current.push(pitch);
          lastNonNullPitch = pitch;
          nullCounter = 0;
        } else {
          if (nullCounter < 3 && lastNonNullPitch !== null) {
            pitches.current.push(lastNonNullPitch);
            nullCounter++;
          } else {
            pitches.current.push(null); // Once the counter exceeds 5, push null
          }
        }

        // Keep the pitches array at a manageable size
        if (pitches.current.length > VALUES_TO_STORE) {
          pitches.current.shift();
        }
      };

      requestRef.current = requestAnimationFrame(draw);
    }
  };

  return (
    <>
      <button onClick={analyze} type="button">
        Start
      </button>
      <canvas ref={canvasRef} width="600" height="600" />
    </>
  );
};

export default AudioAnalyzer;
