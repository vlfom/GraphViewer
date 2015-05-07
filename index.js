var canvas = document.getElementById("mainField"),
    context = canvas.getContext("2d"),
    canvasWidth = parseInt(document.getElementById("mainField").getAttribute("width")),
    canvasHeight = parseInt(document.getElementById("mainField").getAttribute("height"));

var VERTEX_RADIUS = 20,
    CIRCLE_RADIUS = 200,
    FRAME_REFRESH_TIME = 20,
    COLOR_LIST = [
        "#c62828", "#ad1457", "#6a1b9a", "#4527a0", "#283593", "#1565c0", "#0277bd",
        "#00838f", "#00695c", "#2e7d32", "#558b2f", "#9e9d24", "#f9a825", "#ff8f00",
        "#ef6c00", "#d84315"],
    canvasGraph = new Graph(0);

function checkRegularity(myGraph) {
    var i,
        firstNodeIn = myGraph.NodeList[0].inDegree,
        firstNodeOut = myGraph.NodeList[0].outDegree;
    for (i = 1; i < myGraph.NODES_COUNT; ++i)
        if (myGraph.NodeList[i].inDegree != firstNodeIn ||
            myGraph.NodeList[i].outDegree != firstNodeOut)
            return false;
    return true;
}

function checkFullness(myGraph) {
    var i, j,
        tempMatrix = new Array(myGraph.NODES_COUNT);
    for (i = 0; i < myGraph.NODES_COUNT; ++i)
        tempMatrix[i] = new Array(myGraph.NODES_COUNT);
    for (i = 0; i < myGraph.NODES_COUNT; ++i)
        for (j = 0; j < myGraph.NODES_COUNT; ++j)
            tempMatrix[i][j] = 0;
    for (i = 0; i < myGraph.NODES_COUNT; ++i)
        for (j = 0; j < myGraph.NodeList[i].edges_list.length; ++j)
            tempMatrix[i][myGraph.NodeList[i].edges_list[j]] = 1;
    for (i = 0; i < myGraph.NODES_COUNT; ++i)
        for (j = 0; j < myGraph.NODES_COUNT; ++j)
            if (i != j && !tempMatrix[i][j])
                return false;
    return true;
}

function checkWeakConnectivity(myGraph) {
    var i, next, vis = new Array(myGraph.NODES_COUNT);
    rEdgeList = new Array(myGraph.NODES_COUNT);
    for (i = 0; i < myGraph.NODES_COUNT; ++i)
        rEdgeList[i] = new Array(0);
    for (i = 0; i < myGraph.NODES_COUNT; ++i)
        for (j = 0; j < myGraph.NodeList[i].edges_list.length; ++j)
            rEdgeList[myGraph.NodeList[i].edges_list[j]].push(i);

    function dfs(vertex) {
        var i, next;
        vis[vertex] = 1;
        for (i = 0; i < myGraph.NodeList[vertex].edges_list.length; ++i) {
            next = myGraph.NodeList[vertex].edges_list[i];
            if (!vis[next])
                dfs(next);
        }
        for (i = 0; i < rEdgeList[vertex].length; ++i) {
            next = rEdgeList[vertex][i];
            if (!vis[next])
                dfs(next);
        }
    }

    dfs(0);
    for (i = 0; i < myGraph.NODES_COUNT; ++i)
        if (!vis[i])
            return false;

    return true;
}

function FundamentalCycleList(myGraph) {
    var rEdgeList, i;

    rEdgeList = new Array(myGraph.NODES_COUNT);
    for (i = 0; i < myGraph.NODES_COUNT; ++i)
        rEdgeList[i] = new Array(0);
    for (i = 0; i < myGraph.NODES_COUNT; ++i)
        for (j = 0; j < myGraph.NodeList[i].edges_list.length; ++j)
            rEdgeList[myGraph.NodeList[i].edges_list[j]].push(i);

    var order, cycle;

    function dfs1(vertex) {
        vis[vertex] = 1;
        for (var i = 0; i < myGraph.NodeList[vertex].edges_list.length; ++i) {
            var next = myGraph.NodeList[vertex].edges_list[i];
            if (!vis[next])
                dfs1(next);
        }
        order.push(vertex);
    }

    function dfs2(vertex) {
        vis[vertex] = 1;
        for (var i = 0; i < rEdgeList[vertex].length; ++i) {
            var next = rEdgeList[vertex][i];
            if (!vis[next])
                dfs2(next);
        }
        cycle.push(vertex);
    }

    var vis = new Array(myGraph.NODES_COUNT);
    order = new Array(0);
    for (i = 0; i < myGraph.NODES_COUNT; ++i)
        if (!vis[i])
            dfs1(i);
    var cycleList = new Array(0);
    cycle = new Array(0);
    vis = new Array(myGraph.NODES_COUNT);
    for (i = 0; i < myGraph.NODES_COUNT; ++i)
        if (!vis[order[myGraph.NODES_COUNT - i - 1]]) {
            dfs2(order[myGraph.NODES_COUNT - i - 1]);
            cycleList.push(cycle);
            cycle = new Array(0);
        }
    return cycleList;
}

function TopologicalSort(myGraph) {
    var i, order;

    function dfs1(vertex) {
        vis[vertex] = 1;
        for (var i = 0; i < myGraph.NodeList[vertex].edges_list.length; ++i) {
            var next = myGraph.NodeList[vertex].edges_list[i];
            if (!vis[next])
                dfs1(next);
        }
        order.push(vertex);
    }

    vis = new Array(myGraph.NODES_COUNT);
    order = new Array(0);
    for (i = 0; i < myGraph.NODES_COUNT; ++i)
        if (!vis[i])
            dfs1(i);

    return order.reverse() ;
}

function Node(index) {
    this.index = index;
    this.edges_list = [];
    this.edges_weight = [] ;
    this.inDegree = 0;
    this.outDegree = 0;

    this.appendEdge = function (edgeTo, edgeWeight) {
        this.edges_list.push(edgeTo);
        this.edges_weight.push(edgeWeight);
    };
}

