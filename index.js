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
    var nvis, rEdgeList, i;

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

    vis = new Array(myGraph.NODES_COUNT);
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

function Node(index) {
    this.index = index;
    this.edges_list = [];
    this.inDegree = 0;
    this.outDegree = 0;

    this.appendEdge = function (edgeTo) {
        this.edges_list.push(edgeTo);
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

        cThis.NodeList[nodeStart].appendEdge(nodeFinish);
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
                canvas.drawArrow(cThis.NodeList[nodeStart], cThis.NodeList[nodeStart], context);
            else {
                var point1 = jQuery.extend({}, cThis.NodeList[nodeStart]),
                    point2 = jQuery.extend({}, cThis.NodeList[cThis.NodeList[nodeStart].edges_list[i]]);

                var shortenedLine = canvas.shortenLine(point1, point2, VERTEX_RADIUS);
                canvas.drawArrow(shortenedLine[0], shortenedLine[1], context);
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
                cThis.FormattedEdgesList[i][0][0] = "";
                cThis.FormattedEdgesList[i][0][1] = "From";
                cThis.FormattedEdgesList[i][0][2] = "To";
                cThis.FormattedEdgesList[i][0][3] = "Weight";
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
            cThis.AdjacencyMatrix = new Array(cThis.NODES_COUNT);
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                cThis.AdjacencyMatrix[i] = new Array(cThis.NODES_COUNT);
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                for (j = 0; j < cThis.NODES_COUNT; ++j)
                    cThis.AdjacencyMatrix[i][j] = 0;
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                for (j = 0; j < cThis.NodeList[i].edges_list.length; ++j)
                    cThis.AdjacencyMatrix[i][cThis.NodeList[i].edges_list[j]] = 1;
            for (i = 0; i < cThis.NODES_COUNT; ++i)
                cThis.AdjacencyMatrix[i][i] = 1;

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
                for (j = 0; j < cThis.FormattedVerticesDegree[i].length; ++j) {
                    cThis.FormattedVerticesDegree[i][j] = new Array(3);
                    cThis.FormattedVerticesDegree[i][j][1] = 0;
                }
                cThis.FormattedVerticesDegree[i][0][0] = "";
                cThis.FormattedVerticesDegree[i][0][1] = "In-deg";
                cThis.FormattedVerticesDegree[i][0][2] = "Out-deg";
                for (j = 1; j < cThis.FormattedVerticesDegree[i].length; ++j) {
                    cThis.FormattedVerticesDegree[i][j][0] = j + i * 15 + " edge";
                    cThis.FormattedVerticesDegree[i][j][1] = cThis.NodeList[j - 1 + i * 15].inDegree;
                    cThis.FormattedVerticesDegree[i][j][2] = cThis.NodeList[j - 1 + i * 15].outDegree;
                }
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
                cThis.SourceNodes[i][0] = new Array(2);
                cThis.SourceNodes[i][0][0] = "Edge";
                cThis.SourceNodes[i][0][1] = "In-Degree";
                for (j = 1; j < cThis.SourceNodes[i].length; ++j) {
                    cThis.SourceNodes[i][j] = new Array(2);
                    cThis.SourceNodes[i][j][0] = allIsolated[j - 1];
                    cThis.SourceNodes[i][j][1] = 0;
                }
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
                cThis.SinkNodes[i][0] = new Array(2);
                cThis.SinkNodes[i][0][0] = "Edge";
                cThis.SinkNodes[i][0][1] = "Out-Degree";
                for (j = 1; j < cThis.SinkNodes[i].length; ++j) {
                    cThis.SinkNodes[i][j] = new Array(2);
                    cThis.SinkNodes[i][j][0] = allLeafs[j - 1];
                    cThis.SinkNodes[i][j][1] = 0;
                }
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

            cThis.AdditionalInfo[2][1] = ( cThis.FundamentalCycles.length == 2 ? "+" : "-" );

            cThis.AdditionalInfo[3][1] = ( checkWeakConnectivity(cThis) ? "+" : "-" );

            cThis.AdditionalInfo[4][1] = ( cThis.FundamentalCycles.length == 1 + cThis.NODES_COUNT ? "+" : "-" );

            cThis.AdditionalInfo[5][1] = ( checkFullness(cThis) ? "+" : "-" );

            cThis.AdditionalInfo[6][1] = ( checkRegularity(cThis) ? "+" : "-" );

            //cThis.AdditionalInfo[7][1] = "+" ;

            //cThis.AdditionalInfo[8][1] = "+" ;
        }
        return cThis.AdditionalInfo;
    } ;

    this.updateInfo = function() {
        updateAllInfo() ;
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
    //Retrieve the first (and only!) File from the FileList object
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

canvas.drawArrow = function (point1, point2, context) {
    var lineAngle = canvas.lineAngle(point1, point2),
        angleLeft,
        angleRight,
        arrowLength = 10;

    if (point1 != point2) {
        context.beginPath();
        context.moveTo(point1.x, point1.y);
        context.lineTo(point2.x, point2.y);
        context.stroke();

        angleLeft = lineAngle - Math.PI / 6;
        angleRight = lineAngle + Math.PI / 6;

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

//CSS

function resetTdHover() {
    var tableTDs = document.body.getElementsByTagName("td");
    for (var i = 0; i < tableTDs.length; ++i)
        tableTDs[i].onmouseover = function () {
        }
}

var divsCount = 9 ;

var divLinks = [
        document.body.getElementsByClassName("input-info")[0],
        document.body.getElementsByClassName("distance-matrix")[0],
        document.body.getElementsByClassName("adjacency-matrix")[0],
        document.body.getElementsByClassName("incidence-matrix")[0],
        document.body.getElementsByClassName("vertices-degree")[0],
        document.body.getElementsByClassName("source-nodes")[0],
        document.body.getElementsByClassName("sink-nodes")[0],
        document.body.getElementsByClassName("cycles")[0],
        document.body.getElementsByClassName("additional")[0]
    ],
    divContentLinks = [
        document.body.getElementsByClassName("input-info-content")[0],
        document.body.getElementsByClassName("distance-matrix-content")[0],
        document.body.getElementsByClassName("adjacency-matrix-content")[0],
        document.body.getElementsByClassName("incidence-matrix-content")[0],
        document.body.getElementsByClassName("vertices-degree-content")[0],
        document.body.getElementsByClassName("source-nodes-content")[0],
        document.body.getElementsByClassName("sink-nodes-content")[0],
        document.body.getElementsByClassName("cycles-content")[0],
        document.body.getElementsByClassName("additional-content")[0]
    ];


function removeDivTables(divIndex) {
    while (divContentLinks[divIndex].getElementsByTagName("table")[0] != undefined)
        divContentLinks[divIndex].removeChild(divLinks[divIndex].getElementsByTagName("table")[0]);
}

function divsFunctionList(divIndex) {
    switch (divIndex) {
        case 0:
            return canvasGraph.getFormattedEdgesList;
        case 1:
            return canvasGraph.getDistanceMatrix;
        case 2:
            return canvasGraph.getAdjacencyMatrix;
        case 3:
            return canvasGraph.getIncidenceMatrix;
        case 4:
            return canvasGraph.getFormattedVerticesDegree;
        case 5:
            return canvasGraph.getSourceNodes;
        case 6:
            return canvasGraph.getSinkNodes;
        case 7:
            return canvasGraph.getFundamentalCycles;
        case 8:
            return canvasGraph.getAdditionalInfo;
    }
}

var multipleTables = [
        1, 0, 0, 0, 1, 1, 1, 0, 0
    ],
    needTableNumeration = [
        false, true, true, true, false, false, false, false, false
    ],
    columnWidths = [
        [55,40,35,50], [], [], [], [55,55,55], [50,65], [50,70], [], [130,50]
    ] ;

function updateAllInfo() {
    for (var i = 0; i < divsCount; ++i) {
        document.body.getElementsByTagName("li")[i].onclick = (function () {
            var remI = i;
            return function () {
                var j ;
                for (j = 0; j < divsCount; ++j)
                    divLinks[j].style.zIndex = 0;
                divLinks[remI].style.zIndex = 10;
                removeDivTables(remI) ;
                if( multipleTables[remI] )
                    for (j = 0; j < divsFunctionList(remI)().length; ++j)
                        divContentLinks[remI].appendChild(createTable(divsFunctionList(remI)()[j],
                            needTableNumeration[remI], columnWidths[remI]));
                else
                    divContentLinks[remI].appendChild(createTable(divsFunctionList(remI)(),
                        needTableNumeration[remI], columnWidths[remI]));
            }
        })() ;
    }
}

document.body.getElementsByTagName("li")[divsCount].onclick = function () {
    canvasGraph.prepareToDisplay();
};

function createTable(matrix, addIndexes, tdWidth) {
    var
        newTable = document.createElement("table"),
        matrixHeight = matrix.length,
        newTr, newTd, i, j;

    if (addIndexes) {
        newTr = document.createElement("tr");
        newTd = document.createElement("td");
        newTd.appendChild(document.createTextNode(""));
        newTr.appendChild(newTd);
        for (j = 0; j < matrix[0].length; ++j) {
            newTd = document.createElement("td");
            newTd.appendChild(document.createTextNode("" + (j + 1)));
            if(tdWidth && tdWidth[j])
                newTd.style.width = tdWidth[j] + "px" ;
            newTr.appendChild(newTd);
        }
        newTable.appendChild(newTr);
    }

    for (i = 0; i < matrixHeight; ++i) {
        newTr = document.createElement("tr");
        if (addIndexes) {
            newTd = document.createElement("td");
            newTd.appendChild(document.createTextNode("" + (i + 1)));
            if(tdWidth && tdWidth[j])
                newTd.style.width = tdWidth[j] + "px" ;
            console.log(newTd.style.width) ;
            newTr.appendChild(newTd);
        }
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
})() ;