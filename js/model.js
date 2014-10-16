var createModel;
createModel = function () {
    'use strict';

    var addRevs;
    var model = {};

    model.MAX_GEARS = 6;
    model.STEERING_SAMPLING_RATE = 10;
    model.MOVING_RATE = 15;

    function Device(name, keys, engine) {
        this.name = name;
        this.gas = keys.gas;
        this.left = keys.left;
        this.right = keys.right;
        this.speed = 0;
        this.engine = engine;
        this.steering = new Steering(1);
    }

    Device.prototype.accelerate = function () {
        this.engine.giveRevs();
    };

    Device.prototype.break = function () {
        this.engine.revsDown();
    };

    function Engine(enginetype, maxRevs, revMap, maxSpeed) {
        this.engineType = enginetype;
        this.maxRevs = maxRevs;
        this.revMap = revMap;
        this.revs = 0;
        this.gear = 1;
        this.maxSpeed = maxSpeed;
        this.currentPresumedSpeed = 0;
    }

    addRevs = function (engine) {
        engine.revs = engine.revs + (((engine.revMap - (engine.revMap * ((engine.gear - 1) / model.MAX_GEARS))) / 100) * engine.maxRevs);
    };

    Engine.prototype.giveRevs = function () {
        if (this.revs < this.maxRevs) {
            addRevs(this);
        } else if (this.gear < model.MAX_GEARS) {
            this.gear += 1;

            this.revs = this.revs - (this.maxRevs * 0.5);
        }

        this.currentPresumedSpeed = Math.round((this.maxSpeed / model.MAX_GEARS) * this.gear * (this.revs / this.maxRevs));
    };

    Engine.prototype.revsDown = function () {
        this.revs = 0;
        this.gear = 1;
        this.currentPresumedSpeed = 0;
    };

    function Steering(turn) {
        this.maxAngle = 5;
        this.turn = turn / 10;
        this.angle = 0; //+ or - maxAngle, 0 is straight.
    }

    Steering.prototype.turnLeft = function () {
        if (this.angle > -(this.maxAngle) &&
                this.angle <= this.maxAngle) {
            this.angle -= this.turn;
        }
    };

    Steering.prototype.turnRight = function () {
        if (this.angle < this.maxAngle &&
                this.angle >= -(this.maxAngle)) {
            this.angle += this.turn;
        }
    };

    Steering.prototype.center = function () {
        this.angle = 0;
    };

    model.Steering = Steering;
    model.Device = Device;
    model.Engine = Engine;

    return model;
};

var model = createModel();