function Graph(NODES_COUNT) {
    var cThis = this;

    this.NODES_COUNT = NODES_COUNT;

    this.WEIGHTED = 0;

    this.clear = function () {
        cThis.NODES_COUNT = null;
        cThis.EDGES_COUNT = 0;
        cThis.NodeList = [];
        cThis.EdgeList = [];
        cThis.notifyGraphChanged();
    };

    this.init = function (nodeCount) {
        cThis.NODES_COUNT = nodeCount;
        for (var i = 0; i < cThis.NODES_COUNT; ++i)
            cThis.NodeList.push(new Node(i));
    };

    this.prepareToDisplay = function () {
        cThis.COLOR_SEED = Math.floor(Math.random() * 100);

        var sX = canvasWidth / 2,
            sY = canvasHeight / 2,
            cAngle = 0,
            dAngle = 2 * Math.PI / cThis.NODES_COUNT;

        for (var i = 0; i < cThis.NODES_COUNT; ++i) {
            cThis.NodeList[i].x = cThis.NodeList[i].fX = sX + CIRCLE_RADIUS * Math.cos(cAngle);
            cThis.NodeList[i].y = cThis.NodeList[i].fY = sY + CIRCLE_RADIUS * Math.sin(cAngle);
            cAngle += dAngle;
        }
    };

    this.addEdge = function (nodeStart, nodeFinish, nodeWeight) {
        ++cThis.EDGES_COUNT;

        cThis.NodeList[nodeStart].appendEdge(nodeFinish, nodeWeight);
        cThis.EdgeList.push({from: nodeStart, to: nodeFinish, weight: nodeWeight});

        ++cThis.NodeList[nodeStart].outDegree;
        ++cThis.NodeList[nodeFinish].inDegree;

        cThis.notifyGraphChanged();
    };

    this.display = function (context, indexToDisplay) {
        if (typeof indexToDisplay == "undefined") {
            var i;
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                cThis.displayVertex(context, i);
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                cThis.displayEdgesFromVertex(context, i);
        }
        else {
            cThis.displayVertex(context, indexToDisplay);
            cThis.displayEdgesFromVertex(context, indexToDisplay);
        }
    };

    this.displayVertex = function (context, indexToDisplay) {
        context.fillStyle = COLOR_LIST[(cThis.COLOR_SEED + indexToDisplay) % COLOR_LIST.length];
        context.beginPath();
        context.arc(cThis.NodeList[indexToDisplay].x, cThis.NodeList[indexToDisplay].y, VERTEX_RADIUS, 0, 2 * Math.PI);
        context.fill();
        context.strokeStyle = "black";
        context.lineWidth = 1;
        context.beginPath();
        context.arc(cThis.NodeList[indexToDisplay].x, cThis.NodeList[indexToDisplay].y, VERTEX_RADIUS, 0, 2 * Math.PI);
        context.stroke();
        context.fillStyle = "white";
        context.font = "20px Consolas";
        var numberLength = Math.floor(Math.log(indexToDisplay + 1) / Math.log(10) + 1e-5);
        context.fillText((indexToDisplay + 1) + "", cThis.NodeList[indexToDisplay].x - 5.5 * numberLength - 5, cThis.NodeList[indexToDisplay].y + 7);
    };

    this.displayEdgesFromVertex = function (context, nodeStart, color, width) {
        color = typeof color !== "undefined" ? color : "black";
        width = typeof width !== "undefined" ? width : 1;

        context.strokeStyle = context.fillStyle = color;
        context.lineWidth = width;
        for (var i = 0; i < cThis.NodeList[nodeStart].edges_list.length; ++i) {
            if (cThis.NodeList[nodeStart] == cThis.NodeList[cThis.NodeList[nodeStart].edges_list[i]])
                canvas.drawArrow(cThis.NodeList[nodeStart], cThis.NodeList[nodeStart], cThis.NodeList[nodeStart].edges_weight[i], context);
            else {
                var point1 = jQuery.extend({}, cThis.NodeList[nodeStart]),
                    point2 = jQuery.extend({}, cThis.NodeList[cThis.NodeList[nodeStart].edges_list[i]]);

                var shortenedLine = canvas.shortenLine(point1, point2, VERTEX_RADIUS);
                canvas.drawArrow(shortenedLine[0], shortenedLine[1], cThis.NodeList[nodeStart].edges_weight[i], context);
            }
        }
    };

    this.getVertex = function (nodeIndex) {
        return cThis.NodeList[nodeIndex];
    };

    this.notifyGraphChanged = function () {
        cThis.FormattedEdgesList = null;
        cThis.DistanceMatrix = null;
        cThis.AdjacencyMatrix = null;
        cThis.IncidenceMatrix = null;
        cThis.FormattedVerticesDegree = null;
        cThis.SourceNodes = null;
        cThis.SinkNodes = null;
        cThis.FundamentalCycles = null;
        cThis.TopologicalSort = null;
        cThis.AdditionalInfo = null;
    };

    this.DistanceMatrix = null;
    this.getDistanceMatrix = function () {
        if (!cThis.DistanceMatrix) {
            var i, j, k;
            cThis.DistanceMatrix = new Array(cThis.NODES_COUNT);
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                cThis.DistanceMatrix[i] = new Array(cThis.NODES_COUNT);
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                for (j = 0; j < cThis.NODES_COUNT; ++j)
                    cThis.DistanceMatrix[i][j] = -1;
            for (i = 0; i < cThis.EDGES_COUNT; ++i)
                cThis.DistanceMatrix[cThis.EdgeList[i].from][cThis.EdgeList[i].to] = cThis.EdgeList[i].weight;

            for (i = 0; i < cThis.NODES_COUNT; ++i)
                cThis.DistanceMatrix[i][i] = 0;
            for (k = 0; k < cThis.NODES_COUNT; ++k)
                for (i = 0; i < cThis.NODES_COUNT; ++i)
                    for (j = 0; j < cThis.NODES_COUNT; ++j)
                        if (cThis.DistanceMatrix[i][k] != -1 && cThis.DistanceMatrix[k][j] != -1) {
                            if (cThis.DistanceMatrix[i][j] == -1)
                                cThis.DistanceMatrix[i][j] = cThis.DistanceMatrix[i][k] + cThis.DistanceMatrix[k][j];
                            else
                                cThis.DistanceMatrix[i][j] = Math.min(cThis.DistanceMatrix[i][j], cThis.DistanceMatrix[i][k] + cThis.DistanceMatrix[k][j]);
                        }
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                for (j = 0; j < cThis.NODES_COUNT; ++j)
                    if (isNaN(cThis.DistanceMatrix[i][j]))
                        cThis.DistanceMatrix[i][j] = -1;
        }
        return cThis.DistanceMatrix;
    };

    this.FormattedEdgesList = null;
    this.getFormattedEdgesList = function () {
        if (!cThis.FormattedEdgesList) {
            var i, j,
                EDGES_PER_COLUMN = 20,
                subMatricesCount = Math.floor((cThis.EDGES_COUNT - 1) / EDGES_PER_COLUMN) + 1;
            cThis.FormattedEdgesList = new Array(subMatricesCount);
            for (i = 0; i < subMatricesCount; ++i) {
                if (i < subMatricesCount - 1)
                    cThis.FormattedEdgesList[i] = new Array(EDGES_PER_COLUMN + 1);
                else
                    cThis.FormattedEdgesList[i] = new Array(2 + (cThis.EDGES_COUNT - 1) % EDGES_PER_COLUMN);
                for (j = 0; j < cThis.FormattedEdgesList[i].length; ++j)
                    cThis.FormattedEdgesList[i][j] = new Array(4);
                cThis.FormattedEdgesList[i][0] = ["", "From", "To", "Weight"];
                for (j = 1; j < cThis.FormattedEdgesList[i].length; ++j) {
                    cThis.FormattedEdgesList[i][j][0] = j + i * EDGES_PER_COLUMN + " edge";
                    cThis.FormattedEdgesList[i][j][1] = cThis.EdgeList[j - 1 + i * EDGES_PER_COLUMN].from + 1;
                    cThis.FormattedEdgesList[i][j][2] = cThis.EdgeList[j - 1 + i * EDGES_PER_COLUMN].to + 1;
                    if (cThis.EdgeList[j - 1 + i * EDGES_PER_COLUMN].weight == undefined)
                        cThis.FormattedEdgesList[i][j][3] = "NaN";
                    else
                        cThis.FormattedEdgesList[i][j][3] = cThis.EdgeList[j - 1 + i * EDGES_PER_COLUMN].weight;
                }
            }
        }
        return cThis.FormattedEdgesList;
    };

    this.AdjacencyMatrix = null;
    this.getAdjacencyMatrix = function () {
        if (!cThis.AdjacencyMatrix) {
            var i, j;
            cThis.AdjacencyMatrix = new Array(1) ;
            cThis.AdjacencyMatrix[0] = new Array(cThis.NODES_COUNT+1);
            for (i = 0; i < cThis.NODES_COUNT+1; ++i)
                cThis.AdjacencyMatrix[0][i] = new Array(cThis.NODES_COUNT+1);
            for(i = 0 ; i < cThis.NODES_COUNT+1; ++i)
                cThis.AdjacencyMatrix[0][i][0] = cThis.AdjacencyMatrix[0][0][i] = i ;
            cThis.AdjacencyMatrix[0][0][0] = "-" ;
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                for (j = 0; j < cThis.NODES_COUNT; ++j)
                    cThis.AdjacencyMatrix[0][i+1][j+1] = 0;
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                for (j = 0; j < cThis.NodeList[i].edges_list.length; ++j)
                    cThis.AdjacencyMatrix[0][i+1][cThis.NodeList[i].edges_list[j]+1] = 1;
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                cThis.AdjacencyMatrix[0][i+1][i+1] = 1;
        }
        return cThis.AdjacencyMatrix;
    };

    this.IncidenceMatrix = null;
    this.getIncidenceMatrix = function () {
        if (!cThis.IncidenceMatrix) {
            var i, j;
            cThis.IncidenceMatrix = new Array(cThis.NODES_COUNT);
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                cThis.IncidenceMatrix[i] = new Array(cThis.EDGES_COUNT);
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                for (j = 0; j < cThis.EDGES_COUNT; ++j)
                    if (cThis.EdgeList[j].from == i && cThis.EdgeList[j].to == i)
                        cThis.IncidenceMatrix[i][j] = "L";
                    else if (cThis.EdgeList[j].from == i)
                        cThis.IncidenceMatrix[i][j] = -1;
                    else if (cThis.EdgeList[j].to == i)
                        cThis.IncidenceMatrix[i][j] = 1;
                    else
                        cThis.IncidenceMatrix[i][j] = 0;
        }
        return cThis.IncidenceMatrix;
    };

    this.FormattedVerticesDegree = null;
    this.getFormattedVerticesDegree = function () {
        if (!cThis.FormattedVerticesDegree) {
            var i, j, k,
                subMatricesCount = Math.floor((cThis.NODES_COUNT - 1) / 15) + 1;
            cThis.FormattedVerticesDegree = new Array(subMatricesCount);
            for (i = 0; i < subMatricesCount; ++i) {
                if (i < subMatricesCount - 1)
                    cThis.FormattedVerticesDegree[i] = new Array(16);
                else
                    cThis.FormattedVerticesDegree[i] = new Array(2 + (cThis.NODES_COUNT - 1) % 15);
                cThis.FormattedVerticesDegree[i][0] = ["", "In-deg", "Out-deg"];
                for (j = 1; j < cThis.FormattedVerticesDegree[i].length; ++j)
                    cThis.FormattedVerticesDegree[i][j] = [j + i * 15 + " edge",
                        cThis.NodeList[j - 1 + i * 15].inDegree, cThis.NodeList[j - 1 + i * 15].outDegree];
            }
        }
        return cThis.FormattedVerticesDegree;
    };

    this.SourceNodes = null;
    this.getSourceNodes = function () {
        if (!cThis.SourceNodes) {
            var i, j, allIsolated = [],
                EDGES_PER_COLUMN = 15;
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                if (cThis.NodeList[i].inDegree == 0)
                    allIsolated.push(i + 1);
            var subMatricesCount = Math.floor((allIsolated.length - 1) / EDGES_PER_COLUMN) + 1;
            cThis.SourceNodes = new Array(subMatricesCount);
            for (i = 0; i < subMatricesCount; ++i) {
                if (i < subMatricesCount - 1)
                    cThis.SourceNodes[i] = new Array(EDGES_PER_COLUMN + 1);
                else
                    cThis.SourceNodes[i] = new Array(2 + (allIsolated.length - 1) % EDGES_PER_COLUMN);
                cThis.SourceNodes[i][0] = ["Edge", "In-Degree"];
                for (j = 1; j < cThis.SourceNodes[i].length; ++j)
                    cThis.SourceNodes[i][j] = [allIsolated[j - 1], 0];
            }
        }
        return cThis.SourceNodes;
    };

    this.SinkNodes = null;
    this.getSinkNodes = function () {
        if (!cThis.SinkNodes) {
            var i, j, allLeafs = [],
                EDGES_PER_COLUMN = 15;
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                if (cThis.NodeList[i].outDegree == 0)
                    allLeafs.push(i + 1);
            var subMatricesCount = Math.floor((allLeafs.length - 1) / EDGES_PER_COLUMN) + 1;
            cThis.SinkNodes = new Array(subMatricesCount);
            for (i = 0; i < subMatricesCount; ++i) {
                if (i < subMatricesCount - 1)
                    cThis.SinkNodes[i] = new Array(EDGES_PER_COLUMN + 1);
                else
                    cThis.SinkNodes[i] = new Array(2 + (allLeafs.length - 1) % EDGES_PER_COLUMN);
                cThis.SinkNodes[i][0] = ["Edge", "Out-Degree"];
                for (j = 1; j < cThis.SinkNodes[i].length; ++j)
                    cThis.SinkNodes[i][j] = [allLeafs[j - 1], 0];
            }
        }
        return cThis.SinkNodes;
    };

    this.FundamentalCycles = null;
    this.getFundamentalCycles = function () {
        if (!cThis.FundamentalCycles) {
            var getCycles = FundamentalCycleList(cThis), i, maxWidth = 0;
            for (i = 0; i < getCycles.length; ++i)
                maxWidth = Math.max(maxWidth, getCycles[i].length);
            cThis.FundamentalCycles = new Array(1 + getCycles.length);
            cThis.FundamentalCycles[0] = new Array(1 + maxWidth);
            for (i = 0; i <= maxWidth; ++i)
                cThis.FundamentalCycles[0][i] = "-";
            for (i = 1; i <= getCycles.length; ++i) {
                cThis.FundamentalCycles[i] = new Array(1 + maxWidth);
                cThis.FundamentalCycles[i][0] = i;
                for (var j = 0; j < getCycles[i - 1].length; ++j)
                    cThis.FundamentalCycles[i][j + 1] = getCycles[i - 1][j] + 1;
                for (j = getCycles[i - 1].length + 1; j <= maxWidth; ++j)
                    cThis.FundamentalCycles[i][j] = "-";
            }
        }
        return cThis.FundamentalCycles;
    };

    this.TraversalAlgorithmsInfo = null ;
    this.getTraversalAlgorithmsInfo = function(algoType, startVertex) {
        function formatArray(travArray) {
            if( travArray.length == 0 )
                return "" ;
            var strFormat = "" + (travArray[0]+1) ;
            for( var i = 1 ; i < travArray.length ; ++i )
                strFormat += ", " + (travArray[i]+1) ;
            return strFormat ;
        }
        var curVertex, nextVertex, i, foundSomething ;
        if (algoType == "DFS") {
            cThis.TraversalAlgorithmsInfo = [
                ["-", "Vertex", "DFS Number", "Stack content"],
                ["-", startVertex + 1, 1, startVertex + 1]
            ];
            var dfsNumber = 1,
                dfsStack = [startVertex],
                dfsVisited = new Array(cThis.NODES_COUNT);
            dfsVisited[startVertex] = true;
            while (dfsStack.length) {
                curVertex = dfsStack[dfsStack.length - 1];
                foundSomething = false;
                for (i = 0; i < cThis.NodeList[curVertex].edges_list.length; ++i) {
                    nextVertex = cThis.NodeList[curVertex].edges_list[i];
                    if (!dfsVisited[nextVertex]) {
                        dfsVisited[nextVertex] = true;
                        dfsStack.push(nextVertex);
                        foundSomething = true;
                        cThis.TraversalAlgorithmsInfo.push(["-", nextVertex + 1, ++dfsNumber, formatArray(dfsStack)]);
                        break;
                    }
                }
                if (!foundSomething) {
                    dfsStack.pop();
                    if (dfsStack.length)
                        cThis.TraversalAlgorithmsInfo.push(["-", "-", "-", formatArray(dfsStack)]);
                    else
                        cThis.TraversalAlgorithmsInfo.push(["-", "-", "-", "empty"]);
                }
            }
            cThis.TraversalAlgorithmsInfo = [cThis.TraversalAlgorithmsInfo] ;
            return cThis.TraversalAlgorithmsInfo;
        }
        else if (algoType == "BFS") {
            cThis.TraversalAlgorithmsInfo = [
                ["-", "Vertex", "BFS Number", "Stack content"],
                ["-", startVertex + 1, 1, startVertex + 1]
            ];
            var bfsNumber = 1,
                bfsStack = [startVertex],
                bfsVisited = new Array(cThis.NODES_COUNT);
            bfsVisited[startVertex] = true;
            while (bfsStack.length) {
                curVertex = bfsStack[0];
                foundSomething = false;
                for (i = 0; i < cThis.NodeList[curVertex].edges_list.length; ++i) {
                    nextVertex = cThis.NodeList[curVertex].edges_list[i];
                    if (!bfsVisited[nextVertex]) {
                        bfsVisited[nextVertex] = true;
                        bfsStack.push(nextVertex);
                        cThis.TraversalAlgorithmsInfo.push(["-", nextVertex + 1, ++bfsNumber, formatArray(bfsStack)]);
                    }
                }
                bfsStack.shift();
                if (bfsStack.length)
                    cThis.TraversalAlgorithmsInfo.push(["-", "-", "-", formatArray(bfsStack)]);
                else
                    cThis.TraversalAlgorithmsInfo.push(["-", "-", "-", "empty"]);
            }
            cThis.TraversalAlgorithmsInfo = [cThis.TraversalAlgorithmsInfo] ;
            return cThis.TraversalAlgorithmsInfo;
        }
    } ;

    this.TopologicalSort = null;
    this.getTopologicalSort = function () {
        if (!cThis.TopologicalSort) {
            var getCycles = FundamentalCycleList(cThis) ;
            if (getCycles.length == cThis.NODES_COUNT) {
                cThis.TopologicalSort = [["Index","Vertex"]] ;
                var getSort = TopologicalSort(cThis);
                for (var i = 0; i < getSort.length; ++i)
                    cThis.TopologicalSort.push([""+(i+1),getSort[i]+1]) ;
            }
            else
                cThis.TopologicalSort = [["-"]] ;
        }
        return cThis.TopologicalSort ;
    };

    this.AdditionalInfo = null;
    this.getAdditionalInfo = function () {
        if (!cThis.AdditionalInfo) {
            if (!cThis.NODES_COUNT) {
                cThis.AdditionalInfo = [[]];
                return cThis.Additional;
            }
            //weighted
            //strong con
            //weak con
            //tree
            //full
            //dvudol
            //k-dol
            //chordal
            cThis.AdditionalInfo = new Array(7);
            var i;
            for (i = 0; i < 7; ++i)
                cThis.AdditionalInfo[i] = new Array(2);
            cThis.AdditionalInfo[0][0] = "-";

            cThis.AdditionalInfo[0][1] = "State";
            cThis.AdditionalInfo[1][0] = "Weighted";
            cThis.AdditionalInfo[2][0] = "Strongly connected";
            cThis.AdditionalInfo[3][0] = "Weakly connected";
            cThis.AdditionalInfo[4][0] = "Tree-like";
            cThis.AdditionalInfo[5][0] = "Full";
            cThis.AdditionalInfo[6][0] = "Regular";
            //cThis.AdditionalInfo[7][0] = "Bipartite" ;
            //cThis.AdditionalInfo[8][0] = "Chordal" ;

            cThis.AdditionalInfo[1][1] = ( cThis.WEIGHTED ? "+" : "-" );
            cThis.AdditionalInfo[2][1] = ( cThis.getFundamentalCycles().length == 2 ? "+" : "-" );
            cThis.AdditionalInfo[3][1] = ( checkWeakConnectivity(cThis) ? "+" : "-" );
            cThis.AdditionalInfo[4][1] = ( cThis.getFundamentalCycles().length == 1 + cThis.NODES_COUNT ? "+" : "-" );
            cThis.AdditionalInfo[5][1] = ( checkFullness(cThis) ? "+" : "-" );
            cThis.AdditionalInfo[6][1] = ( checkRegularity(cThis) ? "+" : "-" );
            //cThis.AdditionalInfo[7][1] = "+" ;
            //cThis.AdditionalInfo[8][1] = "+" ;
        }
        return cThis.AdditionalInfo;
    } ;

    this.updateInfo = function() {
        $("#input-info").click();
    } ;
}

