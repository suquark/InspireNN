/**
 * a modified version of Christopher Olah's script
 */

// In non-quirk browser modes, d3.selection.style("attr", int_val)
// doesn't work! This is because it should be int_val+"px"
// We wrap around the function to catch this case.

var style_ = d3.selection.prototype.style;

d3.selection.prototype.style = function(a,b) {
    if (arguments.length == 1) {
        return style_.call(this, a);
    } else if (typeof b == 'number') {
        style_.call(this, a, b + "px");
    } else {
        style_.call(this, a, b);
    }
    return this;
};

// Utilities!
// =============

// make_function
//   A lot of arguments can be a constant
//   or function. This turns constants into
//   functions.

var make_function = function(val) {
    if (typeof val == 'function') {
        return val;
    } else {
        return function() {return val;};
    }
};

// VisElement
//   This is a super class for all
//   our visualization elements
class VisElement {
    constructor() {
        this.updateTimeout = null;
    }
    layout() {}
    render() {}
    update() {
        this.layout();
        this.render();
    }

    scheduleUpdate(n=10) {
        if (this.updateTimeout) clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            this.layout();
            this.render();
            this.updateTimeout = null;
        }, n);  // update hook
    }
    
    bindToWindowResize() {
        $(window).resize(() => { this.scheduleUpdate(); });
    }

    /**
     * We'll use this in all our constructors to get a d3 selection to build at.
     * s => xxxx.select(s) or s
     */
    make_selector(s) {
        let caller = '';
        if (typeof s == 'string') {
            let str = s;
            s = d3.select(s);
            if (s.empty()) throw Error(caller + '(): selector \'' + str +
                            '\' doesn\'t seem to correspond to an element.');
            return s;
        } else if (typeof s == 'object') {
            if ('node' in s) {
                // s seems to be a d3 selector
                return s;
            } else if ('jquery' in s) {
                // s seems to be a jquery object
                throw TypeError(caller + '(): selector can\'t be a JQuery object;' +
                                        ' please use a string or d3.select().');
            }
        }
        throw TypeError(caller + '(): Given selector of type ' + typeof s +
                ' is not a valid selector; please use a string or d3.select().');
    }

}

export { VisElement };

