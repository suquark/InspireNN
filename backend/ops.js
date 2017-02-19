import { assert, checkClass, isArray } from 'util/assert.js';
import { zeros } from 'util/array.js';

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
 */
function TransposedTensorVectorProductAdd(ov, m, v) {
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
                ow[z * ncol + j] += mw[z * bs + i * ncol + j] * vw[i];
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

/**
 * HadmardProduct apply to self
 */
function HadmardProductAssign(o, x) {
    let N = o.size, ow = o.w, xw = x.w;
    for (let i = 0; i < N; i++) {
         ow[i] *= xw[i];
    }
}

export { TensorConstantProduct, TensorVectorProduct, TransposedTensorVectorProductAdd, HadmardProductAssign };
