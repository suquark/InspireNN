// line intersection helper function: does line segment (p1,p2) intersect segment (p3,p4) ?
function line_intersect(p1, p2, p3, p4) {
    var denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (denom === 0.0) {
        return false;
    } // parallel lines
    var ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    var ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
    if (ua > 0.0 && ua < 1.0 && ub > 0.0 && ub < 1.0) {
        var up = new Vec(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
        return {
            ua: ua,
            ub: ub,
            up: up
        }; // up is intersection point
    }
    return false;
}

var line_point_intersect = function (p1, p2, p0, rad) {
    var v = new Vec(p2.y - p1.y, -(p2.x - p1.x)); // perpendicular vector
    var d = Math.abs((p2.x - p1.x) * (p1.y - p0.y) - (p1.x - p0.x) * (p2.y - p1.y));
    d = d / v.length();
    if (d > rad) {
        return false;
    }

    v.normalize();
    v.scale(d);
    var up = p0.add(v);
    if (Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y)) {
        var ua = (up.x - p1.x) / (p2.x - p1.x);
    } else {
        var ua = (up.y - p1.y) / (p2.y - p1.y);
    }
    if (ua > 0.0 && ua < 1.0) {
        return {
            ua: ua,
            up: up
        };
    }
    return false;
}

// return a near intersect case
function near_intersect(itc1, itc2) {
    if (!itc1) return itc2;
    if (!itc2) return itc1;
    return itc1.ua <= itc2.ua ? itc1 : itc2;
}


class Face {
    constructor(x, y, r, angle) {
        this.circle = new Circle(x, y, r);
        this.angle = angle;
    }

    get origin() {
        return this.circle.c;
    }

    get rad() {
        return this.circle.rad;
    }

    update(face) {
        // inner update
        this.circle = face.circle;
        this.angle = face.angle;
    }

    draw(ctx) {
        this.circle.draw(ctx);
    }

    apply_clip_rect(left, top, right, bottom) {
        // do clip, not return a value
        this.origin.apply_clip_rect(left, top, right, bottom);
    }

    
}

class Circle {
    constructor(x, y, r) {
        this.c = new Vec(x, y);  // point
        this.rad = r;        // radius
    }

    intersect_circle(cir) {
        return (this.c.dist_from(cir.c) < this.rad + cir.rad);
    }

    intersect_line(l) {
        return line_point_intersect(l.s, l.d, this.c, this.rad);
    }

    draw(ctx) {
        // need style provided
        ctx.beginPath();
        ctx.arc(this.c.x, this.c.x, this.rad, 0, Math.PI * 2, true); 
        ctx.fill();
        ctx.stroke();
    }
}


class Line {
    constructor(px, py, dx, dy) {
        this.s = new Vec(px, py);  // start
        this.d = new Vec(dx, dy);  // end
    }

    intersect_line(l) {
        return line_intersect(this.s, this.d, l.s, l.d);
    }

    intersect_circle(circ) {
        return line_point_intersect(this.s, this.d, circ.c, circ.rad);
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
    }
}


class Vec {
    // A 2D vector utility
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // utilities
    dist_from(v) {
        return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
    }

    length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    // new vector returning operations
    add(v) {
        return new Vec(this.x + v.x, this.y + v.y);
    }

    sub(v) {
        return new Vec(this.x - v.x, this.y - v.y);
    }

    rotate(a) { // CLOCKWISE
        return new Vec(this.x * Math.cos(a) + this.y * Math.sin(a), -this.x * Math.sin(a) + this.y * Math.cos(a));
    }

    // in place operations
    scale(s) {
        this.x *= s;
        this.y *= s;
    }

    normalize() {
        var d = this.length();
        this.scale(1.0 / d);
    }

    clip_rect(left, top, right, bottom) {
        let v = new Vec(this.x, this.y);
        v.apply_clip_rect(left, top, right, bottom);      
        return v;
    }

    apply_clip_rect(left, top, right, bottom) {
        if (this.x < left) this.x = left;
        if (this.x > right) this.x = right;
        if (this.y < top) this.y = top;
        if (this.y > bottom) this.y = bottom;
    }

}

export { Vec, Circle, Line };