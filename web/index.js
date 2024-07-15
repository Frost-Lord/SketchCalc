const canvas = document.getElementById('drawingCanvas');
const context = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.6;

let drawing = false;
let currentPath = [];
let paths = [];
let boxes = [];

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);

function startDrawing(event) {
    drawing = true;
    currentPath = [];
    context.beginPath();
    context.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
}

function stopDrawing() {
    if (!drawing) return;
    drawing = false;
    paths.push(currentPath);
    const newBox = calculateBoundingBox(currentPath);
    mergeBoundingBoxes(newBox);
}

function draw(event) {
    if (!drawing) return;

    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;

    context.lineWidth = 5;
    context.lineCap = 'round';
    context.strokeStyle = 'black';

    context.lineTo(x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);

    currentPath.push({ x, y });
}

function calculateBoundingBox(path) {
    if (path.length === 0) return null;

    let minX = path[0].x;
    let minY = path[0].y;
    let maxX = path[0].x;
    let maxY = path[0].y;

    for (const point of path) {
        if (point.x < minX) minX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.x > maxX) maxX = point.x;
        if (point.y > maxY) maxY = point.y;
    }

    return { minX, minY, maxX, maxY, predicted_label: '' };
}

function mergeBoundingBoxes(newBox) {
    if (!newBox) return;

    let merged = false;
    for (const box of boxes) {
        if (isOverlapping(box, newBox) || isMostlyWithin(box, newBox)) {
            box.minX = Math.min(box.minX, newBox.minX);
            box.minY = Math.min(box.minY, newBox.minY);
            box.maxX = Math.max(box.maxX, newBox.maxX);
            box.maxY = Math.max(box.maxY, newBox.maxY);
            merged = true;
        }
    }

    if (!merged) {
        boxes.push(newBox);
    }
}

function isOverlapping(box1, box2) {
    return !(box1.maxX < box2.minX ||
             box1.minX > box2.maxX ||
             box1.maxY < box2.minY ||
             box1.minY > box2.maxY);
}

function isMostlyWithin(largeBox, smallBox) {
    const overlapMinX = Math.max(largeBox.minX, smallBox.minX);
    const overlapMinY = Math.max(largeBox.minY, smallBox.minY);
    const overlapMaxX = Math.min(largeBox.maxX, smallBox.maxX);
    const overlapMaxY = Math.min(largeBox.maxY, smallBox.maxY);

    const overlapWidth = overlapMaxX - overlapMinX;
    const overlapHeight = overlapMaxY - overlapMinY;

    if (overlapWidth <= 0 || overlapHeight <= 0) {
        return false;
    }

    const overlapArea = overlapWidth * overlapHeight;
    const smallBoxArea = (smallBox.maxX - smallBox.minX) * (smallBox.maxY - smallBox.minY);

    return (overlapArea / smallBoxArea) > 0.5;
}

function drawAllBoundingBoxes() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    redrawAllPaths();

    context.strokeStyle = 'red';
    context.lineWidth = 2;

    for (const box of boxes) {
        context.strokeRect(box.minX, box.minY, box.maxX - box.minX, box.maxY - box.minY);
        if (box.predicted_label) {
            context.fillStyle = 'black';
            context.font = '16px Arial';
            context.fillText(box.predicted_label, box.minX, box.minY - 5);
        }
    }
}

function redrawAllPaths() {
    for (const path of paths) {
        context.beginPath();
        context.moveTo(path[0].x, path[0].y);
        for (const point of path) {
            context.lineTo(point.x, point.y);
        }
        context.strokeStyle = 'black';
        context.lineWidth = 5;
        context.stroke();
        context.beginPath();
    }
}

function sendBoxToServer(box, callback) {
    const boxCanvas = document.createElement('canvas');
    const boxContext = boxCanvas.getContext('2d');
    const width = 110;
    const height = 100;
    
    const boxWidth = box.maxX - box.minX;
    const boxHeight = box.maxY - box.minY;

    boxCanvas.width = width;
    boxCanvas.height = height;

    boxContext.fillStyle = getRandomColor();
    boxContext.fillRect(0, 0, width, height);

    const scaleX = width / boxWidth;
    const scaleY = height / boxHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = boxWidth * scale;
    const scaledHeight = boxHeight * scale;

    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    boxContext.drawImage(canvas, box.minX, box.minY, boxWidth, boxHeight, offsetX, offsetY, scaledWidth, scaledHeight);

    boxCanvas.toBlob(function(blob) {
        const formData = new FormData();
        formData.append('file', blob, 'box.png');

        fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            callback(null, data.predicted_label);
        })
        .catch((error) => {
            callback(error, null);
        });
    }, 'image/png');
}

function parseDrawing() {
    const outputbox = document.getElementById('parseOutput');
    outputbox.value = 'Parsed drawing data...';
    let output = '';
    boxes.forEach(box => {
        sendBoxToServer(box, (error, predicted_label) => {
            if (error) {
                console.error('Error:', error);
                return;
            }
            box.predicted_label = predicted_label;
            const evaluationOutput = document.getElementById('evaluationOutput');
            evaluationOutput.value += `Box: (${box.minX}, ${box.minY}, ${box.maxX}, ${box.maxY}) - Predicted Label: ${predicted_label}\n`;
            output += predicted_label;
            drawAllBoundingBoxes();
            outputbox.value = output;
        });
    });
}

function deleteDrawing() {}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    paths = [];
    boxes = [];
}

function mergeBoxes() {}

function unmergeBoxes() {}

function parseAndEvaluate() {
    document.getElementById('evaluationOutput').value = 'Evaluation result...';
}

function imageProcessing() {}

function measureElapsedTime(callback) {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    document.getElementById('elapsedTime').value = (endTime - startTime).toFixed(2) + ' ms';
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function SaveToDataset() {
    boxes.forEach(box => {
        const boxCanvas = document.createElement('canvas');
        const boxContext = boxCanvas.getContext('2d');
        const width = 110;
        const height = 100;
        
        const boxWidth = box.maxX - box.minX;
        const boxHeight = box.maxY - box.minY;

        boxCanvas.width = width;
        boxCanvas.height = height;

        boxContext.fillStyle = getRandomColor();
        boxContext.fillRect(0, 0, width, height);

        const scaleX = width / boxWidth;
        const scaleY = height / boxHeight;
        const scale = Math.min(scaleX, scaleY);

        const scaledWidth = boxWidth * scale;
        const scaledHeight = boxHeight * scale;

        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        boxContext.drawImage(canvas, box.minX, box.minY, boxWidth, boxHeight, offsetX, offsetY, scaledWidth, scaledHeight);

        const label = prompt('Enter a label for this box:');

        boxCanvas.toBlob(function(blob) {
            const formData = new FormData();
            formData.append('file', blob, 'box.png');
            formData.append('label', label);

            fetch('http://127.0.0.1:5000/save', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                callback(null, data.predicted_label);
            })
            .catch((error) => {
                callback(error, null);
            });
        }, 'image/png');
    });
    drawAllBoundingBoxes();
}
