import { ItemLifetime } from './objects/item.js';
import { Walls } from './objects/wall.js';
    
class World {
    constructor(height, width, agent) {
        // this.agents = [];
        this.W = width;
        this.H = height;
        this.agent = agent;
        
        // setup time
        this.clock = 0;
        
        // set up walls in the world
        this.walls = new Walls(); 
        this.walls.add_outer_wall(this.W, this.H, 10);
        this.walls.add_open_box(100, 100, 200, 300); // inner walls
        this.walls.add_open_box(400, 100, 200, 300);
        
        // set up food and poison
        this.items = new ItemLifetime(this.W, this.H, 30);
    }

    // helper function to get closest colliding walls/items
    stuff_collide(line) {
        // collide with walls
        let minr0 = this.walls.intersect(l);
        // collide with items
        let minr1 = this.items.intersect(l);
        return near_intersect(minr0, minr1);
    }

    food_available (a) {
        // see if some agent gets lunch
        let touches = this.items.hit(a.circle);
        // not cross the wall
        return touches.filter(it => !this.walls.cross(a.position, it.position));
    }

    tick() {
        // tick the environment
        this.clock++;
        
        // fix input to all agents based on environment
        // process eyes
        this.agent.eyes.interact(this.stuff_collide);
        
        // let the agents behave in the world based on their input
        this.agent.forward();
        
        // apply outputs of agents on environment
        // steer the agent according to outputs of wheel velocities
        let face = this.agent.reaction();
        
        // agent is trying to move. Check walls
        if (!this.walls.cross(this.agent.position, face.origin)) {
            this.agent.move(face);
            // handle boundary conditions, maybe optional
            this.agent.face.apply_clip_rect(0, 0, this.W, this.H);
        }
        
        // +1s
        this.items.aging();
        
        // fetch food
        this.agent.digest.fetch_one(this.agent, food_available);
       
        // simulate dead
        if (this.clock % 100 === 0) this.items.dead();
        // recycle dead and killed
        this.items.recycle();
        // simulate birth
        if (this.clock % 10 === 0) this.items.birth();
        
        // agents are given the opportunity to learn based on feedback of their action on environment
        this.agent.backward();
    }

    draw(canvas) {
        let ctx = canvas.getContext("2d");
        // clear 
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // draw walls
        this.walls.draw(ctx);
        // draw agents
        this.agent.draw(ctx);
        // draw items
        this.items.draw(ctx);
    }
}
    
  
