/**
 * mean squared error
 * @param {x} - output layer tensor
 * @param {y} - label tensor
 */
function meanSquaredError(x, y) {
    let N = x.size;
    let loss = 0.;
    let xw = x.w, yw = y.w, xdw = x.dw;
    for (let i = 0; i < N; i++) {
        let dx = xw[i] - yw[i];
        xdw[i] += dx;
        loss += 0.5 * dx * dx;
    }
    return loss;
}

/**
 * SVM loss / Hinge loss
 * @param {x} - output layer tensor
 * @param {y} - case id
 */
function hingeLoss(x, y) {
    let N = x.size, xw = x.w, xdw = x.dw;
    // xdw.fill(0.); // zero out the gradient of input Vol

    // we're using structured loss here, which means that the score
    // of the ground truth should be higher than the score of any other 
    // class, by a margin
    let yscore = xw[y]; // score of ground truth
    let margin = 1.0;
    let loss = 0.0;
    for (let i = 0; i < N; i++) {
        if (y === i) continue; 
        let ydiff = -yscore + xw[i] + margin;
        if (ydiff > 0) {
            // violating dimension, apply loss
            xdw[i] += 1;
            xdw[y] -= 1;
            loss += ydiff;
        }
    }
    return loss;
}

/**
 * Multi-class logarithmic loss
 * @param {x} - output layer tensor
 * @param {y} - case id
 */
function multiclassLogarithmicLoss(x, y) {
    let N = x.size, xw = x.w, xdx = x.dw;
    for (let i = 0; i < N; i++) {
        xdw[i] = 1.0 / ((i === y ? 0.0 : 1.0) - xw[i]);
    }
    // loss is the class negative log likelihood
    return -Math.log(xw[i]);
}

/**
 * Multi-class logarithmic loss
 * @param {x} - output layer tensor
 * @param {y} - case id
 */
function softmaxLoss(x, y) {
    x.softmax_a(x.dw);
    let v = x.dw[y];
    x.dw[y] -= 1.0;
    // loss is the class negative log likelihood
    return -Math.log(v);
}

export { meanSquaredError, hingeLoss, multiclassLogarithmicLoss, softmaxLoss };

export default function(name='mse') {
    let dict = {
        'mse' : meanSquaredError,
        'hinge': hingeLoss,
        'mclog': multiclassLogarithmicLoss,
        'softmax': softmaxLoss
    }
    return dict[name];
};

