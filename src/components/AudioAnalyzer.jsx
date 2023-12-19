import React, { useRef, useEffect } from "react";
import * as Pitchfinder from "pitchfinder";

const AudioAnalyzer = () => {
  const canvasRef = useRef(null);
  const pitches = useRef([]); // To store pitch values over time
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
    ctx.beginPath();

    pitches.current.forEach((pitch, index) => {
      const x = (index / 500) * canvas.width;
      const y =
        pitch === 0 ? canvas.height : (1 - pitch / 1000) * canvas.height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
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

      let lastNonNullPitch = 0; // Store the last non-null pitch

      processor.onaudioprocess = function (e) {
        const inputBuffer = e.inputBuffer;
        const float32Array = inputBuffer.getChannelData(0);
        const detectPitch = Pitchfinder.AMDF();
        const pitch = detectPitch(float32Array);

        if (pitch !== null) {
          pitches.current.push(pitch);
          lastNonNullPitch = pitch;
        } else {
          // Simple interpolation for smoothing null values
          const nextNonNullPitch = findNextNonNullPitch(
            pitches.current,
            pitches.current.length,
            lastNonNullPitch
          );
          const interpolatedPitch = (lastNonNullPitch + nextNonNullPitch) / 2;
          pitches.current.push(interpolatedPitch);
        }

        if (pitches.current.length > 500) {
          pitches.current.shift();
        }
      };

      requestRef.current = requestAnimationFrame(draw);
    }
  };

  // Helper function to find the next non-null pitch
  const findNextNonNullPitch = (pitches, startIndex, fallbackPitch) => {
    for (let i = startIndex; i < pitches.length; i++) {
      if (pitches[i] !== null) {
        return pitches[i];
      }
    }
    return fallbackPitch; // If no non-null pitch is found, return the fallback pitch
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
