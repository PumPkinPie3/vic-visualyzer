const start = document.querySelector('#start');
const stop = document.querySelector('#stop');
const play = document.querySelector('#play');
const canvas = document.querySelector('#canvas');
const drawContext = canvas.getContext('2d');
const cw = canvas.width;
const ch = canvas.height;

let mediaRecorder = null;
let mediaStream = null;
let audio = null;

start.addEventListener('click', () => {
  start.disabled = true;
  stop.disabled = false;

  const chunks = [];
  mediaRecorder = new MediaRecorder(mediaStream, {
    mimeType: 'audio/webm'
  });

  mediaRecorder.addEventListener('dataavailable', e => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  });

  mediaRecorder.addEventListener('stop', ()　=> {
    audio = new Audio(URL.createObjectURL(new Blob(chunks)));
  });

  mediaRecorder.start();
});

stop.addEventListener('click', () => {
  if (mediaRecorder === null) {
    return;
  }

  start.disabled = false;
  stop.disabled = true;
  play.disabled = false;

  mediaRecorder.stop();
  mediaRecorder = null;
});

play.addEventListener('click', () => {
  audio.play();
});

navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
  mediaStream = stream;

  const audioContext = new AudioContext();
  const sourceNode = audioContext.createMediaStreamSource(stream);
  const analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 2048;
  analyserNode.minDecibels = -60;  // Default -100 dB
  analyserNode.maxDecibels = -0;  // Default  -30 dB

  var paddingTop    = 20;
  var paddingBottom = 20;
  var paddingLeft   = 30;
  var paddingRight  = 30;

  var iw  = cw  - paddingLeft - paddingRight;
  var ih = ch - paddingTop - paddingBottom;
  var ib = ch - paddingBottom;

  const range = analyserNode.maxDecibels - analyserNode.minDecibels;

  // Frequency resolution
  const fsDivN = audioContext.sampleRate / analyserNode.fftSize;

   // This value is the number of samples during 500 Hz
   const n500Hz = Math.floor(500 / fsDivN);

  sourceNode.connect(analyserNode);

  function draw() {
    const array = new Float32Array(analyserNode.frequencyBinCount / 8);
    analyserNode.getFloatFrequencyData(array);
    const barWidth = cw / analyserNode.frequencyBinCount;

    // init
    drawContext.fillStyle = 'rgba(0, 0, 0, 1)';
    drawContext.fillRect(0, 0, cw, ch);

    drawContext.beginPath();

    for (let i = 0, len = array.length; i < len; ++i) {
      const x = Math.floor((i / len) * iw) + paddingLeft;
      const y = Math.floor(-1 * ((array[i] - analyserNode.maxDecibels) / range) * ih) + paddingTop;

      if (i === 0) {
        drawContext.moveTo(x, y);
      } else {
        drawContext.lineTo(x, y);
      }

      if (i % n500Hz === 0) {
        const text = (500 * (i / n500Hz) / 1000) + 'kHz';  // index -> frequency

        // Draw grid (X)
        drawContext.fillStyle = 'rgba(255, 0, 0, 1.0)';
        drawContext.fillRect(x, paddingTop, 1, ih);

        // Draw text (X)
        drawContext.fillStyle = 'rgba(255, 255, 255, 1.0)';
        drawContext.font      = '12px "Times New Roman"';
        drawContext.fillText(text, (x - (drawContext.measureText(text).width / 2)), (ch - 3));
      }
    }

    drawContext.strokeStyle = 'rgba(0, 0, 255, 1.0)';
    drawContext.lineWidth   = 2;
    drawContext.lineCap     = 'round';
    drawContext.lineJoin    = 'miter';
    drawContext.stroke();

    for (let i = analyserNode.minDecibels; i <= analyserNode.maxDecibels; i += 10) {
      const gy = Math.floor(-1 * ((i - analyserNode.maxDecibels) / range) * ih) + paddingTop;

      // Draw grid (Y)
      drawContext.fillStyle = 'rgba(255, 0, 0, 1.0)';
      drawContext.fillRect(paddingLeft, gy, iw, 1);

      // Draw text (Y)
      drawContext.fillStyle = 'rgba(255, 255, 255, 1.0)';
      drawContext.font      = '10px "Times New Roman"';
      drawContext.fillText((i + ' dB'), 3, gy);
    }
    requestAnimationFrame(draw);
  }

  draw();
}).catch(error => {
  console.log(error);
});
