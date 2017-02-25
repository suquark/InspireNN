/**
 * 
 * This module manages global symbols
 * 
 * A filesystem like scheme is designed for mapping data between memory and workspace 
 * 
 */

import { Tensor } from 'backend/tensor.js';
import { Buffer } from 'backend/buffer.js';
import { ImageBuffer } from 'backend/image.js';
import { getJSON, exportJSON } from 'util/request.js';
import { getNativeType } from 'util/assert.js';
var globals = {};


/**
 * Fetch object by path
 * @param {string} abspath - Absolute path for object
 * @returns {object} - object we get
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


/**
 * Fetch object by path
 * @param {string} abspath - Absolute path for object
 * @returns {object} - object we get
 */
function store(abspath, value) {
    if (abspath.startsWith('/')) {
        abspath = abspath.substring(1);  // OK, unix-style is just right
    }
    return storeAt(globals, abspath, value);
}

/**
 * Fetch object within certain context by path
 * @param {object} dir - top directory to find with
 * @param {string} path - path to object
 * @returns {object} - a directory or a value
 */
function storeAt(dir, path, value) {
    if (typeof dir == 'undefined') throw "unexpected error - given a bad object for looking-up?";
    if (path === '') return;  // a directory exists. do nothing
    let idx = path.indexOf('/') + 1;
    if (idx === 0) {
        // OK, store value just where
        dir[path] = value;
        return;  // never going down!
    }

    let dirname = path.substring(0, idx);
    if (typeof dir[dirname] === 'undefined') {
        // we build the path for user
        if (dirname.endsWith('[]/')) {
            dir[dirname] = [];
        } else if (dirname.endsWith('/')) {
            dir[dirname] = {};
        }
    }
    return storeAt(dir[dirname], path.substring(idx), value);
}


//////  Load Part  //////

function batchLoadFile2Global(pairs, callback) {
    return Promise.all(pairs.map(([mapfile, rawfile]) => loadFile2Global(mapfile, rawfile)));
}


function loadFile2Global(mapfile, rawfile) {
    // create a pair of file access
    let task_pair = [getJSON(mapfile), Buffer.fromURL(rawfile)];
    // wait for both of then to be done and return a `Promise`
    return Promise.all(task_pair).then(([json, buf]) => load2Global(json, buf));
}


/**
 * load data in the buffer into global object by instruction of the map
 * @param { ArrayBuffer } buf - ArrayBuffer contains data
 * @param { object } map - The map that tells the structure of data 
 */
function load2Global(map, buf) {
    _loadDir(globals, map, buf);
}


/**
 * Load directory structure from buffer
 * @param { object } dir - current treenode where we construct our data 
 * @param { object } map - The map that tells the structure of data 
 * @param { Buffer } buf - The Buffer contains data
 */
function _loadDir(dir, map, buf) {
    for (let item of map) {
        let name = item.name;
        if (name.endsWith('[]/')) {
            dir[name] = [];
            _loadList(dir[name], item.nodes, buf);
        } else if (name.endsWith('/')) {
            dir[name] = {};
            _loadDir(dir[name], item.nodes, buf);
        } else {
            dir[name] = _loadValue(item, buf);
        }
    }
}


/**
 * Load list structure from buffer
 * @param { object } list - current treenode where we construct our data 
 * @param { object } map - The map that tells the structure of current data 
 * @param { BufferReader } buf - The ArrayBuffer contains data
 */
function _loadList(list, map, buf) {
    for (let item of map) {
        let name = item.name;
        if (name.endsWith('[]/')) {
            let l = [];
            list.push(l);
            _loadList(l, item.nodes, buf);
        } else if (name.endsWith('/')) {
            let l = {};
            list.push(l);
            _loadDir(l, item.nodes, buf);
        } else {
            list.push(_loadValue(item, buf));
        }
    }
}


/**
 * Load a value from buffer
 * @param { object } v - Object that contains info about value we want to get
 * @param { BufferReader } buf - The ArrayBuffer contains data
 * @returns { Object } - the loaded value
 */
function _loadValue(v, buf) {
    switch (v.type)
    {
        case 'tensor':
            return Tensor.load(v, buf);
        case 'images':
            return ImageBuffer.load(v, buf);
        case 'json':
            return v.content;
        default:
            return Buffer.load(v, buf);
    }
}


//////  Save Part  //////

function saveGlobal(mapfile, rawfile, selector) {
    if (selector) {
        let m = {};
        for (let i in selector) {
            m[selector[i]] = globals[selector[i]];
        }
        saveDict(mapfile, rawfile, m);
    } else {
        saveDict(mapfile, rawfile, globals);
    }
}

function saveDict(mapfile, rawfile, dir) {
    let map = [];
    let buf = new Buffer();
    _saveDir(dir, map, buf);
    exportJSON(mapfile, map);
    buf.export(rawfile);
}

/**
 * convert dir into maplist, and serialize data to buffer
 * Here dict and list are just the same, for Object.keys(array) will give '0', '1', '2', etc.
 */
function _saveDir(dir, maplist, buf) {
    for (let name of Object.keys(dir)) {
        let packet;
        if (name.endsWith('/')) {
            // dict or list
            packet = { name: name, nodes: [] };
            _saveDir(dir[name], packet.nodes, buf);
        } else {
            // We attach __save__() method to all objects...
            if (dir[name].__save__){
                packet = dir[name].__save__(buf);
            } else {
                // objects
                packet = { type:'json', content: dir[name] }
            }
            packet.name = name;  // override name
        }
        maplist.push(packet);
    }
}


// never should we use arrow function here!!!
Object.getPrototypeOf(Int8Array.prototype).__save__ = function(buf) {
    // really ... hacking ways
    buf.write(this.slice().buffer);
    return {type: getNativeType(this), name: this.name, length: this.length};
};


ArrayBuffer.prototype.__save__ = function(buf) { 
    buf.write(this);
    return { name: this.name, type:'ArrayBuffer', byteLength:this.byteLength }; 
};

export { 
    globals,
    fetch, fetchFrom, store, storeAt,
    loadFile2Global, batchLoadFile2Global,
    saveGlobal, saveDict
};