function refreshImage() {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    canvasGraph.display(context);
    setTimeout(refreshImage, FRAME_REFRESH_TIME);
}

refreshImage();

function readFile(evt) {
    var f = evt.target.files[0];

    if (f) {
        var r = new FileReader();

        r.onload = function (e) {
            canvasGraph.clear();

            var fileContent = e.target.result;

            function processReadNumber(numberText) {
                var recNumber = parseInt(numberText);
                if (canvasGraph.NODES_COUNT == null)
                    canvasGraph.init(recNumber);
                else if (tempEdges == null)
                    tempEdges = recNumber;
                else if (tempWeighted == null) {
                    tempWeighted = recNumber;
                    canvasGraph.WEIGHTED = recNumber;
                }
                else if (edgeParent == null)
                    edgeParent = recNumber - 1;
                else if (edgeTo == null)
                    edgeTo = recNumber - 1;
                else {
                    canvasGraph.addEdge(edgeParent, edgeTo, recNumber);
                    edgeParent = null;
                    edgeTo = null;
                }
            }

            var lastTemp = "", tempEdges = null, tempWeighted = null, edgeParent = null, edgeTo = null;
            for (var i = 0, len = fileContent.length; i < len; ++i)
                if (fileContent[i] == " " || fileContent[i] == "\n") {
                    if (lastTemp != "") {
                        processReadNumber(lastTemp);
                        lastTemp = "";
                    }
                }
                else
                    lastTemp += fileContent[i];
            if (lastTemp != "")
                processReadNumber(lastTemp);

            canvasGraph.prepareToDisplay();
            canvasGraph.updateInfo() ;
        };

        r.readAsText(f);
    } else {
        alert("Failed to load file");
    }
}

