function Mediator() {
    this.events = {};
}
Mediator.prototype.subscribe = function(eventName , callback) {
    if(!this.events.hasOwnProperty(eventName)) {
        this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
};
Mediator.prototype.unsubscribe = function(eventName , callback) {
    var index = 0,
        length = 0;
    if(this.events.hasOwnProperty(eventName)) {
        length = this.events[eventName].length;
        for(; index < length; index++) {
            if(this.events[eventName][index] == callback) {
                this.events[eventName].splice(index , 1);
                break;
            }
        }
    }
};
Mediator.prototype.publish = function(eventName) {
    var data = Array.prototype.slice.call(arguments, 1),
        index = 0,
        length = 0;
    if(trhis.events.hasOwnProperty(eventName)) {
        length = this.events[eventName].length;
        for(; index < length; index++) {
            this.events[eventName][index].apply(this, data);
        }
    }
};
