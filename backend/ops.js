import { assert, checkClass, isArray } from 'util/assert.js';
import { zeros } from 'util/array.js';
import { gaussRandom } from 'util/random.js';

function uniform_rand(t, floor, ceil) {
    let N = t.size,
        tw = t.w;
    for (let i = 0; i < N; i++) {
        tw[i] = Math.random();
    }
    scale_shift(t, ceil - floor, floor);
}

function normal_rand(t, mu, std) {
    let N = t.size,
        tw = t.w;
    for (let i = 0; i < N; i++) {
        tw[i] = gaussRandom();
    }
    scale_shift(t, std, mu);
}



function clip(x, min_value = -1.0, max_value = 1.0) {
    let N = x.size,
        w = x.w;
    for (let i = 0; i < N; i++) {
        let wi = w[i];
        if (wi > max_value) w[i] = max_value;
        else if (wi < min_value) w[i] = min_value;
    }
}

function clip_pixel(x) {
    let N = x.size,
        w = x.w;
    for (let i = 0; i < N; i++) {
        let wi = w[i];
        if (wi >= 1.0) w[i] = 255;
        else if (wi <= -1.0) w[i] = 0;
        else w[i] = Math.round(255 * (wi + 1.0) / 2.0) | 0;
    }
}

/**
 * ov = m * v
 */
function TensorVectorProduct(ov, m, v) {
    let ncol = m.axis(-1) | 0;
    let nrow = m.axis(-2) | 0;
    let new_shape = m.shape.slice();
    new_shape.pop();
    let N = (m.size / ncol) | 0;

    let mw = m.w,
        vw = v.w,
        ow = ov.w;
    ow.fill(0.);
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < ncol; j++) {
            ow[i] += mw[i * ncol + j] * vw[j];
        }
    }
}


/**
 * o = u * v
 * shape: [M, N, L] <= [M, K] * [N, K, L]
 */
function matmul(o, u, v) {
    o.w.fill(0.);
    matmuladd(o, u, v);
}


/**
 * o += u * v
 * shape: [M, N, L] <= [M, K] * [N, K, L]
 */
function matmuladd(o, u, v) {
    let K = u.axis(-1);

    let MLen = K;
    let M = (u.size / MLen) | 0;

    let L = v.axis(-1);

    let NLen = (K * L) | 0;
    let N = (v.size / NLen) | 0;

    let uw = u.w,
        vw = v.w,
        ow = o.w;

    for (let m = 0; m < M; m++) {
        for (let n = 0; n < N; n++) {
            for (let l = 0; l < L; l++) {
                let oindex = (m * N + n) * L + l;
                for (let i = 0; i < K; i++) {
                    ow[oindex] += uw[m * MLen + i] * vw[n * NLen + i * L + l];
                }
            }
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

    let mw = m.w,
        vw = v.w,
        ow = ov.w;
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
    let N = o.size,
        ow = o.w,
        xw = x.w;
    for (let i = 0; i < N; i++) {
        ow[i] = xw[i] * c;
    }
    return o;
}

function radd(o, a) {
    let N = o.size,
        ow = o.w,
        aw = a.w;
    for (let i = 0; i < N; i++) {
        ow[i] += aw[i];
    }
}

function add(o, a, b) {
    let N = o.size,
        ow = o.w,
        aw = a.w,
        bw = b.w;
    for (let i = 0; i < N; i++) {
        ow[i] = aw[i] + bw[i];
    }
}

/**
 * Transposed dot add 
 * o += x' * y
 * @param { Tensor } x - Vector
 * @param { Tensor } y - Vector
 */
function tdotadd(o, x, y) {
    let N = o.size,
        ow = o.w,
        xw = x.w,
        yw = y.w;
    let KLen = y.size,
        MLen = x.size;
    for (let i = 0; i < MLen; i++) {
        for (let j = 0; j < KLen; j++) {
            ow[KLen * i + j] += xw[i] * yw[j];
        }
    }
}


function negative(x) {
    let N = x.size,
        xw = x.w;
    for (let i = 0; i < N; i++) {
        xw[i] = -xw[i];
    }
}

function scale(x, c) {
    let N = x.size,
        xw = x.w;
    for (let i = 0; i < N; i++) {
        xw[i] *= c;
    }
}


function shift(x, c) {
    let N = x.size,
        xw = x.w;
    for (let i = 0; i < N; i++) {
        xw[i] += c;
    }
}

function assign(o, x) {
    o.w = x.w.slice();
}

function scale_shift(x, a, b) {
    let N = x.size,
        xw = x.w;
    for (let i = 0; i < N; i++) {
        xw[i] = xw[i] * a + b;
    }
}


/**
 * HadmardProduct apply to self
 */
function HadmardProductAssign(o, x) {
    let N = o.size,
        ow = o.w,
        xw = x.w;
    for (let i = 0; i < N; i++) {
        ow[i] *= xw[i];
    }
}

export {
    clip,
    clip_pixel,
    scale,
    shift,
    scale_shift,
    negative,
    TensorVectorProduct,
    TransposedTensorVectorAddAssign,
    HadmardProductAssign,
    uniform_rand,
    normal_rand
};

export {
    matmul,
    matmuladd
}