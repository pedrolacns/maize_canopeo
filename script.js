let stream;
const imageUpload = document.getElementById('imageUpload');
const webcamButton = document.getElementById('webcamButton');
const captureButton = document.getElementById('captureButton');
const webcam = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canopyValue = document.getElementById('canopyValue');

// Function to process the image and calculate canopy cover
function processImage(image) {
    if (typeof cv === 'undefined') {
        console.error('OpenCV.js is not loaded. Please check your internet connection and reload the page.');
        return;
    }

    const src = cv.imread(image);
    const dst = new cv.Mat();
    const hsv = new cv.Mat();
    const mask = new cv.Mat();

    // Convert the image to HSV color space
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

    // Define the range of green color in HSV
    const lowGreen = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [35, 30, 30, 0]);
    const highGreen = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [85, 255, 255, 255]);

    // Create a mask for green pixels
    cv.inRange(hsv, lowGreen, highGreen, mask);

    // Calculate the percentage of green pixels (canopy cover)
    const totalPixels = mask.rows * mask.cols;
    const greenPixels = cv.countNonZero(mask);
    const canopyCover = ((greenPixels / totalPixels) * 100).toFixed(2);

    // Display the result
    canopyValue.style.display = 'block';
    canopyValue.textContent = `Canopy Cover: ${canopyCover}%`;

    // Apply the mask to the original image
    cv.bitwise_and(src, src, dst, mask);

    // Draw the result on the canvas
    cv.imshow('canvas', dst);

    // Clean up
    src.delete(); dst.delete(); hsv.delete(); mask.delete(); lowGreen.delete(); highGreen.delete();
}

// Function to start the webcam
function startWebcam() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
            stream = s;
            webcam.srcObject = stream;
            webcam.classList.remove('hidden');
            captureButton.classList.remove('hidden');
        })
        .catch(err => console.error("Webcam error: ", err));
}

// Function to stop the webcam
function stopWebcam() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        webcam.classList.add('hidden');
        captureButton.classList.add('hidden');
    }
}

// Upload an image
imageUpload.addEventListener('change', (e) => {
    stopWebcam();
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            processImage(canvas);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Use the webcam
webcamButton.addEventListener('click', () => {
    startWebcam();
});

// Capture photo from webcam
captureButton.addEventListener('click', () => {
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);
    processImage(canvas);
});

// Wait for OpenCV.js to be loaded
function onOpenCvReady() {
    console.log('OpenCV.js is ready');
    document.body.classList.add('opencv-ready');
}