document.getElementById('fileinput').addEventListener('change', readFile, false);

function doNothing() {
    return 0;
}

var nodeTarget = null;

canvas.onmousedown = function (event) {
    var canvasRect = canvas.getBoundingClientRect(),
        clickX = event.clientX - canvasRect.left,
        clickY = event.clientY - canvasRect.top;

    for (var i = canvasGraph.NODES_COUNT - 1; i >= 0; --i)
        if (canvas.pointInCircle({x: clickX, y: clickY}, canvasGraph.getVertex(i), VERTEX_RADIUS)) {
            nodeTarget = canvasGraph.getVertex(i);
            event.target.style.cursor = 'move';
            break;
        }
};

canvas.onmousemove = function (event) {
    if (nodeTarget == null)
        return;

    var canvasRect = canvas.getBoundingClientRect();

    nodeTarget.x = event.clientX - canvasRect.left;
    nodeTarget.y = event.clientY - canvasRect.top;
};

canvas.onmouseup = function (event) {
    if (nodeTarget != null)
        nodeTarget = null;

    event.target.style.cursor = 'default';
};

canvas.pointInCircle = function (point, center, radius) {
    var dist = canvas.distance(point, center);
    return dist < radius + 1e-5;
};

canvas.distance = function (point1, point2) {
    var dx = point2.x - point1.x,
        dy = point2.y - point1.y;
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
};

