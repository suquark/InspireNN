import { Line, Vec } from '../geometry.js';

// Wall is made up of two points
class Wall {
    constructor(p1, p2) {
        this.type = 0; // wall
        this.line = new Line(p1.x, p1.y, p2.x, p2.y);
    }
}

class Walls {
    constructor() {
        this.walls = [];
    }

    create(p1, p2) {
        this.walls.push(new Wall(p1, p2));
    }

    // World object contains many agents and walls and food and stuff
    add_box(x, y, w, h) {
        this.create(new Vec(x,y), new Vec(x+w,y));
        this.create(new Vec(x+w,y), new Vec(x+w,y+h));
        this.create(new Vec(x+w,y+h), new Vec(x,y+h));
        this.create(new Vec(x,y+h), new Vec(x,y));
    }

    //  ---
    //    |
    //  ---
    add_open_box(x, y, w, h) {
        this.create(new Vec(x,y), new Vec(x+w,y));
        this.create(new Vec(x+w,y), new Vec(x+w,y+h));
        this.create(new Vec(x+w,y+h), new Vec(x,y+h));
    }

    add_outer_wall(W, H, pad) {
        this.add_box(pad, pad, W - pad * 2, H - pad * 2);
    }

    draw(ctx) {
        // draw walls in environment
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgb(0,0,0)";
        for (let i in this.walls) {
            this.walls[i].line.draw(ctx);
        }
    }

    
    intersect(l) {
        // closest intersect with walls
        // not very efficient, you can splitting the space to make it better
        let minres = false;
        for (let i in this.walls) {
            var wall = this.walls[i];
            var result = l.intersect_line(wall.line);  // line_intersect(p1, p2, wall.p1, wall.p2);
            if (result) {
                result.type = wall.type; // 0 is wall
                if (!minres) { minres = result; }
                else if(result.ua < minres.ua) { // check if its closer
                    // if yes replace it
                    minres = result;
                }
            }
        }
        return minres;
    }


    cross(s, d) {
        // closest intersect with walls
        // not very efficient, you can splitting the space to make it better
        let l = new Line(s.x, s.y, d.x, d.y);
        for (let i in this.walls) {
            var wall = this.walls[i];
            if (l.intersect_line(wall.line)) return true;
        }
        return false;
    }

}

export { Walls };
