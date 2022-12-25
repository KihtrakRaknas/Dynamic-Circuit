import PriorityQueue from './pq.mjs';

const properties = {
    debugGrid: false,
    gridBoxSize: 25,
    circleDiameter: 10,
    numberOfLines: 50,
    maxAttempts: 100,
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

init();

function init(){
    const height = Math.max(
        document.body.scrollHeight, 
        document.body.offsetHeight, 
        document.documentElement.clientHeight, 
        document.documentElement.scrollHeight, 
        document.documentElement.offsetHeight 
    );
    const width = Math.max(
        document.body.scrollWidth, 
        document.body.offsetWidth, 
        document.documentElement.clientWidth, 
        document.documentElement.scrollWidth, 
        document.documentElement.offsetWidth 
    );
    canvas.width = width;
    canvas.height = height;
    
    const boxesInRow = Math.round(width / properties.gridBoxSize)
    const boxesInCol = Math.round(height / properties.gridBoxSize)
    const actualBoxWidth = width/boxesInRow
    const actualBoxHeight = height/boxesInCol

    if(properties.debugGrid){
        for(let i = 1; i < boxesInRow; i++){
            ctx.beginPath();
            ctx.moveTo(actualBoxWidth*i, 0);
            ctx.lineTo(actualBoxWidth*i, height);
            ctx.stroke(); 
        }

        for(let i = 1; i < boxesInCol; i++){
            ctx.beginPath();
            ctx.moveTo(0, actualBoxHeight*i);
            ctx.lineTo(width, actualBoxHeight*i);
            ctx.stroke(); 
        }
    }

    let gridWalls = new Set()

    function getActualPos(pos){
        return [pos[0] * actualBoxWidth, pos[1] * actualBoxHeight] 
    }

    function getAvailablePos(){
        let pos
        do{
            pos = [Math.floor(Math.random() * boxesInRow), Math.floor(Math.random() * boxesInCol)]
        }while(gridWalls.has(pos.toString()));
        return pos
    }

    function circle(pos, color, filled){
        const [x, y] = getActualPos(pos)
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + properties.gridBoxSize/2, y + properties.gridBoxSize/2, properties.circleDiameter/2, 0, 2*Math.PI);
        if(filled)
            ctx.fill();
        else
            ctx.stroke();
    }

    function fillSquare(pos, color){
        if(!properties.debugGrid)
            return
        const [x, y] = getActualPos(pos)
        ctx.fillStyle = color;
        ctx.fillRect(x, y, actualBoxWidth, actualBoxHeight);
    }

    const actions={
        "right": [1, 0],
        "left": [-1, 0],
        "up": [0, 1],
        "down": [0, -1],
        "right-up": [1, 1],
        "right-down": [1, -1],
        "left-up": [-1, 1],
        "left-down": [-1, -1],
    }

    const getSuccessors = (s)=>{
        const diagonalBlockingStates = {
            "right-up": [[0, 1], [1, 0]],
            "right-down": [[0, -1], [1, 0]],
            "left-up": [[0, 1], [-1, 0]],
            "left-down": [[0,-1], [-1, 0]],
        }
        let successors = []
        for(let action in actions){
            const cost = Math.sqrt(actions[action][0]**2 + actions[action][1]**2)
            const newState = s.map((d,i)=>d+actions[action][i])
            
            if(newState[0] < 0 || newState[0] >= boxesInRow || newState[1] < 0 || newState[1] >= boxesInCol)
                continue

            let statesToCheck = [newState]
            if(diagonalBlockingStates[action]){
                statesToCheck = statesToCheck.concat(diagonalBlockingStates[action].map(statesToCheck=>statesToCheck.map((d,i)=>d+s[i])))
            }
            if (!statesToCheck.some((c)=>gridWalls.has(c.toString())))
                successors.push([newState, action, cost])
        }
        
        return successors
    }

    for(let i = 0; i < properties.numberOfLines; i++){
        let path = null
        let startState
        let attempts = 0
        do{
            attempts++
            if(attempts > properties.maxAttempts)
                return
            startState = getAvailablePos();
            const goalState = getAvailablePos();

            const problem = {
                isGoalState: (s)=>s[0]===goalState[0] && s[1]===goalState[1],
                startState,
                getSuccessors,
                maxCost: 1000,
                heuristic: (s)=>Math.sqrt((s[0]-goalState[0])**2 + (s[1]-goalState[1])**2),
                visitedCallback: (s)=>fillSquare(s, "#EEEEEE")
            }
            path = aStar(problem);
        }while(!path || path.length==0)

        let currPos = startState;

        // Handle Start state
        {
            fillSquare(currPos, "green")
            circle(currPos, "black", false)
            gridWalls.add(currPos.toString())

            const [x, y] = getActualPos(currPos)
            const action = path[0]
            const center = [x + actualBoxWidth/2, y + actualBoxHeight/2]
            const endOffset = [actions[action][0] * actualBoxWidth/2, actions[action][1] * actualBoxHeight/2]
            const lineEnd = center.map((d, i)=>d+endOffset[i])
            const scaleForDiagonal  = Math.sqrt(Math.abs(actions[action][0])+Math.abs(actions[action][1]))
            const startOffset = [actions[action][0] * properties.circleDiameter/2/scaleForDiagonal, actions[action][1] * properties.circleDiameter/2/scaleForDiagonal]
            const lineStart = center.map((d, i)=>d+startOffset[i])
            ctx.beginPath();
            ctx.moveTo(...lineStart);
            ctx.lineTo(...lineEnd);
            ctx.stroke(); 
        }
        

        // Handle intermediate states
        path.forEach((action, i)=>{
            currPos = currPos.map((d, i)=>d+actions[action][i])
            if (i != path.length-1){
                fillSquare(currPos, "gray")

                const [x, y] = getActualPos(currPos)
                const center = [x + actualBoxWidth/2, y + actualBoxHeight/2]
                const startOffset = [-1*actions[action][0] * actualBoxWidth/2, -1*actions[action][1] * actualBoxHeight/2]
                const lineStart = center.map((d, i)=>d+startOffset[i])

                ctx.beginPath();
                ctx.moveTo(...lineStart);
                ctx.lineTo(...center);
                ctx.stroke(); 

                const nextAction = path[i+1]
                const endOffset = [actions[nextAction][0] * actualBoxWidth/2, actions[nextAction][1] * actualBoxHeight/2]
                const lineEnd = center.map((d, i)=>d+endOffset[i])

                ctx.beginPath();
                ctx.moveTo(...center);
                ctx.lineTo(...lineEnd);
                ctx.stroke(); 

                gridWalls.add(currPos.toString())
            }
        })

        // Handle Goal state
        {
            fillSquare(currPos, "red")
            circle(currPos, "black", true)
            gridWalls.add(currPos.toString())

            const [x, y] = getActualPos(currPos)
            const action = path[path.length-1]
            const center = [x + actualBoxWidth/2, y + actualBoxHeight/2]
            const startOffset = [-1*actions[action][0] * actualBoxWidth/2, -1*actions[action][1] * actualBoxHeight/2]
            const lineStart = center.map((d, i)=>d+startOffset[i])
            const scaleForDiagonal  = Math.sqrt(Math.abs(actions[action][0])+Math.abs(actions[action][1]))
            const endOffset = [-1*actions[action][0] * properties.circleDiameter/2 / scaleForDiagonal, -1*actions[action][1] * properties.circleDiameter/2 / scaleForDiagonal]
            const lineEnd = center.map((d, i)=>d+endOffset[i])
            ctx.beginPath();
            ctx.moveTo(...lineStart);
            ctx.lineTo(...lineEnd);
            ctx.stroke(); 
        }
    }
}

function aStar(problem){
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

// Make a priority queue class
