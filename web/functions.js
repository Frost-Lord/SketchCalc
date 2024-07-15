function UndoDrawing() {
    if (paths.length > 0) {
        paths.pop();
        recalculateBoundingBoxes();
        drawAllBoundingBoxes();
    }
}

function mergeBoxes() {
    let merged = false;
    do {
        merged = false;
        for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
                if (isOverlapping(boxes[i], boxes[j]) || isMostlyWithin(boxes[i], boxes[j])) {
                    boxes[i].minX = Math.min(boxes[i].minX, boxes[j].minX);
                    boxes[i].minY = Math.min(boxes[i].minY, boxes[j].minY);
                    boxes[i].maxX = Math.max(boxes[i].maxX, boxes[j].maxX);
                    boxes[i].maxY = Math.max(boxes[i].maxY, boxes[j].maxY);
                    boxes.splice(j, 1);
                    merged = true;
                    break;
                }
            }
            if (merged) break;
        }
    } while (merged);
    drawAllBoundingBoxes();
}

function unmergeBoxes() {}

function imageProcessing() {}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function numericalIntegrate(f, a, b, n = 1000) {
    const h = (b - a) / n;
    let sum = 0.5 * (f(a) + f(b));
    for (let i = 1; i < n; i++) {
        sum += f(a + i * h);
    }
    return sum * h;
}