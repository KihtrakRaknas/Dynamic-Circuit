import aStar from './search.js';

const defaultProperties = {
    debugGrid: false,
    gridBoxSize: 20,
    circleDiameter: 10,
    initialNumberOfLines: 10,
    linesPerSecond: 5,
    maxAttempts: 10,
    strokeWidth: 2,
    lengthPerSecond: 100,
    backgroundColor: {r: 255, g: 255, b: 255},
    color: {r: 100, g: 100, b: 100},
    shrink: 2,
    offscreenCalculationBoxes: 5,
    parent: document.getElementsByTagName("html")[0]
}

export default function init(canvas, properties=defaultProperties){
    const ctx = canvas.getContext("2d");

    for(let property in defaultProperties)
        if(typeof properties[property] === 'undefined')
            properties[property] = defaultProperties[property]
    const gridBoxSize = properties.gridBoxSize * properties.shrink
    const strokeWidth = properties.strokeWidth * properties.shrink
    const circleDiameter = properties.circleDiameter * properties.shrink
    
    let height;
    let width;
    let windowHeight
    let windowWidth
    let boxesInRow;
    let boxesInCol;
    let actualBoxWidth;
    let actualBoxHeight;
    let gridWalls = new Set()
    let allSteps = []

    function updateSizingInfo(){
        const html = document.getElementsByTagName("html")[0]
        height = Math.max(
            properties.parent.scrollHeight,
            properties.parent.offsetHeight, 
        ) * properties.shrink - 1;
        width = Math.max(
            properties.parent.scrollWidth,
            properties.parent.offsetWidth
        ) * properties.shrink - 1;
        windowHeight = window.innerHeight * properties.shrink - 1
        windowWidth = window.innerWidth * properties.shrink - 1

        height = Math.max(height, windowHeight)

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width/properties.shrink + 'px';
        canvas.style.height = height/properties.shrink + 'px';

        for(let drawLine of allSteps)
            drawLine()

        boxesInRow = Math.round(width / gridBoxSize)
        boxesInCol = Math.round(height / gridBoxSize)
        actualBoxWidth = width/boxesInRow
        actualBoxHeight = height/boxesInCol
    }

    const resizeObserver = new ResizeObserver(updateSizingInfo)
    resizeObserver.observe(document.body)
    updateSizingInfo()
    
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

    function getActualPos(pos){
        return [pos[0] * actualBoxWidth, pos[1] * actualBoxHeight] 
    }

    function getViewPortInfo(){
        let { top, bottom, left, right } = canvas.getBoundingClientRect()
        top *= properties.shrink
        bottom *= properties.shrink
        left *= properties.shrink
        right *= properties.shrink
        const boxesToSkipHeight = Math.floor(Math.max(-top,0)/actualBoxHeight)
        const boxesWindowHeight = Math.ceil((windowHeight-Math.max(windowHeight-bottom,0)-Math.max(top,0))/actualBoxHeight)
        const boxesToSkipWidth = Math.floor(Math.max(-left,0)/actualBoxWidth)
        const boxesWindowWidth = Math.ceil((windowWidth-Math.max(left,0)-Math.max(windowWidth-right,0))/actualBoxWidth)
        return {boxesToSkipHeight, boxesWindowHeight, boxesToSkipWidth, boxesWindowWidth}
    }

    function getAvailablePos(){
        const {boxesToSkipHeight, boxesWindowHeight, boxesToSkipWidth, boxesWindowWidth} = getViewPortInfo()
        let pos
        do{
            pos = [
                boxesToSkipWidth + Math.floor(Math.random() * boxesWindowWidth),
                boxesToSkipHeight + Math.floor(Math.random() * boxesWindowHeight)
            ]
        }while(gridWalls.has(pos.toString()));
        return pos
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
        const {boxesToSkipHeight, boxesWindowHeight, boxesToSkipWidth, boxesWindowWidth} = getViewPortInfo()
        const diagonalBlockingPositions = {
            "right-up": [[0, 1], [1, 0]],
            "right-down": [[0, -1], [1, 0]],
            "left-up": [[0, 1], [-1, 0]],
            "left-down": [[0,-1], [-1, 0]],
        }
        let successors = []
        for(let action in actions){
            const cost = Math.sqrt(actions[action][0]**2 + actions[action][1]**2)
            const newState = s.map((d,i)=>d+actions[action][i])
            
            // Check if new state is out of bounds
            if(newState[0] < 0 || newState[0] >= boxesInRow || newState[1] < 0 || newState[1] >= boxesInCol)
                continue

            // Check if new state is in viewport
            const off = properties.offscreenCalculationBoxes
            if(newState[0] < boxesToSkipWidth - off || newState[0] >= boxesToSkipWidth + boxesWindowWidth + off || newState[1] < boxesToSkipHeight - off || newState[1] >= boxesToSkipHeight + boxesWindowHeight + off)
                continue

            if(gridWalls.has(newState.toString()))
                continue

            if(diagonalBlockingPositions[action]){
                const diagonalBlockingStates = diagonalBlockingPositions[action].map(statesToCheck=>statesToCheck.map((d,i)=>d+s[i]))
                if(diagonalBlockingStates.every((c)=>gridWalls.has(c.toString())))
                    continue
            }

            successors.push([newState, action, cost])
        }
        
        return successors
    }

    let gridLock = false

    for(let i = 0; i < properties.initialNumberOfLines; i++)
        attemptLine()

    setInterval(attemptLine, 1000/properties.linesPerSecond)
    
    function attemptLine(){
        if(gridLock)
            return
        gridLock = true
        let path = null
        let startState
        let attempts = 0
        do{
            attempts++
            if(properties.maxAttempts && attempts > properties.maxAttempts){
                gridLock = false
                return
            }
            startState = getAvailablePos();
            const goalState = getAvailablePos();

            const problem = {
                isGoalState: (s)=>s[0]===goalState[0] && s[1]===goalState[1],
                startState,
                getSuccessors,
                maxCost: (boxesInRow + boxesInCol) * 2,
                heuristic: (s)=>dist(s, goalState),
                visitedCallback: (s)=>fillSquare(s, "#EEEEEE")
            }
            path = aStar(problem);
        }while(!path || path.length==0)

        let steps = []
        let currPos = startState;

        // Handle Start state
        {
            gridWalls.add(currPos.toString())
            fillSquare(currPos, "green")

            const [x, y] = getActualPos(currPos)
            const action = path[0]
            const center = [x + actualBoxWidth/2, y + actualBoxHeight/2]
            const scaleForDiagonal  = Math.sqrt(Math.abs(actions[action][0])+Math.abs(actions[action][1]))
            const startOffset = [actions[action][0] * circleDiameter/2/scaleForDiagonal, actions[action][1] * circleDiameter/2/scaleForDiagonal]
            const lineStart = center.map((d, i)=>d+startOffset[i])

            steps.push({
                type:"circle",
                pos: [x + actualBoxWidth/2, y + actualBoxHeight/2],
                angle: Math.atan2(actions[action][1], actions[action][0]),
                length: circleDiameter * Math.PI
            })

            steps.push({
                type:"line",
                start: lineStart,
            })
        }

        // Handle intermediate states
        path.forEach((action, i)=>{
            currPos = currPos.map((d, i)=>d+actions[action][i])
            if (i != path.length-1){
                gridWalls.add(currPos.toString())
                fillSquare(currPos, "gray")

                const [x, y] = getActualPos(currPos)
                const center = [x + actualBoxWidth/2, y + actualBoxHeight/2]

                const lastStep = steps[steps.length - 1]
                lastStep.end = center
                lastStep.length = dist(lastStep.start, lastStep.end)
                steps.push({
                    type:"line",
                    start: center,
                })
            }
        })

        // Handle Goal state
        {
            gridWalls.add(currPos.toString())
            fillSquare(currPos, "red")

            const [x, y] = getActualPos(currPos)
            const action = path[path.length-1]
            const center = [x + actualBoxWidth/2, y + actualBoxHeight/2]
            const scaleForDiagonal  = Math.sqrt(Math.abs(actions[action][0])+Math.abs(actions[action][1]))
            const endOffset = [-1*actions[action][0] * circleDiameter/2 / scaleForDiagonal, -1*actions[action][1] * circleDiameter/2 / scaleForDiagonal]
            const lineEnd = center.map((d, i)=>d+endOffset[i])

            const lastStep = steps[steps.length - 1]
            lastStep.end = lineEnd
            lastStep.length = dist(lastStep.start, lastStep.end)

            // Add destination as first step
            steps.splice(0, 0, {
                type:"fill-circle",
                pos: [x + actualBoxWidth/2, y + actualBoxHeight/2],
                length: 10
            })
        }

        gridLock = false

        // Animate
        function easeInOutQuad(x) {
            if(x >= 1)
                return 1
            if(x <= 0)
                return 0
            return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
        }
        const totalLength = steps.reduce((acc, d)=>acc+d.length, 0)
        const totalTime = totalLength/properties.lengthPerSecond
        let startTime
        let interval
        const drawLine = () => {
            if(!startTime)
                startTime = new Date().getTime()
            const currTime = new Date().getTime()
            const timeElapsed = (currTime - startTime)/1000
            const timeElapsedRatio = timeElapsed/totalTime
            const progress = easeInOutQuad(timeElapsedRatio)
            const progressLength = progress * totalLength
            let currLength = 0
            for(let step of steps){
                const length = step.length
                let stepProgress
                if(currLength + length < progressLength)
                    stepProgress = length
                else
                    stepProgress = progressLength - currLength
                if(stepProgress <= 0)
                    break
                currLength += stepProgress
                const stepProgressRatio = stepProgress/length
                if(step.type == "fill-circle"){
                    const [x, y] = step.pos
                    ctx.beginPath();
                    ctx.lineWidth = strokeWidth;
                    ctx.arc(x, y, circleDiameter/2, 0, 2 * Math.PI);
                    let color = {}
                    for (let comp of ["r", "g", "b"])
                        color[comp] = properties.backgroundColor[comp] + stepProgressRatio * (properties.color[comp] - properties.backgroundColor[comp])
                    ctx.fillStyle = `rgb(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)})`;
                    ctx.fill();
                }else if(step.type == "circle"){
                    const [x, y] = step.pos
                    const angle = step.angle
                    ctx.beginPath();
                    ctx.lineWidth = strokeWidth;
                    ctx.strokeStyle = `rgb(${Math.round(properties.color.r)},${Math.round(properties.color.g)},${Math.round(properties.color.b)})`;
                    ctx.arc(x, y, circleDiameter/2, angle, angle + 2 * Math.PI * stepProgressRatio);
                    ctx.stroke();
                }else if(step.type == "line"){
                    const [x1, y1] = step.start
                    const [x2, y2] = step.end
                    const length = stepProgress
                    const ratio = length/step.length
                    const x = x1 + (x2-x1)*ratio
                    const y = y1 + (y2-y1)*ratio
                    // ctx.beginPath();
                    // ctx.moveTo(x1, y1);
                    ctx.lineWidth = strokeWidth;
                    ctx.strokeStyle = `rgb(${Math.round(properties.color.r)},${Math.round(properties.color.g)},${Math.round(properties.color.b)})`;
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            }
            if(progress >= 1){
                clearInterval(interval)
            }
        }
        interval = setInterval(drawLine, 50)
        allSteps.push(drawLine)
    }
}

function dist(pos1, pos2){
    return Math.sqrt((pos1[0] - pos2[0])**2 + (pos1[1] - pos2[1])**2)
}