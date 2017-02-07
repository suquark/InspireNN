import { VisElement } from 'visualize/basicvis.js';

/**
 * ImgDisplay
 */
class ImgDisplay extends VisElement {
    constructor(s) {
        super();
        this.s = this.make_selector(s);
        this.canvas = this.s.append('canvas');
        this._data = {};
        this._data.shape = null;
        this._data.imgs = null;
    }

    layout() {
        var W = parseInt(this.s.style('width'));
        this.canvas
            .attr('style', 'image-rendering:-moz-crisp-edges;' +
            'image-rendering: -o-crisp-edges;' +
            'image-rendering:-webkit-optimize-contrast;' +
            '-ms-interpolation-mode:nearest-neighbor;' +
            'image-rendering: pixelated;')
            .style('border', '1px solid #000000')
            .style('width', 1.0 * W)
            .style('height', 1.0 * W);
        return this;
    }

    render() { return this; }

    show(i) {
        var i = parseInt(i);
        var imgs = this._data.imgs;
        var shape = this._data.shape;

        if (shape.length == 2) {
            var X = shape[0];
            var Y = shape[1];
        } else if (shape.length == 3) {
            var X = shape[1];
            var Y = shape[2];
        }

        var ctx = this.canvas[0][0].getContext('2d');
        var img = ctx.getImageData(0, 0, X, Y);
        var imgData = img.data;

        if (!this._data.imgs || !this._data.shape) {
            throw Error('ImgDisplay.show(): Must set ImgDisplay.imgs() ' +
                'and ImgDisplay.shape() before showing image.');
        }

        var imgSize = 1;
        for (var n = 0; n < shape.length; n++) {
            imgSize *= shape[n];
        }

        if (imgs.length < imgSize * (i + 1)) {
            throw Error('ImgDisplay.show(): Requested image ' + i +
                ' out of bounds of ImgDisplay.imgs().');
        }

        if (shape.length == 2) {
            for (var dx = 0; dx < X; ++dx)
                for (var dy = 0; dy < Y; ++dy) {
                    var pos = dx + shape[0] * dy;
                    var s = 256 * (1 - imgs[imgSize * i + pos]);
                    imgData[4 * pos + 0] = s;
                    imgData[4 * pos + 1] = s;
                    imgData[4 * pos + 2] = s;
                    imgData[4 * pos + 3] = 255;
                }
        } else if (shape.length == 3) {
            for (var c = 0; c < 3; ++c)
                for (var dx = 0; dx < X; ++dx)
                    for (var dy = 0; dy < Y; ++dy) {
                        var pos = dx + shape[1] * dy;
                        var s = 256 * (1 - imgs[imgSize * i + pos + shape[1] * shape[2] * c]);
                        imgData[4 * pos + ((3 - c + 2) % 3)] = s;
                        imgData[4 * pos + 3] = 255;
                    }
        }
        ctx.putImageData(img, 0, 0);
        return this;
    }

    get imgs() {
        return this._data.imgs;
    }
    set imgs(val) {
        this._data.imgs = val;
    }

    get shape() {
        return this._data.shape;
    }

    set shape(val) {
        if (val.length == 2) {
            this.canvas
                .attr('width', val[0])
                .attr('height', val[1]);
        } else {
            this.canvas
                .attr('width', val[1])
                .attr('height', val[2]);
        }
        this._data.shape = val;
    }

}

export { ImgDisplay };