canvas.lineAngle = function (point1, point2) {
    if (point1 != point2) {
        var lineAngle;
        if (point1.x == point2.x) {
            if (point2.y > point1.y)
                lineAngle = Math.PI / 2;
            else
                lineAngle = 3 * Math.PI / 2;
        }
        lineAngle = Math.atan(Math.abs(point2.y - point1.y) / Math.abs(point2.x - point1.x));

        if (point2.x >= point1.x) {
            if (point2.y >= point1.y)
                doNothing();
            else
                lineAngle = -lineAngle;
        }
        else {
            if (point2.y >= point1.y)
                lineAngle = Math.PI - lineAngle;
            else
                lineAngle = lineAngle - Math.PI;
        }
        return lineAngle;
    }
    else
    //return 2 * Math.PI * point1.index / NODES_COUNT ;
        return canvas.lineAngle({x: canvasWidth / 2, y: canvasHeight / 2}, point1);
};

canvas.shortenLine = function (point1, point2, dLength) {
    if (canvas.distance(point1, point2) > dLength + 1e-5) {
        var lineAngle = canvas.lineAngle(point1, point2);
        point1.x += dLength * Math.cos(lineAngle);
        point1.y += dLength * Math.sin(lineAngle);
        point2.x -= dLength * Math.cos(lineAngle);
        point2.y -= dLength * Math.sin(lineAngle);
    }
    return [point1, point2];
};

