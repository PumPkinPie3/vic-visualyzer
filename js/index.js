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
  sourceNode.connect(analyserNode);

  function draw() {
    const array = new Uint8Array(analyserNode.fftSize);
    analyserNode.getByteTimeDomainData(array);
    const barWidth = cw / analyserNode.fftSize;
    drawContext.fillStyle = 'rgba(0, 0, 0, 1)';
    drawContext.fillRect(0, 0, cw, ch);

    for (let i = 0; i < analyserNode.fftSize; ++i) {
      const value = array[i];
      const percent = value / 255;
      const height = ch * percent;
      const offset = ch - height;

      drawContext.fillStyle = 'lime';
      drawContext.fillRect(i * barWidth, offset, barWidth, 2);
    }

    requestAnimationFrame(draw);
  }

  draw();
}).catch(error => {
  console.log(error);
});
