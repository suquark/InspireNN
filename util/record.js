class AvgWindow {
    // a window stores _size_ number of values
    // and returns averages. Useful for keeping running
    // track of validation or training accuracy during SGD
    constructor(size=100, minsize=20) {
        this.v = [];
        this.sum = 0;
    }
    add(x) {
        this.push(x);
    }

    push(x) {
        this.v.push(x);
        this.sum += x;
        if(this.v.length>this.size) {
            var xold = this.v.shift();
            this.sum -= xold;
        }
    }

    
    get_average() {
        return this.average;
    }

    get average() {
        if (this.v.length < this.minsize) return -1;
        else return this.sum/this.v.length;
    }

    reset() {
        this.v = [];
        this.sum = 0;
    }
}

export { AvgWindow };

