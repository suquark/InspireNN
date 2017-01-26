import { getopt } from 'util.js';


// syntactic sugar function for getting default parameter values
function getopt(opt, field_name, default_value) {
    if (typeof field_name === 'string') {
        // case of single string
        return (typeof opt[field_name] !== 'undefined') ? opt[field_name] : default_value;
    } else {
        // assume we are given a list of string instead
        var ret = default_value;
        for (var i = 0; i < field_name.length; i++) {
            var f = field_name[i];
            if (typeof opt[f] !== 'undefined') {
                ret = opt[f]; // overwrite return value
            }
        }
        return ret;
    }
}

function load_opt(self, opt) {

    // required is a list of string
    opt.required.forEach(function(key) {
        if (typeof opt[key] !== 'undefined') {
            self[key] = opt[key];
        } else {
            console.error('cannot find necessary value of "' + key +'"');
        }
    });

    opt.optional.forEach(function(pair) {
        let v = pair.find(x => typeof x !== 'undefined')
        pair.forEach(function(key) {
            self[key] = v;
        });
    });

    // pair is a list whose values should be same
    opt.bind.forEach(function(pair) {
        let v = pair.find(x => typeof opt[x] !== 'undefined')
        pair.forEach(function(key) {
            self[key] = v;
        });
    });

}

class migrate {
    constructor (target, opt) {
        this.target = target;
        this.opt = opt;
    }

    move (field_name, default_value) {
        this.target[field_name] = getopt(this.opt, field_name, default_value);
    }
}


function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

function Float32Array2Buffer(arr) {
    var buffer = new ArrayBuffer(4 * arr.length);
    var floatView = new Float32Array(buffer);
    for (let i = 0; i < arr.length; i++) {
        floatView[i] = arr[i];
    }
    return buffer;
}

export {
    migrate
};