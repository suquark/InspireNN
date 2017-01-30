function norm_dist(d) {
    // make sum of dist to 1
    let sum = 0;
    for (let i in d) sum += d[i];
    for (let i in d) d[i] /= sum;
}

function norm_dist2d(d) {
    // make sum of dist to 1
    let N = d.length;
    let D = d[0].length;

    let sum = 0;
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < D; j++) {
            sum += d[i][j];
        }
    }

    for (let i = 0; i < N; i++) {
        for (let j = 0; j < D; j++) {
            d[i][j] /= sum;
        }
    }
}

/**
* @param {Array} d Distribution
*/
function entropy(d) {
    let H = 0.
    for (let i in d)
    {
        if (d[i] > 1e-7) H -= d[i] * Math.log(d[i]);
    }
    return H;
}

export { norm_dist, norm_dist2d, entropy };