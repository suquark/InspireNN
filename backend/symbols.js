/**
 * 
 * This module manages global symbols
 * 
 * A filesystem like scheme is designed for mapping data between memory and workspace 
 * 
 */

import { Tensor } from 'backend/tensor.js';
import { getBinary, getJSON } from 'util/request.js';
var globals = {}

/**
 * Fetch object by path
 * @param {string} abspath - Absolute path for object
 */
function fetch(abspath) {
    if (abspath.startsWith('/')) {
        abspath = abspath.substring(1);  // OK, unix-style is just right
    }
    return fetchFrom(globals, abspath);
}

/**
 * Fetch object within certain context by path
 * @param {object} dir - top directory to find with
 * @param {string} path - path to object
 * @returns {object} - a directory or a value
 */
function fetchFrom(dir, path) {
    if (!dir) throw "Path not found";
    if (path === '') return dir;  // return a directory
    let idx = path.indexOf('/') + 1;
    if (idx === 0) return dir[path];  // return value
    return fetchFrom(dir[path.substring(0, idx)], path.substring(idx));
}

function batchLoadFile2Global(pairs, callback) {
    return Promise.all(pairs.map(p => loadFile2Global(p[0], p[1])));
}

function loadFile2Global(mapfile, rawfile) {
    // create a pair of file access
    let task_pair = [getJSON(mapfile), getBinary(rawfile)];
    // wait for both of then to be done and return a `Promise`
    return Promise.all(task_pair).then(pair => new Promise((resolve, reject) => {
        if (pair && pair.length == 2) {
            load2Global(pair[0], pair[1]);
            resolve();
        } else {
            reject(new Error("Bad pair of mapfile & rawfile"));
        }
    })).catch(error => {
        reject(error);
    });
}

/**
 * load data in the buffer into global object by instruction of the map
 * @param { object } dir - current treenode where we construct our data 
 * @param { object } map - The map that tells the structure of data 
 */
function load2Global(map, buf) {
    return _loadDir(globals, map, buf, 0);
}

/**
 * @param { object } dir - current treenode where we construct our data 
 * @param { object } map - The map that tells the structure of data 
 * @param { ArrayBuffer } buf - The ArrayBuffer contains data
 * @param { number } offset - where should we point the reader to. offset is passed between functions, not as a global value to avoid async side-effects
 */
function _loadDir(dir, map, buf, offset) {
    for (let i in map) {
        let item = map[i];
        let name = item.name;
        if (item.nodes) {
            dir[name] = {};
            offset = _loadDir(dir[name], item.nodes, buf, offset);
        } else {
            [offset, dir[name]] = _loadValue(buf, offset, item);
        }
    }
    return length;
}


function _loadValue(buf, offset, v) {
    switch (v.type)
    {
        case 'tensor':
            return _loadTensor(buf, offset, v);
        default:
            throw "Undefined type";
    }
}

function _loadTensor(buf, offset, t) {
    let length = 1;
    for (let i = 0; i < t.shape.length; i++) {
        length *= t.shape[i];
    }
    return [offset + length, new Tensor(t.shape, new Float32Array(buf, offset, length))];
}

export { 
    globals,
    fetch, fetchFrom,
    loadFile2Global, batchLoadFile2Global
};
