class Timer {
    constructor() {
        this.lasttime = {};
        this.sum = {};
        // if (performance.now) {
        //     this.get_time = performance.now;
        // } else {
        //     this.get_time = new Date.now;
        // }
    }

    start(name) {
        if (!this.sum[name]) this.sum[name] = 0.;
        this.lastname = name;
        this.lasttime[name] = performance.now();
    }

    stop(name) {
        this.sum[name] += performance.now() - this.lasttime[name];
    }

    stoplast() {
        this.stop(this.lastname);
    }

    passto(name) {
        this.stop(this.lasttime);
        this.start(name);
    }

    clear() {
        this.sum = {};
    }

    getTime(name) {
        return this.sum[name];
    }
}

export { Timer };