canvas.drawArrow = function (point1, point2, value, context) {
    var lineAngle = canvas.lineAngle(point1, point2),
        angleLeft,
        angleRight,
        arrowLength = 10;

    if (point1 != point2) {
        context.strokeStyle = "black";
        context.beginPath();
        context.moveTo(point1.x, point1.y);
        context.lineTo(point2.x, point2.y);
        context.stroke();

        if( value != null ) {
            var pc = {
                    x: (point1.x + point2.x) / 2,
                    y: (point1.y + point2.y) / 2
                },
                sqSize = 10;
            context.fillStyle = "lightgray";
            context.beginPath();
            context.moveTo(pc.x - sqSize, pc.y - sqSize);
            context.lineTo(pc.x - sqSize, pc.y + sqSize);
            context.lineTo(pc.x + sqSize, pc.y + sqSize);
            context.lineTo(pc.x + sqSize, pc.y - sqSize);
            context.lineTo(pc.x - sqSize, pc.y - sqSize);
            context.fill();
            context.strokeStyle = "black";
            context.beginPath();
            context.moveTo(pc.x - sqSize, pc.y - sqSize);
            context.lineTo(pc.x - sqSize, pc.y + sqSize);
            context.lineTo(pc.x + sqSize, pc.y + sqSize);
            context.lineTo(pc.x + sqSize, pc.y - sqSize);
            context.lineTo(pc.x - sqSize, pc.y - sqSize);
            context.stroke();
            context.fillStyle = "black";
            context.font = "14px Consolas";
            var numberLength = Math.floor(Math.log(value) / Math.log(10) + 1e-5);
            context.fillText(value + "", pc.x - 3 * numberLength - 4, pc.y + 4);
        }
        angleLeft = lineAngle - Math.PI / 6;
        angleRight = lineAngle + Math.PI / 6;

        context.fillStyle = "black";
        context.beginPath();
        context.moveTo(point2.x - arrowLength * Math.cos(angleLeft), point2.y - arrowLength * Math.sin(angleLeft));
        context.lineTo(point2.x, point2.y);
        context.lineTo(point2.x - arrowLength * Math.cos(angleRight), point2.y - arrowLength * Math.sin(angleRight));
        context.fill();
    }
    else {
        var loopLength = 60,
            pointStart = {
                x: point1.x + Math.cos(Math.PI / 6 + lineAngle) * VERTEX_RADIUS,
                y: point1.y + Math.sin(Math.PI / 6 + lineAngle) * VERTEX_RADIUS
            },
            pointFinish = {
                x: point1.x + Math.cos(-Math.PI / 6 + lineAngle) * VERTEX_RADIUS,
                y: point1.y + Math.sin(-Math.PI / 6 + lineAngle) * VERTEX_RADIUS
            };

        context.beginPath();
        context.moveTo(pointStart.x, pointStart.y);
        context.bezierCurveTo(
            point1.x + Math.cos(Math.PI / 6 + lineAngle) * loopLength, point1.y + Math.sin(Math.PI / 6 + lineAngle) * loopLength,
            point1.x + Math.cos(-Math.PI / 6 + lineAngle) * loopLength, point1.y + Math.sin(-Math.PI / 6 + lineAngle) * loopLength,
            pointFinish.x, pointFinish.y);
        context.stroke();

        angleLeft = lineAngle - Math.PI / 3 + Math.PI / 24;
        angleRight = lineAngle + Math.PI / 24;

        context.beginPath();
        context.moveTo(pointFinish.x + arrowLength * Math.cos(angleLeft), pointFinish.y + arrowLength * Math.sin(angleLeft));
        context.lineTo(pointFinish.x, pointFinish.y);
        context.lineTo(pointFinish.x + arrowLength * Math.cos(angleRight), pointFinish.y + arrowLength * Math.sin(angleRight));
        context.fill();
    }
};


function createTable(matrix, tdWidth) {
    var newTable = document.createElement("table"),
        matrixHeight = matrix.length,
        newTr, newTd, i, j;

    for (i = 0; i < matrixHeight; ++i) {
        newTr = document.createElement("tr");
        for (j = 0; j < matrix[i].length; ++j) {
            newTd = document.createElement("td");
            newTd.appendChild(document.createTextNode("" + matrix[i][j]));
            if(tdWidth && tdWidth[j])
                newTd.style.width = tdWidth[j] + "px" ;
            newTr.appendChild(newTd);
        }
        newTable.appendChild(newTr);
    }

    return newTable;
}

function columnWidths(item1, item2, item3) {
    switch(item1) {
        case "input-info":
            return [55,40,35,50] ;
        default:
            return [] ;
    }
}

function verticesWithHeadText(headText) {
    var vertices = [headText], i ;
    for( i = 0 ; i < canvasGraph.NODES_COUNT ; ++i )
        vertices.push("Vertex " + (i+1)) ;
    return vertices ;
}

function needPopup(itemName) {
    if( itemName == "input-info" ||
        itemName == "reset" )
        return false ;
    return true ;
}

function dropdown1list(itemName) {
    switch (itemName) {
        case "connectivity":
            return [
                ["Reachability matrix", 0],
                ["Adjacency matrix", 0],
                ["Incidence matrix", 0],
                ["Vertices degree", 0]
            ] ;
        case "components":
            return [
                ["Weakly connected components", 0],
                ["Strongly connected components", 0]
            ] ;
        case "distances":
            return [
                ["Between all vertices", 1],
                ["From one to all vertices", 2]
            ] ;
        case "cycles":
            return [
                ["Fundamental cycles", 0],
                ["Negative cycles", 0]
            ] ;
        case "flow":
            return [
                ["Minimum flow" , 2],
                ["Maximum flow", 2]
            ] ;
        case "traversal":
            return [
                ["DFS", 1],
                ["BFS", 1]
            ] ;
        case "special-vertices":
            return [
                ["Leafs", 0],
                ["Source vertices", 0]
            ] ;
    }
}

