/*
Get image, detect and recognize faces, then update src image
*/
function processImage(node) {
  img = new Image();
  img.crossOrigin = "anonymous";
  img.data = node;
  img.onload = async function () {
    const detections = await detectFaces(this);
    const recognitions = recognizeFaces(detections);
    const dataURL = draw(this, detections, recognitions);
    if (dataURL != null) this.data.src = dataURL;
    this.data.style.setProperty("filter", "blur(0px)");
  };
  img.src = node.src;
}

/*
Detect faces from image
*/
async function detectFaces(img) {
  faceapi.matchDimensions(img, { width: img.width, height: img.height });
  const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
  return faceapi.resizeResults(detections, { width: img.width, height: img.height });
}

/*
Recognize faces from image
*/
function recognizeFaces(detections) {
  return detections.map((detection) => faceMatcher.findBestMatch(detection.descriptor));
}

/*
Draw blur over recognized faces
*/
function draw(img, detections, recognitions) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  let recognized = false;
  canvas.width = img.width;
  canvas.height = img.height;
  context.drawImage(img, 0, 0);
  recognitions.forEach((face, index) => {
    if (face.label === "unknown") return;
    recognized = true;
    const box = detections[index]["detection"]["_box"];
    const dimensions = { x: box["_x"], y: box["_y"], height: box["_height"], width: box["_width"] };
    context.beginPath();
    context.rect(dimensions.x, dimensions.y, dimensions.width, dimensions.height);
    context.fillStyle = "red";
    context.fill();
  });
  return recognized ? canvas.toDataURL() : null;
}

/*
Load pre-trained models
*/
async function loadModels() {
  const MODEL_URL = chrome.extension.getURL("models");
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL); // Face detection algorithim
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL); // Face recognition algorithim
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL); // Face landmarks algorithim
}

/*
Get descriptors and landmarks for labeled faces
*/
function loadLabeledImages() {
  const labels = ["Donald Trump"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 8; i++) {
        const img = await faceapi.fetchImage(chrome.extension.getURL(`labeled_images/${label}/${i}.png`));
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      //encode(descriptions)
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

/*
Process dynamically loaded images
*/
function observeMutations() {
  // Setup callback for mutations
  const observer = new MutationObserver(function (mutations) {
    // For every mutation
    mutations.forEach(function (mutation) {
      // For every added element
      mutation.addedNodes.forEach(function (node) {
        // Check if we appended a node type that isn't an element that we can search for images inside, like a text node.
        if (!node.tagName) return;
        const imgs = node.getElementsByTagName("img");
        Array.from(imgs).forEach((img) => {
          processImage(img);
        });
      });
    });
  });
  // Bind mutation observer to document body
  observer.observe(document.body, { childList: true, subtree: true });
}

async function trainFaces() {
  const labeledFaceDescriptors = await loadLabeledImages();
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
  encode(faceMatcher)
}

async function loadFaces() {
  const URL = chrome.extension.getURL("labeled_images/Donald Trump/model.json");
  const response = await fetch(URL);
  const json = await response.json();
  const labeledFaceDescriptors = new faceapi.LabeledFaceDescriptors('Donald Trump', decode(json));
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

}

/*
Encode descriptors to save in file
*/
function encode(obj) {
  const encodedJSON = JSON.stringify(obj, function (key, value) {
    if (
      value instanceof Int8Array ||
      value instanceof Uint8Array ||
      value instanceof Uint8ClampedArray ||
      value instanceof Int16Array ||
      value instanceof Uint16Array ||
      value instanceof Int32Array ||
      value instanceof Uint32Array ||
      value instanceof Float32Array ||
      value instanceof Float64Array
    ) {
      var replacement = {
        constructor: value.constructor.name,
        data: Array.apply([], value),
        flag: "FLAG_TYPED_ARRAY",
      };
      return replacement;
    }
    return value;
  });
  console.log(encodedJSON);
}

/*
Decode descriptors from file
*/
function decode(obj) {
  const context = typeof window === "undefined" ? global : window;
  const json = JSON.stringify(obj)
  const decodedJSON = JSON.parse(json, function (key, value) {
    // the reviver function looks for the typed array flag
    try {
      if ("flag" in value && value.flag === "FLAG_TYPED_ARRAY") {
        // if found, we convert it back to a typed array
        return new context[value.constructor](value.data);
      }
    } catch (e) {}

    // if flag not found no conversion is done
    return value;
  });
  return decodedJSON;
}

// Entry point
document.addEventListener("DOMContentLoaded", async function (event) {
  await loadModels();

  await loadFaces();

  //await trainFaces();

  Array.from(document.images).forEach((img) => {
    processImage(img);
  });

  observeMutations();
});

/*
Matches faces
*/
var faceMatcher;
