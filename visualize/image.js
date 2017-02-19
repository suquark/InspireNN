function clip_pixel(x) {
    if (x > 1) return 255;
    else if (x < -1) return 0;
    else return 255 * (x + 1.0) / 2.0;
}

function getPixel(A, x, y, d) {
    return A.w[((A.sx * y) + x) * A.depth + d];
}

function Tensor2CanvasImage(canvas, A, scale = 1, alpha=255) {
    var s = scale;
    var W = A.sx * s;
    var H = A.sy * s;

    var ctx = canvas.getContext('2d');
    var g = ctx.createImageData(W, H);
    for (var d = 0; d < 3; d++) {
        for (var x = 0; x < A.sx; x++) {
            for (var y = 0; y < A.sy; y++) {
                var dval = clip_pixel(getPixel(A, x, y, d));
                for (var dx = 0; dx < s; dx++) {
                    for (var dy = 0; dy < s; dy++) {
                        var pp = ((W * (y * s + dy)) + (dx + x * s)) * 4;
                        g.data[pp + d] = dval;
                        if (d === 0) g.data[pp + 3] = alpha; // alpha channel
                    }
                }
            }
        }
    }
    ctx.putImageData(g, 0, 0);
}

function Tensor2CanvasWithImage(A, scale = 1, alpha=255) {
    var canv = document.createElement('canvas');
    var W = A.sx * scale;
    var H = A.sy * scale;
    canv.width = W;
    canv.height = H;
    Tensor2CanvasImage(canv, A, scale, alpha);
    return canv;
}

export { Tensor2CanvasImage, Tensor2CanvasWithImage };