function dropdown2list(itemName) {
    switch (itemName) {
        case "Between all vertices":
            return [
                "Floyd-Warshall algorithm"
            ] ;
        case "From one to all vertices":
            return [
                "Dijkstra algorithm",
                "Ford-Bellman algorithm"
            ] ;
        case "Minimum flow":
        case "Maximum flow":
            return verticesWithHeadText("Select start vertex:") ;
        case "DFS":
        case "BFS":
            return verticesWithHeadText("Select start vertex:") ;
    }
}

function dropdown3list(itemName) {
    switch (itemName) {
        case "From one to all vertices":
            return verticesWithHeadText("Select start vertex: ") ;
        case "Minimum flow":
        case "Maximum flow":
            return verticesWithHeadText("Select end vertex: ") ;
    }
}

function getTableContent(item0, item1, item2, item3) {
    var vertexStart ;
    var vertexEnd ;
    switch (item0) {
        case "input-info" :
            return canvasGraph.getFormattedEdgesList() ;
        case "connectivity" :
            switch(item1) {
                case "Reachability matrix" :
                    //TODO
                    return canvasGraph.getDistanceMatrix() ;
                case "Adjacency matrix" :
                    return canvasGraph.getAdjacencyMatrix() ;
                case "Incidence matrix" :
                    return canvasGraph.getIncidenceMatrix() ;
                case "Vertices degree" :
                    return canvasGraph.getFormattedVerticesDegree() ;
            }
            return ;
        case "components" :
            switch(item1) {
                case "Weakly connected components" :
                    //TODO
                    return canvasGraph.getWeakComponents() ;
                case "Strongly connected components" :
                    return canvasGraph.getFundamentalCycles() ;
            }
            return;
        case "distances":
            switch(item1) {
                case "Between all vertices" :
                    switch(item2) {
                        case "Floyd-Warshall algorithm":
                            //TODO
                            return canvasGraph.getDistanceMatrix() ;
                    }
                return ;
                case "From one to all vertices" :
                    vertexStart = parseInt(item3.substring(7, item3.length)) - 1 ;
                    switch(item2) {
                        case "Dijkstra algorithm":
                            //TODO
                            return canvasGraph.getDistanceMatrix() ;
                        case "Ford-Bellman algorithm":
                            //TODO
                            return canvasGraph.getDistanceMatrix() ;
                    }
                    return ;
            }
            return;
        case "cycles":
            switch(item1) {
                case "Fundamental cycles" :
                    //TODO
                    return canvasGraph.getFundamentalCycles() ;
                case "Negative cycles" :
                    //TODO
                    return canvasGraph.getFundamentalCycles() ;
            }
            return;
        case "flow":
            vertexStart = parseInt(item2.substring(7, item2.length)) - 1 ;
            vertexEnd = parseInt(item3.substring(7, item3.length)) - 1 ;
            switch(item1) {
                case "Minimum flow" :
                    //TODO
                    return canvasGraph.getDistanceMatrix() ;
                case "Maximum flow" :
                    //TODO
                    return canvasGraph.getDistanceMatrix() ;
            }
            return;
        case "traversal":
            vertexStart = parseInt(item2.substring(7, item2.length)) - 1 ;
            switch(item1) {
                case "DFS" :
                    return canvasGraph.getTraversalAlgorithmsInfo(
                        "DFS",
                        vertexStart
                    ) ;
                case "BFS" :
                    return canvasGraph.getTraversalAlgorithmsInfo(
                        "BFS",
                        vertexStart
                    ) ;
            }
            return;
        case "special":
            switch(item1) {
                case "Leafs" :
                    return canvasGraph.getSinkNodes() ;
                case "Source vertices" :
                    return canvasGraph.getSourceNodes() ;
            }
    }
}

function getContentDescription(item0, item1, item2, item3) {
    var vertexStart ;
    var vertexEnd ;
    switch (item0) {
        case "input-info" :
            return "Input information";
        case "connectivity" :
            switch(item1) {
                case "Reachability matrix" :
                    return "Reachability matrix";
                case "Adjacency matrix" :
                    return "Adjacency matrix";
                case "Incidence matrix" :
                    return "Incidence matrix";
                case "Vertices degree" :
                    return "Vertices degree";
            }
        case "components" :
            switch(item1) {
                case "Weakly connected components" :
                    return "Weakly connected components" ;
                case "Strongly connected components" :
                    return "Strongly connected components" ;
            }
            return;
        case "distances":
            switch(item1) {
                case "Between all vertices" :
                    return "Distances between all vertices" ;
                case "From one to all vertices" :
                    vertexStart = parseInt(item3.substring(7, item3.length)) - 1 ;
                    return "Distances from " + vertexStart + " to all vertices" ;
            }
            return;
        case "cycles":
            switch(item1) {
                case "Fundamental cycles" :
                    return "Fundamental cycles list" ;
                case "Negative cycles" :
                    return "Negative cycles list" ;
            }
            return;
        case "flow":
            vertexStart = parseInt(item2.substring(7, item2.length)) - 1 ;
            vertexEnd = parseInt(item3.substring(7, item3.length)) - 1 ;
            switch(item1) {
                case "Minimum flow" :
                    return "Minimum flow from " + vertexStart + " to " + vertexEnd + " vertices" ;
                case "Maximum flow" :
                    return "Maximum flow from " + vertexStart + " to " + vertexEnd + " vertices" ;
            }
            return;
        case "traversal":
            vertexStart = parseInt(item2.substring(7, item2.length)) - 1 ;
            switch(item1) {
                case "DFS" :
                    return canvasGraph.getTraversalAlgorithmsInfo(
                        "DFS",
                        vertexStart
                    ) ;
                case "BFS" :
                    return canvasGraph.getTraversalAlgorithmsInfo(
                        "BFS",
                        vertexStart
                    ) ;
            }
            return;
        case "special":
            switch(item1) {
                case "Leafs" :
                    return canvasGraph.getSinkNodes() ;
                case "Source vertices" :
                    return canvasGraph.getSourceNodes() ;
            }
        case "additional":
            return canvasGraph.getAdditionalInfo() ;
    }
}

