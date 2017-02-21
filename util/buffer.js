

// FIXME: not very efficient
function bufCopy(dst, src, start=0) {
    let b_out = new Int8Array(dst), b_in = new Int8Array(src);
    let N = b_in.byteLength;
    for (let i = 0; i < N; i++) {
        b_out[i + start] = b_in[i];
    }
}

class Buffer {
    constructor(buffer = new ArrayBuffer(4096)) {
        this.buffer = buffer;
        this.offset = 0;
    }

    align(len) {
        let new_offset = Math.ceil(this.offset / len) | 0;
        this.offset = new_offset * len;
        return new_offset;
    }

    read(count, type) {
        var value;
        switch (type) {
            case 'Int8Array':
                value = new Int8Array(this.buffer, this.offset, count);
                this.offset += count;
                break;
            case 'Int16Array':
                value = new Int16Array(this.buffer, this.align(2), count);
                this.offset += 2 * count;
                break;
            case 'Int32Array':
                value = new Int32Array(this.buffer, this.align(4), count);
                this.offset += 4 * count;
                break;
            case 'Float32Array':
                value = new Float32Array(this.buffer, this.align(4), count);
                this.offset += 4 * count;
                break;
            case 'Float64Array':
                value = new Float32Array(this.buffer, this.align(8), count);
                this.offset += 8 * count;
                break;
        }
        return value;
    }

    /**
     * Alloc new space at overflow
     */
    _refit(length) {
        // FIXME: not very efficient. 
        length = 1 << Math.ceil(Math.log2(length) + 0.5);
        let buf_new = new ArrayBuffer(length);
        bufCopy(buf_new, this.buffer);
        this.buffer = buf_new;
    }

    write(buffer) {
        if (this.offset + buffer.byteLength > this.byteLength) {
            this._refit(this.offset + buffer.byteLength);
        }
        bufCopy(this.buffer, buffer, this.offset);
        this.offset += buffer.byteLength;  // update offset
    }

    get eof() {
        return this.offset >= this.buffer.byteLength;
    }

    get byteLength() {
        return this.buffer.byteLength;
    }
}

export { Buffer };