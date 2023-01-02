import PriorityQueue from './priority-queue.js';

export default function aStar(problem){
    let frontier = new PriorityQueue();
    let visited = new Set();

    frontier.enqueue([problem.startState, [], 0], 0)

    while(!frontier.isEmpty()){
        const [state, actions, g] = frontier.dequeue()
        if(problem.visitedCallback)
            problem.visitedCallback(state)

        if(problem.maxCost && g > problem.maxCost)
            break;

        if(!visited.has(state.toString())){
            visited.add(state.toString())

            if(problem.isGoalState(state))
                return actions

            for(let [successor, action, stepCost] of problem.getSuccessors(state)){
                frontier.enqueue([successor, [...actions, action], g+stepCost, problem.heuristic(successor)], g+stepCost+problem.heuristic(successor))
            }
        }
    }

    return null
}