const startVideo = async video => {
  try {
    const constraints = { audio: false, video: {} };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
  } catch (error) {
    console.error(error);
  }
};

const loadModels = async () => {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(`/js/lib/models`)
  ]);
};

(async () => {
  const video = document.querySelector("video");
  // 表示するimageを先に宣言
  const image = new Image();
  image.src = `/images/cage_neutral.png`;
  await loadModels();
  await startVideo(video);
  video.addEventListener("play", () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
    const tinyFaceDetectorOption = {
      // default 416
      inputSize: 224,
      // default 0.5
      scoreThreshold: 0.5
    };
    setInterval(async () => {
      const results = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions(tinyFaceDetectorOption)
      );
      if (results.length <= 0) return;
      const resizedResults = faceapi.resizeResults(results, displaySize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      resizedResults.forEach(detection => {
        // 矩形のtopはデコあたりなので調整
        const marginVal = 0.4;
        // 矩形の情報はdetection.boxに格納されている
        const width = detection.box.width;
        const height = detection.box.height * (1.0 + marginVal);
        const x = detection.box.x;
        const y = detection.box.y - detection.box.height * marginVal;

        canvas
          .getContext("2d")
          .drawImage(image, x - 50, y - 50, width + 50, height + 50);
      });
    }, 100);
  });
})();
