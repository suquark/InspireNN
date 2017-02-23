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

function clip(ori, floor, ceil) {
    let v = ori;
    if (v < floor) v = floor; else if (v > ceil) v = ceil;
    return v;
}

function normalize_angle(angle) {
    let nangle = angle % (Math.PI * 2);
    if (nangle < 0) nangle += 2 * Math.PI;
    return nangle;
}


export {
    getopt, clip, normalize_angle, 
};

// TODO: remove later
export { AvgWindow } from 'util/record.js';
