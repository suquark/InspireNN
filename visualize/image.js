import { clip_pixel } from 'backend/ops.js';

function Tensor2RawData(rawpixels, t, alpha=255) {
    // rgba
    let offset = 0;  // for tensor
    let pointer = 0; // for rawpixels
    t = t.clone();  // dont disturb origin data
    clip_pixel(t);
    let w = t.w;
    if (t.depth == 1) {
        while (offset < t.size) {
            rawpixels[pointer] = rawpixels[pointer + 1] = rawpixels[pointer + 2] = w[offset];
            rawpixels[pointer + 3] = alpha;
            pointer += 4;
            offset += 1;
        }
    } else if (t.depth == 3) {
        while (offset < t.size) {
            rawpixels[pointer] = w[offset];
            rawpixels[pointer + 1] = w[offset + 1];
            rawpixels[pointer + 2] = w[offset + 2];
            rawpixels[pointer + 3] = alpha;
            pointer += 4;
            offset += 3;
        }
    }
}

function Tensor2CanvasImage(canvas, A, alpha=255) {
    var W = A.sx;
    var H = A.sy;
    var depth = A.depth;
    var ctx = canvas.getContext('2d');
    var g = ctx.createImageData(W, H);
    Tensor2RawData(g.data, A, alpha);
    ctx.putImageData(g, 0, 0);
}

function Tensor2CanvasWithImage(A, alpha=255) {
    var canv = document.createElement('canvas');
    canv.width = A.sx;
    canv.height = A.sy;
    Tensor2CanvasImage(canv, A, alpha);
    return canv;
}

export { Tensor2CanvasImage, Tensor2CanvasWithImage };