import { assert, checkClass, isArray } from 'util/assert.js';
import { zeros } from 'util/array.js';
import { gaussRandom } from 'util/random.js';

function uniform_rand(t, floor, ceil) {
    let N = t.size, tw = t.w;
    for (let i = 0; i < N; i++) {
        tw[i] = Math.random();
    }
    scale_shift(t, ceil - floor, floor);
}

function normal_rand(t, mu, std) {
    let N = t.size, tw = t.w;
    for (let i = 0; i < N; i++) {
        tw[i] = gaussRandom();
    }
    scale_shift(t, std, mu);
}

function clip(x, min_value=-1.0, max_value=1.0) {
    let N = x.size, w = x.w;
    for (let i = 0; i < N; i++) {
        let wi = w[i];
        if (wi > max_value) w[i] = max_value; else if (wi < min_value) w[i] = min_value;
    }
}

function clip_pixel(x) {
    let N = x.size, w = x.w;
    for (let i = 0; i < N; i++) {
        let wi = w[i];
        if (wi >= 1.0) w[i] = 255; else if (wi <= -1.0) w[i] = 0; else w[i] = Math.round(255 * (x + 1.0) / 2.0) | 0;
    }
}

/**
 * ov = m * v
 */
function TensorVectorProduct(ov, m, v) {
    let ncol = m.axis(-1) | 0;
    let nrow = m.axis(-2) | 0;
    let new_shape = m.shape.slice(); new_shape.pop();
    let N = (m.size / ncol) | 0;

    let mw = m.w, vw = v.w, ow = ov.w;
    ow.fill(0.);
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < ncol; j++) {
            ow[i] += mw[i * ncol + j] * vw[j];
        }
    }
}

/**
 * ov += m' * v
 * @param { Tensor } m - tensor to be transposed
 * @param { Tensor } v - right-hand-side tensor
 */
function TransposedTensorVectorAddAssign(ov, m, v) {
    let ncol = m.axis(-1) | 0;  
    let nrow = m.axis(-2) | 0;
    let new_shape = m.shape.slice();

    // reverse order
    let a = new_shape.pop();
    new_shape.pop();
    new_shape.push(a);

    let bs = ncol * nrow | 0;
    let N = (m.size / bs) | 0;

    let mw = m.w, vw = v.w, ow = ov.w;
    // ow.fill(0.);
    for (let z = 0; z < N; z++) {
        for (let i = 0; i < nrow; i++) {
            for (let j = 0; j < ncol; j++) {
                // transposed order
                ow[z * ncol + j] += mw[z * bs + i * ncol + j] * vw[j];
            }
        }
    }
}


/**
 * 
 */
function TensorConstantProduct(x, c) {
    let o = x.cloneAndZero();
    let N = o.size, ow = o.w, xw = x.w;
    for (let i = 0; i < N; i++) {
         ow[i] = xw[i] * c;
    }
    return o;
}


function scale(x, c) {
    let N = x.size, xw = x.w;
    for (let i = 0; i < N; i++) {
         xw[i] *= c;
    }
}


function shift(x, c) {
    let N = x.size, xw = x.w;
    for (let i = 0; i < N; i++) {
         xw[i] += c;
    }
}


function scale_shift(x, a, b) {
    let N = x.size, xw = x.w;
    for (let i = 0; i < N; i++) {
         xw[i] = xw[i] * a + b;
    }
}


/**
 * HadmardProduct apply to self
 */
function HadmardProductAssign(o, x) {
    let N = o.size, ow = o.w, xw = x.w;
    for (let i = 0; i < N; i++) {
         ow[i] *= xw[i];
    }
}

export {
    clip, clip_pixel,
    scale, shift, scale_shift,
    TensorVectorProduct, TransposedTensorVectorAddAssign, HadmardProductAssign,
    uniform_rand, normal_rand
};
