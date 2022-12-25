export default class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(item, priority) {
        let newItem = { item: item, priority: priority };
        let added = false;

        for (let i = 0; i < this.items.length; i++) {
            if (newItem.priority < this.items[i].priority) {
                this.items.splice(i, 0, newItem);
                added = true;
                break;
            }
        }

        if (!added) {
            this.items.push(newItem);
        }
    }

    dequeue() {
        return this.items.shift().item;
    }

    peek() {
        return this.items[0].item;
    }

    isEmpty() {
        return this.items.length == 0;
    }

    size() {
        return this.items.length;
    }
}