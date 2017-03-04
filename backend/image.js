import { Tensor } from 'backend/tensor.js';
import { assert } from 'util/assert.js';
import { clip_pixel } from 'backend/ops.js';
import { prod } from 'util/array.js';
/**
 * This class provides a more uniform and general way to store and save images with same shape
 */
class ImageBuffer {
    constructor() {}

    /**
     * @param { Array } tsArray - Array of Tensor
     */
    static fromTensors(tsArray) {
        assert(tsArray.length > 0, 'empty array');
        // we assume that all images have the same shape
        let ib = new ImageBuffer();
        ib.shape = tsArray[0].shape;
        ib.images = [];
        let size = tsArray[0].size;
        for (let i of tsArray) {
            let x = i.clone();
            clip_pixel(x);
            let ba = new Uint8ClampedArray(size);
            for (let j = 0; j < size; j++) {
                ba[j] = x.w[j];
            }
            ib.images.push(ba);
        }
        return ib;
    }

    get tensor() {
        let image = this.images;
        let t = new Tensor(this.shape);
        let N = t.size;
        for (let i = 0; i < N; i++) {
            t.w[i] = (image[i] / 255.0) * 2.0 - 1.0;
        }
        return t;
    }

    /**
     * Load images from buffer
     * @param { object } t - Object that contains info about tensor we want to get
     * @param { BufferReader } buf - The ArrayBuffer contains data
     * @return { ImageBuffer } - the loaded images
     */
    static load(map, buf) {
        let ib = new ImageBuffer();
        ib.name = map.name;
        assert(map.shape.length === 4, "Error: images should be tensor with 4 dims")
        ib.shape = map.shape;
        let size = prod(ib.shape);
        // OK, load values from buffer
        ib.images = buf.read(size, 'Uint8ClampedArray');
        return ib;
    }

    __save__(buf) {
        for (let i of this.images) buf.write(i);
        return { name: this.name, shape: this.shape, count: this.images.length, type: 'images' };
    }
}

export { ImageBuffer };