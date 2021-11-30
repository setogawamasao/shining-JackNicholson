// 開発環境判定
const hostName = document.location.hostname;
let gitPagesPath;
if (hostName == "localhost" || hostName == "127.0.0.1") {
  gitPagesPath = "";
} else {
  gitPagesPath = "/shining-JackNicholson";
}

// iOS判定
const ua = navigator.userAgent;
const isIOS =
  ua.indexOf("iPhone") >= 0 ||
  ua.indexOf("iPad") >= 0 ||
  navigator.userAgent.indexOf("iPod") >= 0;

// ビデオ開始
const startVideo = async (video) => {
  let videoSetting;
  if (isIOS) {
    videoSetting = { facingMode: { exact: "user" }, width: 373, height: 480 };
  } else {
    videoSetting = {};
  }
  try {
    const constraints = {
      audio: false,
      video: videoSetting,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
  } catch (error) {
    window.alert(`${error.name} : ${error.message}`);
  }
};

// 顔認識モデルの読み込み
const loadModels = async () => {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(`${gitPagesPath}/js/lib/models`),
    faceapi.nets.faceExpressionNet.loadFromUri(`${gitPagesPath}/js/lib/models`),
  ]);
};

// 画像の読込
const createImageElm = (path) => {
  const image = new Image();
  image.src = path;
  return image;
};

// メイン処理
(async () => {
  const video = document.querySelector("video");
  if (isIOS) {
    video.width = window.innerWidth;
    video.height = window.innerWidth * (7 / 9);
  } else {
    video.width = 720;
    video.height = 560;
  }

  await loadModels();
  await startVideo(video);

  video.addEventListener("play", () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
    const tinyFaceDetectorOption = { inputSize: 224, scoreThreshold: 0.5 };
    const doorLeftImage = createImageElm(
      `${gitPagesPath}/images/door_left.png`
    );
    const doorRightImage = createImageElm(
      `${gitPagesPath}/images/door_right.png`
    );
    const videoWidth = video.width;
    const videoHeight = video.height;
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
        const doorRightWidth = videoWidth - (x + width) + rightMargin;
        const expression = result.expressions.asSortedArray()[0].expression;
        if (expression === "happy") {
          canvas
            .getContext("2d")
            .drawImage(doorLeftImage, 0, 0, doorLeftWidth, videoHeight);

          canvas
            .getContext("2d")
            .drawImage(
              doorRightImage,
              x + width - rightMargin,
              0,
              doorRightWidth,
              videoHeight
            );
        }
      });
    }, 100);
  });
})();
