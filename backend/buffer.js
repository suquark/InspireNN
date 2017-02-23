import { getBinary, exportBinary } from 'util/request.js';
import { checkTypeStrict } from 'util/assert.js';

// FIXME: not very efficient
function bufCopy(dst, src, start=0) {
    new Uint8Array(dst).set(new Uint8Array(src), start);
}

class Buffer {
    constructor(buffer = new ArrayBuffer(4096)) {
        this.buffer = buffer;
        this.offset = 0;
    }

    _read(TypedArr, count) {
        let W = TypedArr.BYTES_PER_ELEMENT;
        // assume that W is 2^k, so we can do align faster with bitwise ops
        if (this.offset & (W - 1)) this.offset = (this.offset & W) + W;
        let v = new TypedArr(this.buffer, this.offset, count);
        this.offset += W * count;
        return v;
    }

    read(count, type) {
        switch (type) {
            case 'Uint8Array':
                return this._read(Uint8Array, count);
            case 'Uint8ClampedArray':
                return this._read(Uint8ClampedArray, count);
            case 'Int8Array':
                return this._read(Int8Array, count);
            case 'Uint16Array':
                return this._read(Uint16Array, count);
            case 'Int16Array':
                return this._read(Int16Array, count);
            case 'Uint32Array':
                return this._read(Uint32Array, count);
            case 'Int32Array':
                return this._read(Int32Array, count);
            case 'Float32Array':
                return this._read(Float32Array, count);
            case 'Float64Array':
                return this._read(Float64Array, count);
            default:
                throw 'unexpected type';
        }
    }

    /**
     * Alloc new space at overflow
     */
    _check_fit(length) {
        if (length > this.byteLength) {
            length = 1 << Math.ceil(Math.log2(length) + 0.5);
            let buf_new = new ArrayBuffer(length);
            bufCopy(buf_new, this.buffer);
            this.buffer = buf_new;
        }
    }

    /**
     * @param { ArrayBuffer } buffer
     */
    write(buffer) {
        this._check_fit(this.offset + buffer.byteLength);
        bufCopy(this.buffer, buffer, this.offset);
        this.offset += buffer.byteLength;  // update offset
    }

    get eof() {
        return this.offset >= this.buffer.byteLength;
    }

    get byteLength() {
        return this.buffer.byteLength;
    }

    // Try to load typed array
    static load(v, buf) {
        if (v.type === 'ArrayBuffer') 
            return buf.read(v.byteLength, Uint8Array).buffer;
        else
            return buf.read(v.length, v.type);
    }

    static fromURL(url) {
        return getBinary(url).then(buf => new Buffer(buf));
    }

    export(filename) {
        // only export useful part
        exportBinary(filename, this.buffer.slice(0, this.offset));
    }
}

export { Buffer };