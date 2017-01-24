
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

export {
    randf,
    randi,
    randn,
    zeros,
    maxmin,
    randperm,
    weightedSample,
    arrUnique,
    arrContains,
    getopt,
    assert,
    indexOfMax
};