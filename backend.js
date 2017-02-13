
/**
 * ov = m * v
 */
function TensorVectorProduct(ov, m, v) {
    let ncol = m.axis(-1) | 0;
    let nrow = m.axis(-2) | 0;
    let new_shape = m.shape.slice(); new_shape.pop();
    let bs = ncol * nrow | 0;
    let N = (m.size / bs) | 0;

    let mw = m.w, vw = v.w, ow = ov.w;
    ow.fill(0.);
    for (let z = 0; z < N; z++) {
        for (let i = 0; i < nrow; i++) {
            for (let j = 0; j < ncol; j++) {
                ow[z * nrow + i] += mw[z * bs + i * ncol + j] * vw[j];
            }
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
 * HadmardProduct apply to self
 */
function HadmardProduct_s(o, x) {
    let N = o.size, ow = o.w, xw = x.w;
    for (let i = 0; i < N; i++) {
         ow[i] *= xw;
    }
}

