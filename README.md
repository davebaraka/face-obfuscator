# face-obfuscator

Face Obfuscator is a chrome browser extension that uses face detection and recognition algorithms to dynamically block pre-trained faces from images loaded in chrome. The extension is powered by the [face-api](https://github.com/justadudewhohacks/face-api.js) javascript library. Images are initially loaded with a gaussian blur, then obfuscated by dynamically adding a red rectanglur box over the recognized faces.

## Getting Started

1. Open the Extension Management page by navigating to chrome://extensions.

2. The Extension Management page can also be opened by clicking on the Chrome menu, hovering over More Tools then selecting Extensions.

3. Enable Developer Mode by clicking the toggle switch next to Developer mode.

4. Click the LOAD UNPACKED button and select the extension directory.

**Note:** The extension is slow on iniital navigation to website.

## Development

Face descriptors were generated from images under `labeled_images` and saved in a `model.json` file. These descriptors are loaded on every site navigation. Improvements to this injection to speed the dynamic manipualtion should be explored. There are also some errors on continually applying the face detection and recoginiton algorithims on dynamically loaded images. This continual application is driven by the javascript mutation observer.

We also use modify the 'access-control-allow-origin' header from requested images in order to bypass CORS protocol. This allows us to read and modify images downloaded from other origins in the HTML5 canvas.

## Contribute

The extension was developed as an academic project and we intend for this project to be more as an educational resource, learn by open sourcing. We are open for feedback and contribution.