function getAdditionalContentDescription(item0, item1, item2, item3) {
    switch (item0) {
        case "input-info" :
            return null ;
        case "connectivity" :
            switch(item1) {
                case "Reachability matrix" :
                    return null;
                case "Adjacency matrix" :
                    return null;
                case "Incidence matrix" :
                    return null;
                case "Vertices degree" :
                    return null;
            }
        case "components" :
            switch(item1) {
                case "Weakly connected components" :
                    return null ;
                case "Strongly connected components" :
                    return null ;
            }
            return;
        case "distances":
            switch(item1) {
                case "Between all vertices" :
                    switch(item2) {
                        case "Floyd-Warshall algorithm":
                            return "using Floyd-Warshall algorithm" ;
                    }
                    return ;
                case "From one to all vertices" :
                    vertexStart = parseInt(item3.substring(7, item3.length)) - 1 ;
                    switch(item2) {
                        case "Dijkstra algorithm":
                            return "using Dijkstra algorithm" ;
                        case "Ford-Bellman algorithm":
                            return "using Ford-Bellman algorithm" ;
                    }
                    return ;
            }
            return;
        case "cycles":
            switch(item1) {
                case "Fundamental cycles" :
                    return null ;
                case "Negative cycles" :
                    return null ;
            }
            return;
        case "flow":
            vertexStart = parseInt(item2.substring(7, item2.length)) - 1 ;
            vertexEnd = parseInt(item3.substring(7, item3.length)) - 1 ;
            switch(item1) {
                case "Minimum flow" :
                    return null ;
                case "Maximum flow" :
                    return null ;
            }
            return;
        case "traversal":
            vertexStart = parseInt(item2.substring(7, item2.length)) - 1 ;
            switch(item1) {
                case "DFS" :
                    return "using Depth-First Search" ;
                case "BFS" :
                    return "using Breadth-First Search" ;
            }
            return;
        case "special":
            switch(item1) {
                case "Leafs" :
                    return null ;
                case "Source vertices" :
                    return null ;
            }
        case "additional":
            return null ;
    }
}

var mainContent = document.getElementsByClassName("content")[0] ;
var mainContentDescription = $(".content-description"),
    mainAdditionalContentDescription = $(".additional-content-description") ;

var dropdownList1, dropdownList2, dropdownList3, item0, item1, item2, item3 ;
function handleMenu(itemName) {
    item0 = itemName ;
    if( needPopup(itemName) ) {
        $("#overlay").css("visibility", "visible");
        $(".choice1").css("display", "block");
        $(".choice2").css("display", "none");
        $(".choice3").css("display", "none");

        dropdownList1 = dropdown1list(itemName) ;
        var newOption = document.createElement("option");
        newOption.appendChild(document.createTextNode("..."));
        $("select[name=\"popup-make-choice1\"]").empty().append(newOption);
        for( var i = 0 ; i < dropdownList1.length ; ++i ) {
            newOption = document.createElement("option") ;
            newOption.appendChild(
                document.createTextNode( dropdownList1[i][0] )
            );
            $("select[name=\"popup-make-choice1\"]").append(newOption);
        }
    }
    else {
        while (mainContent.getElementsByTagName("table")[0] != undefined)
            mainContent.removeChild(mainContent.getElementsByTagName("table")[0]);
        mainContentDescription.text( getContentDescription(itemName) ) ;
        for (j = 0; j < getTableContent(itemName).length; ++j)
            mainContent.appendChild(
                createTable(getTableContent(itemName)[j],
                columnWidths(itemName))
            );
    }
}

$( "select[name=\"popup-make-choice1\"]").on("change", "", function() {
    item1 = this.value ;
    $(".choice2").css("display", "none");
    $(".choice3").css("display", "none");

    for( var i = 0 ; i < dropdownList1.length ; ++i )
        if( dropdownList1[i][0] == item1 ) {
            var newOption ;
            if( dropdownList1[i][1] > 0 ) {
                $(".choice2").css("display", "block");
                $(".choice3").css("display", "none");
                dropdownList2 = dropdown2list(this.value) ;
                $("select[name=\"popup-make-choice2\"]").empty() ;
                for( var j = 0 ; j < dropdownList2.length ; ++j ) {
                    newOption = document.createElement("option") ;
                    newOption.appendChild(
                        document.createTextNode( dropdownList2[j] )
                    );
                    $("select[name=\"popup-make-choice2\"]").append(newOption);
                }
            }
            if( dropdownList1[i][1] > 1 ) {
                $(".choice3").css("display", "block");
                dropdownList3 = dropdown3list(this.value) ;
                $("select[name=\"popup-make-choice3\"]").empty() ;
                for( var j = 0 ; j < dropdownList3.length ; ++j ) {
                    newOption = document.createElement("option") ;
                    newOption.appendChild(
                        document.createTextNode( dropdownList3[j] )
                    );
                    $("select[name=\"popup-make-choice3\"]").append(newOption);
                }
            }
        }
});

$(".popup-confirm").on("click", function() {
    $("#overlay").css("visibility", "hidden");
    $(".choice1").css("display", "none");
    $(".choice2").css("display", "none");
    $(".choice3").css("display", "none");

    item2 = $('select[name="popup-make-choice2"]').find(":selected").text();
    item3 = $('select[name="popup-make-choice3"]').find(":selected").text();

    if( item1 == "..." || item2 == "..." || item3 == "..." ) {
        mainContentDescription.text( "You did not select one of the options" ) ;
        return ;
    }

    while (mainContent.getElementsByTagName("table")[0] != undefined)
        mainContent.removeChild(mainContent.getElementsByTagName("table")[0]);
    mainContentDescription.text( getContentDescription(item0, item1, item2, item3) ) ;
    for (j = 0; j < getTableContent(item0, item1, item2, item3).length; ++j)
        mainContent.appendChild(
            createTable(getTableContent(item0, item1, item2, item3)[j],
                columnWidths(item0, item1, item2, item3))
        );
}) ;

$(".popup-decline").on("click", function() {
    $("#overlay").css("visibility", "hidden");
    $(".choice1").css("display", "none");
    $(".choice2").css("display", "none");
    $(".choice3").css("display", "none");
}) ;

(function() {
    canvasGraph.clear();
    canvasGraph.init(7);
    (function () {
        for (var i = 0; i < 7; ++i)
            for (var j = 0; j < 7; ++j)
                if (i != j)
                    canvasGraph.addEdge(i, j);
    })();
    canvasGraph.prepareToDisplay();
    canvasGraph.updateInfo() ;
    handleMenu("input-info") ;
})() ;

$("#settings").on("click", function() {

}) ;