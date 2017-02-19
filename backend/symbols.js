import { Tensor } from 'backend/tensor.js';
var globals = {}

function loadFile2Global(mapfile, rawfile, callback) {
    $.getJSON(mapfile, (map) => {
        $.getBinary(rawfile, (buf) => {
            load2Global(map, buf);
            callback();
        });
    });
}

function load2Global(map, buf) {
    let ns = {};
    let m = map.mapping;
    let offset = 0;
    for (let i in m) {
        let t = m[i];
        let length = _getVol(t.shape);
        ns[t.id] = new Tensor(t.shape, new Float32Array(buf, offset, length));
        offset += length;
    }
    globals[m.namespace] = ns;
}

function _getVol(shape) {
    let m = 1;
    for (let i = 0; i < shape.length; i++) {
        m *= shape[i];
    }
    return m;
}

export { loadFile2Global, globals };
