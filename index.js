// Gideon Version 0.1
// By Curry

// on document ready
document.addEventListener("DOMContentLoaded", function (event) {
  const typewriterContainer = document.getElementById("typewriter-container");
  const animationDuration = 1000; // Duration of the typing animation in milliseconds
  const recordButton = document.getElementById("recordButton");
  const urlParams = new URLSearchParams(window.location.search);
  const apiKey = urlParams.get("key"); // Get API Key from URL
  const stalls = [
    "one second",
    "hmm, let's see",
    "uh, one moment",
    "got it",
    "ok",
    "just a moment",
    "gotchya",
    "ah",
  ];
  let recording = false;
  let myvad = null;

  function showTime() {
    var date = new Date();
    var h = date.getHours(); // 0 - 23
    var m = date.getMinutes(); // 0 - 59
    var s = date.getSeconds(); // 0 - 59
    var session = "AM";

    if (h == 0) {
      h = 12;
    }

    if (h > 12) {
      h = h - 12;
      session = "PM";
    }

    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    //s = (s < 10) ? "0" + s : s;

    var time = h + ":" + m + " " + session;
    document.getElementById("time").innerText = time;
    document.getElementById("time").textContent = time;

    setTimeout(showTime, 1000);
  }

  showTime();

  function showDate() {
    let dateArea = document.getElementById("date");
    let date = new Date();
    let day = date.getDay();
    //console.log(day);
    if (day == 1) {
      dateArea.innerText = "Monday";
    }
    if (day == 2) {
      dateArea.innerText = "Tuesday";
    }
    if (day == 3) {
      dateArea.innerText = "Wednesday";
    }
    if (day == 4) {
      dateArea.innerText = "Thursday";
    }
    if (day == 5) {
      dateArea.innerText = "Friday";
    }
    if (day == 6) {
      dateArea.innerText = "Saturday";
    }
    if (day == 7) {
      dateArea.innerText = "Sunday";
    }
  }

  showDate();

  function processAudio(audio) {
    const audioDuration = audio.length / 16000;

    if (audioDuration < 0.5) {
      recordButton.innerText = "Speak";
      return false;
    }

    if (audioDuration > 2) {
      speakRandomStall();
    }

    return true;
  }

  function speakRandomStall() {
    speak(stalls[Math.floor(Math.random() * stalls.length)]);
  }

  function postDataToAPI(audio) {
    const wavBuffer = vad.utils.encodeWAV(audio);
    const base64 = vad.utils.arrayBufferToBase64(wavBuffer);

    fetch("https://api.carterlabs.ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audio: base64,
        key: apiKey,
        playerId: "Primary User",
        speak: true,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const responseText = data.output.text;
        const shouldSpeakResponse = processAudio(data.output.audio);

        typewriterContainer.innerHTML = "";

        typewriter(responseText, shouldSpeakResponse);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function typewriter(text, shouldSpeakResponse) {
    const charsPerMillisecond = 0.05;
    const duration = text.length * charsPerMillisecond;

    new Typewriter(typewriterContainer, {
      loop: false,
      duration,
    })
      .typeString(text)
      .callFunction(() => {
        if (shouldSpeakResponse) {
          speak(text);
        }
      })
      .start();
  }

  async function detectFaces() {
    const video = document.getElementById("video");
    const detections = await faceapi.detectSingleFace(video).withFaceLandmarks();
    
    if (detections) {
      // Face detected
      speak("Hey boss");
    }
  }

  async function main() {
    // Load face-api.js models
    await faceapi.loadSsdMobilenetv1Model("face-api/models");
    await faceapi.loadFaceLandmarkModel("face-api/models");

    // Start the webcam stream
    const video = document.getElementById("video");
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          setInterval(detectFaces, 1000); // Call detectFaces function every second
        };
      })
      .catch((error) => {
        console.error("Error accessing the webcam: ", error);
      });

    myvad = await vad.MicVAD.new({
      mode: vad.Mode.VERY_AGGRESSIVE,
      pollInterval: 100,
    });
  }

  recordButton.addEventListener("click", function () {
    if (!recording) {
      recordButton.innerText = "Listening...";
      myvad.start();
      recording = true;
    } else {
      recordButton.innerText = "Speak";
      myvad.stop()
        .then((audio) => {
          recording = false;
          postDataToAPI(audio);
        })
        .catch((error) => {
          console.error("Error recording audio: ", error);
          recording = false;
          recordButton.innerText = "Speak";
        });
    }
  });

  main();
});
