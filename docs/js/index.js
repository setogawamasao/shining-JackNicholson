// switch at upload to git
// const gitPagesPath = "";
const gitPagesPath = "";

const startVideo = async (video) => {
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
    faceapi.nets.tinyFaceDetector.loadFromUri(`${gitPagesPath}/js/lib/models`),
    faceapi.nets.faceExpressionNet.loadFromUri(`${gitPagesPath}/js/lib/models`),
  ]);
};

const createImageElm = (path) => {
  const image = new Image();
  image.src = path;
  return image;
};

(async () => {
  const video = document.querySelector("video");
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
      scoreThreshold: 0.5,
    };
    const doorLeftImage = createImageElm(
      `${gitPagesPath}/images/door_left.png`
    );
    const doorRightImage = createImageElm(
      `${gitPagesPath}/images/door_right.png`
    );
    setInterval(async () => {
      const results = await faceapi
        .detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions(tinyFaceDetectorOption)
        )
        .withFaceExpressions();
      if (results.length <= 0) return;
      const resizedResults = faceapi.resizeResults(results, displaySize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      resizedResults.forEach((result) => {
        const detection = result.detection;
        const width = detection.box.width;
        const height = detection.box.height;
        const x = detection.box.x;
        const y = detection.box.y;
        const leftMargin = width * 0.2;
        const rightMargin = width * 0.35;
        const doorLeftWidth = x + leftMargin;
        const doorRightWidth = 720 - (x + width) + rightMargin;
        const expression = result.expressions.asSortedArray()[0].expression;
        if (expression === "angry") {
          canvas
            .getContext("2d")
            .drawImage(doorLeftImage, 0, 0, doorLeftWidth, 560);

          canvas
            .getContext("2d")
            .drawImage(
              doorRightImage,
              x + width - rightMargin,
              0,
              doorRightWidth,
              560
            );
        }
      });
    }, 100);
  });
})();
