let stream;
const imageUpload = document.getElementById('imageUpload');
const webcamButton = document.getElementById('webcamButton');
const mobileBackButton = document.getElementById('mobileBackButton');
const mobileFrontButton = document.getElementById('mobileFrontButton');
const captureButton = document.getElementById('captureButton');
const webcam = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canopyValue = document.getElementById('canopyValue');

// HSV sliders
const hMinSlider = document.getElementById('hMinSlider');
const sMinSlider = document.getElementById('sMinSlider');
const vMinSlider = document.getElementById('vMinSlider');
const hMaxSlider = document.getElementById('hMaxSlider');
const sMaxSlider = document.getElementById('sMaxSlider');
const vMaxSlider = document.getElementById('vMaxSlider');

// HSV value displays
const hMinValue = document.getElementById('hMinValue');
const sMinValue = document.getElementById('sMinValue');
const vMinValue = document.getElementById('vMinValue');
const hMaxValue = document.getElementById('hMaxValue');
const sMaxValue = document.getElementById('sMaxValue');
const vMaxValue = document.getElementById('vMaxValue');

let currentImage = null;

function updateSliderValues() {
    hMinValue.textContent = hMinSlider.value;
    sMinValue.textContent = sMinSlider.value;
    vMinValue.textContent = vMinSlider.value;
    hMaxValue.textContent = hMaxSlider.value;
    sMaxValue.textContent = sMaxSlider.value;
    vMaxValue.textContent = vMaxSlider.value;
}

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

    // Get HSV range from sliders
    const lowGreen = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [
        parseInt(hMinSlider.value),
        parseInt(sMinSlider.value),
        parseInt(vMinSlider.value),
        0
    ]);
    const highGreen = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [
        parseInt(hMaxSlider.value),
        parseInt(sMaxSlider.value),
        parseInt(vMaxSlider.value),
        255
    ]);

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

// Function to start the camera
function startCamera(facingMode = "environment") {
    stopCamera();
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: facingMode
        } 
    })
    .then(s => {
        stream = s;
        webcam.srcObject = stream;
        webcam.classList.remove('hidden');
        captureButton.classList.remove('hidden');
    })
    .catch(err => console.error("Camera error: ", err));
}

// Function to stop the camera
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        webcam.classList.add('hidden');
        captureButton.classList.add('hidden');
    }
}

// Upload an image
imageUpload.addEventListener('change', (e) => {
    stopCamera();
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            currentImage = canvas;
            processImage(canvas);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Use the webcam (PC)
webcamButton.addEventListener('click', () => {
    startCamera("user");
});

// Use the back camera (Mobile)
mobileBackButton.addEventListener('click', () => {
    startCamera("environment");
});

// Use the front camera (Mobile)
mobileFrontButton.addEventListener('click', () => {
    startCamera("user");
});

// Capture photo from camera
captureButton.addEventListener('click', () => {
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);
    currentImage = canvas;
    processImage(canvas);
});

// Add event listeners for sliders
[hMinSlider, sMinSlider, vMinSlider, hMaxSlider, sMaxSlider, vMaxSlider].forEach(slider => {
    slider.addEventListener('input', () => {
        updateSliderValues();
        if (currentImage) {
            processImage(currentImage);
        }
    });
});

// Initial update of slider values
updateSliderValues();

// Wait for OpenCV.js to be loaded
function onOpenCvReady() {
    console.log('OpenCV.js is ready');
    document.body.classList.add('opencv-ready');
}

// Process frames from the camera in real-time
function processFrame() {
    if (webcam.videoWidth > 0) {
        canvas.width = webcam.videoWidth;
        canvas.height = webcam.videoHeight;
        ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);
        processImage(canvas);
    }
    requestAnimationFrame(processFrame);
}

// Start processing frames when the camera is started
webcam.addEventListener('play', () => {
    processFrame();
});
