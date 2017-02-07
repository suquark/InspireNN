import { assertSquare } from 'util/assert.js';

/**
 * Naive implementation of k-nestest neighbours
 * @param { Array } A - Adjacent Matrix of Graph
 * @param { number } K - Number of nestest neighbours
 * @returns 
 */
function naive_knn(A, K) {
    let N = assertSquare(A);

    var result = [];
    
    for (var i = 0; i < N; i++) {
        let knn = [];
        for (let k = 0; k < K; k++) {
            let x = null, dmax = 100000;
            for (var j = 0; j < N; j++) {
                let d = A[i][j];
                if (i != j && knn.indexOf(j) == -1 && d < dmax) {
                    x = j;
                    dmax = d;
                }
            }
            knn.push(x);
        }
        result.push(knn);
    }
    
    return result;
}

export { naive_knn };