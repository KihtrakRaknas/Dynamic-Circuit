export default class PriorityQueue {
    constructor() {
        this.heap = [];
    }

    enqueue(item, priority) {
        let newItem = { item: item, priority: priority };
        this.heap.push(newItem);
        this.bubbleUp();
    }

    dequeue() {
        let top = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown();
        return top.item;
    }

    bubbleUp() {
        let current = this.heap.length - 1;
        let parent = Math.floor((current - 1) / 2);

        while (current > 0 && this.heap[current].priority < this.heap[parent].priority) {
            [this.heap[current], this.heap[parent]] = [this.heap[parent], this.heap[current]];
            current = parent;
            parent = Math.floor((current - 1) / 2);
        }
    }

    bubbleDown() {
        let current = 0;
        let left = 2 * current + 1;
        let right = 2 * current + 2;
        let minIndex = current;

        if (left < this.heap.length && this.heap[left].priority < this.heap[minIndex].priority) {
            minIndex = left;
        }

        if (right < this.heap.length && this.heap[right].priority < this.heap[minIndex].priority) {
            minIndex = right;
        }

        if (minIndex != current) {
            [this.heap[current], this.heap[minIndex]] = [this.heap[minIndex], this.heap[current]];
            this.bubbleDown();
        }
    }

    peek() {
        return this.heap[0].item;
    }

    isEmpty() {
        return this.heap.length == 0;
    }
}