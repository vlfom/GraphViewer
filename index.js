var canvas = document.getElementById("mainField"),
    context = canvas.getContext( "2d" ),
    canvasWidth = parseInt(document.getElementById("mainField").getAttribute("width")),
    canvasHeight = parseInt(document.getElementById("mainField").getAttribute("height")) ;

var VERTEX_RADIUS = 20,
    CIRCLE_RADIUS = 200,
    FRAME_REFRESH_TIME = 20,
    COLOR_LIST = [
        "#c62828","#ad1457","#6a1b9a","#4527a0","#283593","#1565c0","#0277bd",
        "#00838f","#00695c","#2e7d32","#558b2f","#9e9d24","#f9a825","#ff8f00",
        "#ef6c00","#d84315"],
    canvasGraph = new Graph(0) ;

function checkRegularity( myGraph ) {
    var i,
        firstNodeIn = myGraph.NodeList[0].inDegree,
        firstNodeOut = myGraph.NodeList[0].outDegree;
    for (i = 1; i < myGraph.NODES_COUNT; ++i)
        if (myGraph.NodeList[i].inDegree != firstNodeIn ||
            myGraph.NodeList[i].outDegree != firstNodeOut)
            return false ;
    return true ;
}

function checkFullness( myGraph ) {
    var i, j,
        tempMatrix = new Array(myGraph.NODES_COUNT) ;
    for( i = 0 ; i < myGraph.NODES_COUNT ; ++i )
        tempMatrix[i] = new Array(myGraph.NODES_COUNT) ;
    for( i = 0 ; i < myGraph.NODES_COUNT ; ++i )
        for( j = 0 ; j < myGraph.NODES_COUNT ; ++j )
            tempMatrix[i][j] = 0 ;
    for( i = 0 ; i < myGraph.NODES_COUNT ; ++i )
        for( j = 0; j < myGraph.NodeList[i].edges_list.length ; ++j )
            tempMatrix[i][myGraph.NodeList[i].edges_list[j]] = 1 ;
    for( i = 0 ; i < myGraph.NODES_COUNT ; ++i )
        for( j = 0 ; j < myGraph.NODES_COUNT ; ++j )
            if( i != j && !tempMatrix[i][j] )
                return false ;
    return true ;
}

function checkWeakConnectivity( myGraph ) {
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

function FundamentalCycleList( myGraph ) {
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

function Node( index ) {
    this.index = index ;
    this.edges_list = [] ;
    this.inDegree = 0 ;
    this.outDegree = 0 ;

    this.appendEdge = function ( edgeTo ) {
        this.edges_list.push( edgeTo ) ;
    } ;
}

function Graph( NODES_COUNT ) {
    this.NODES_COUNT = NODES_COUNT;

    this.WEIGHTED = 0 ;

    this.clear = function () {
        this.NODES_COUNT = null;
        this.EDGES_COUNT = 0;
        this.NodeList = [];
        this.EdgeList = [];
        this.notifyGraphChanged();
    };

    this.init = function (nodeCount) {
        this.NODES_COUNT = nodeCount;
        for (var i = 0; i < this.NODES_COUNT; ++i)
            this.NodeList.push(new Node(i));
    };

    this.prepareToDisplay = function () {
        this.COLOR_SEED = Math.floor(Math.random() * 100);

        var sX = canvasWidth / 2,
            sY = canvasHeight / 2,
            cAngle = 0,
            dAngle = 2 * Math.PI / this.NODES_COUNT;

        for (var i = 0; i < this.NODES_COUNT; ++i) {
            this.NodeList[i].x = this.NodeList[i].fX = sX + CIRCLE_RADIUS * Math.cos(cAngle);
            this.NodeList[i].y = this.NodeList[i].fY = sY + CIRCLE_RADIUS * Math.sin(cAngle);
            cAngle += dAngle;
        }
    };

    this.addEdge = function (nodeStart, nodeFinish, nodeWeight) {
        ++this.EDGES_COUNT;

        this.NodeList[nodeStart].appendEdge(nodeFinish);
        this.EdgeList.push({from: nodeStart, to: nodeFinish, weight: nodeWeight});

        ++this.NodeList[nodeStart].outDegree;
        ++this.NodeList[nodeFinish].inDegree;

        this.notifyGraphChanged();
    };

    this.display = function (context, indexToDisplay) {
        if (typeof indexToDisplay == "undefined") {
            var i;
            for (i = 0; i < this.NODES_COUNT; ++i)
                this.displayVertex(context, i);
            for (i = 0; i < this.NODES_COUNT; ++i)
                this.displayEdgesFromVertex(context, i);
        }
        else {
            this.displayVertex(context, indexToDisplay);
            this.displayEdgesFromVertex(context, indexToDisplay);
        }
    };

    this.displayVertex = function (context, indexToDisplay) {
        context.fillStyle = COLOR_LIST[(this.COLOR_SEED + indexToDisplay) % COLOR_LIST.length];
        context.beginPath();
        context.arc(this.NodeList[indexToDisplay].x, this.NodeList[indexToDisplay].y, VERTEX_RADIUS, 0, 2 * Math.PI);
        context.fill();
        context.strokeStyle = "black";
        context.lineWidth = 1;
        context.beginPath();
        context.arc(this.NodeList[indexToDisplay].x, this.NodeList[indexToDisplay].y, VERTEX_RADIUS, 0, 2 * Math.PI);
        context.stroke();
        context.fillStyle = "white";
        context.font = "20px Consolas";
        var numberLength = Math.floor(Math.log(indexToDisplay + 1) / Math.log(10) + 1e-5);
        context.fillText((indexToDisplay + 1) + "", this.NodeList[indexToDisplay].x - 5.5 * numberLength - 5, this.NodeList[indexToDisplay].y + 7);
    };

    this.displayEdgesFromVertex = function (context, nodeStart, color, width) {
        color = typeof color !== "undefined" ? color : "black";
        width = typeof width !== "undefined" ? width : 1;

        context.strokeStyle = context.fillStyle = color;
        context.lineWidth = width;
        for (var i = 0; i < this.NodeList[nodeStart].edges_list.length; ++i) {
            if (this.NodeList[nodeStart] == this.NodeList[this.NodeList[nodeStart].edges_list[i]])
                canvas.drawArrow(this.NodeList[nodeStart], this.NodeList[nodeStart], context);
            else {
                var point1 = jQuery.extend({}, this.NodeList[nodeStart]),
                    point2 = jQuery.extend({}, this.NodeList[this.NodeList[nodeStart].edges_list[i]]);

                var shortenedLine = canvas.shortenLine(point1, point2, VERTEX_RADIUS);
                canvas.drawArrow(shortenedLine[0], shortenedLine[1], context);
            }
        }
    };

    this.getVertex = function (nodeIndex) {
        return this.NodeList[nodeIndex];
    };

    this.notifyGraphChanged = function () {
        this.FormattedEdgesList = null;
        this.DistanceMatrix = null;
        this.AdjacencyMatrix = null;
        this.IncidenceMatrix = null;
        this.FormattedVerticesDegree = null;
        this.SourceNodes = null ;
        this.SinkNodes = null ;
        this.FundamentalCycles = null ;
        this.AdditionalInfo = null ;
    };

    this.DistanceMatrix = null;
    this.getDistanceMatrix = function () {
        if (!this.DistanceMatrix) {
            var i, j, k;
            this.DistanceMatrix = new Array(this.NODES_COUNT);
            for (i = 0; i < this.NODES_COUNT; ++i)
                this.DistanceMatrix[i] = new Array(this.NODES_COUNT);
            for (i = 0; i < this.NODES_COUNT; ++i)
                for (j = 0; j < this.NODES_COUNT; ++j)
                    this.DistanceMatrix[i][j] = -1;
            for (i = 0; i < this.EDGES_COUNT; ++i)
                this.DistanceMatrix[this.EdgeList[i].from][this.EdgeList[i].to] = this.EdgeList[i].weight;

                for (i = 0; i < this.NODES_COUNT; ++i)
                    	this.DistanceMatrix[i][i] = 0 ;
            for (k = 0; k < this.NODES_COUNT; ++k)
                for (i = 0; i < this.NODES_COUNT; ++i)
                    for (j = 0; j < this.NODES_COUNT; ++j)
                        if (this.DistanceMatrix[i][k] != -1 && this.DistanceMatrix[k][j] != -1) {
                            if (this.DistanceMatrix[i][j] == -1)
                                this.DistanceMatrix[i][j] = this.DistanceMatrix[i][k] + this.DistanceMatrix[k][j];
                            else
                                this.DistanceMatrix[i][j] = Math.min(this.DistanceMatrix[i][j], this.DistanceMatrix[i][k] + this.DistanceMatrix[k][j]);
                        }
            for (i = 0; i < this.NODES_COUNT; ++i)
                for (j = 0; j < this.NODES_COUNT; ++j)
                    if( isNaN( this.DistanceMatrix[i][j] ) )
                        this.DistanceMatrix[i][j] = -1 ;
        }
        return this.DistanceMatrix;
    };

    this.FormattedEdgesList = null;
    this.getFormattedEdgesList = function () {
        if (!this.FormattedEdgesList) {
            var i, j,
                EDGES_PER_COLUMN = 20,
                subMatricesCount = Math.floor((this.EDGES_COUNT - 1) / EDGES_PER_COLUMN) + 1;
            this.FormattedEdgesList = new Array(subMatricesCount);
            for (i = 0; i < subMatricesCount; ++i) {
                if (i < subMatricesCount - 1)
                    this.FormattedEdgesList[i] = new Array(EDGES_PER_COLUMN + 1);
                else
                    this.FormattedEdgesList[i] = new Array(2 + (this.EDGES_COUNT - 1) % EDGES_PER_COLUMN);
                for (j = 0; j < this.FormattedEdgesList[i].length; ++j)
                    this.FormattedEdgesList[i][j] = new Array(4);
                this.FormattedEdgesList[i][0][0] = "";
                this.FormattedEdgesList[i][0][1] = "From";
                this.FormattedEdgesList[i][0][2] = "To";
                this.FormattedEdgesList[i][0][3] = "Weight";
                for (j = 1; j < this.FormattedEdgesList[i].length; ++j) {
                    this.FormattedEdgesList[i][j][0] = j + i * EDGES_PER_COLUMN + " edge";
                    this.FormattedEdgesList[i][j][1] = this.EdgeList[j - 1 + i * EDGES_PER_COLUMN].from + 1;
                    this.FormattedEdgesList[i][j][2] = this.EdgeList[j - 1 + i * EDGES_PER_COLUMN].to + 1;
                    if( this.EdgeList[j - 1 + i * EDGES_PER_COLUMN].weight == undefined )
                        this.FormattedEdgesList[i][j][3] = "NaN" ;
                    else
                        this.FormattedEdgesList[i][j][3] = this.EdgeList[j - 1 + i * EDGES_PER_COLUMN].weight ;
                }
            }
        }
        return this.FormattedEdgesList;
    };

    this.AdjacencyMatrix = null;
    this.getAdjacencyMatrix = function () {
        if (!this.AdjacencyMatrix) {
            var i, j;
            this.AdjacencyMatrix = new Array(this.NODES_COUNT);
            for (i = 0; i < this.NODES_COUNT; ++i)
                this.AdjacencyMatrix[i] = new Array(this.NODES_COUNT) ;
            for (i = 0; i < this.NODES_COUNT; ++i)
                for (j = 0; j < this.NODES_COUNT; ++j)
                    this.AdjacencyMatrix[i][j] = 0;
            for (i = 0; i < this.NODES_COUNT; ++i)
                for (j = 0; j < this.NodeList[i].edges_list.length; ++j)
                    this.AdjacencyMatrix[i][this.NodeList[i].edges_list[j]] = 1;
            for(i = 0; i < this.NODES_COUNT ; ++i)    
                this.AdjacencyMatrix[i][i] = 1 ;

        }
        return this.AdjacencyMatrix;
    };

    this.IncidenceMatrix = null;
    this.getIncidenceMatrix = function () {
        if (!this.IncidenceMatrix) {
            var i, j;
            this.IncidenceMatrix = new Array(this.NODES_COUNT);
            for (i = 0; i < this.NODES_COUNT; ++i)
                this.IncidenceMatrix[i] = new Array(this.EDGES_COUNT);
            for (i = 0; i < this.NODES_COUNT; ++i)
                for (j = 0; j < this.EDGES_COUNT; ++j)
                    if (this.EdgeList[j].from == i && this.EdgeList[j].to == i)
                        this.IncidenceMatrix[i][j] = "L";
                    else if (this.EdgeList[j].from == i)
                        this.IncidenceMatrix[i][j] = -1;
                    else if (this.EdgeList[j].to == i)
                        this.IncidenceMatrix[i][j] = 1;
                    else
                        this.IncidenceMatrix[i][j] = 0;
        }
        return this.IncidenceMatrix;
    };

    this.FormattedVerticesDegree = null;
    this.getFormattedVerticesDegree = function () {
        if (!this.FormattedVerticesDegree) {
            var i, j, k,
                subMatricesCount = Math.floor((this.NODES_COUNT - 1) / 15) + 1;
            this.FormattedVerticesDegree = new Array(subMatricesCount);
            for (i = 0; i < subMatricesCount; ++i) {
                if (i < subMatricesCount - 1)
                    this.FormattedVerticesDegree[i] = new Array(16);
                else
                    this.FormattedVerticesDegree[i] = new Array(2 + (this.NODES_COUNT - 1) % 15);
                for (j = 0; j < this.FormattedVerticesDegree[i].length; ++j) {
                    this.FormattedVerticesDegree[i][j] = new Array(3);
                    this.FormattedVerticesDegree[i][j][1] = 0;
                }
                this.FormattedVerticesDegree[i][0][0] = "";
                this.FormattedVerticesDegree[i][0][1] = "In-deg";
                this.FormattedVerticesDegree[i][0][2] = "Out-deg";
                for (j = 1; j < this.FormattedVerticesDegree[i].length; ++j) {
                    this.FormattedVerticesDegree[i][j][0] = j + i * 15 + " edge";
                    this.FormattedVerticesDegree[i][j][1] = this.NodeList[j - 1 + i * 15].inDegree;
                    this.FormattedVerticesDegree[i][j][2] = this.NodeList[j - 1 + i * 15].outDegree;
                }
            }
        }
        return this.FormattedVerticesDegree;
    };

    this.SourceNodes = null;
    this.getSourceNodes = function () {
        if (!this.SourceNodes) {
            var i, j, allIsolated = [],
                EDGES_PER_COLUMN = 15;
            for (i = 0; i < this.NODES_COUNT; ++i)
                if (this.NodeList[i].inDegree == 0)
                    allIsolated.push(i+1);
            var subMatricesCount = Math.floor((allIsolated.length - 1) / EDGES_PER_COLUMN) + 1;
            this.SourceNodes = new Array(subMatricesCount);
            for (i = 0; i < subMatricesCount; ++i) {
                if (i < subMatricesCount - 1)
                    this.SourceNodes[i] = new Array(EDGES_PER_COLUMN + 1);
                else
                    this.SourceNodes[i] = new Array(2 + (allIsolated.length - 1) % EDGES_PER_COLUMN);
                this.SourceNodes[i][0] = new Array(2);
                this.SourceNodes[i][0][0] = "Edge";
                this.SourceNodes[i][0][1] = "In-Degree";
                for (j = 1; j < this.SourceNodes[i].length; ++j) {
                    this.SourceNodes[i][j] = new Array(2);
                    this.SourceNodes[i][j][0] = allIsolated[j-1];
                    this.SourceNodes[i][j][1] = 0;
                }
            }
        }
        return this.SourceNodes;
    };

    this.SinkNodes = null ;
    this.getSinkNodes = function() {
        if (!this.SinkNodes) {
            var i, j, allLeafs = [],
                EDGES_PER_COLUMN = 15;
            for (i = 0; i < this.NODES_COUNT; ++i)
                if (this.NodeList[i].outDegree == 0)
                    allLeafs.push(i+1);
            var subMatricesCount = Math.floor((allLeafs.length - 1) / EDGES_PER_COLUMN) + 1;
            this.SinkNodes = new Array(subMatricesCount);
            for (i = 0; i < subMatricesCount; ++i) {
                if (i < subMatricesCount - 1)
                    this.SinkNodes[i] = new Array(EDGES_PER_COLUMN + 1);
                else
                    this.SinkNodes[i] = new Array(2 + (allLeafs.length - 1) % EDGES_PER_COLUMN);
                this.SinkNodes[i][0] = new Array(2);
                this.SinkNodes[i][0][0] = "Edge";
                this.SinkNodes[i][0][1] = "Out-Degree";
                for (j = 1; j < this.SinkNodes[i].length; ++j) {
                    this.SinkNodes[i][j] = new Array(2);
                    this.SinkNodes[i][j][0] = allLeafs[j-1];
                    this.SinkNodes[i][j][1] = 0;
                }
            }
        }
        return this.SinkNodes ;
    } ;

    this.FundamentalCycles = null ;
    this.getFundamentalCycles = function() {
        if( !this.FundamentalCycles ) {
            var getCycles = FundamentalCycleList(this), i, maxWidth = 0;
            for (i = 0; i < getCycles.length; ++i)
                maxWidth = Math.max(maxWidth, getCycles[i].length);
            this.FundamentalCycles = new Array(1 + getCycles.length);
            this.FundamentalCycles[0] = new Array(1 + maxWidth);
            for (i = 0; i <= maxWidth; ++i)
                this.FundamentalCycles[0][i] = "-";
            for (i = 1; i <= getCycles.length; ++i) {
                this.FundamentalCycles[i] = new Array(1 + maxWidth);
                this.FundamentalCycles[i][0] = i;
                for (var j = 0; j < getCycles[i - 1].length; ++j)
                    this.FundamentalCycles[i][j + 1] = getCycles[i - 1][j] + 1;
                for( j = getCycles[i-1].length+1 ; j <= maxWidth ; ++j )
                    this.FundamentalCycles[i][j] = "-" ;
            }
        }
        return this.FundamentalCycles ;
    } ;

    this.AdditionalInfo = null ;
    this.getAdditionalInfo = function() {
        if (!this.AdditionalInfo) {
            if (!this.NODES_COUNT) {
                this.AdditionalInfo = [[]];
                return this.Additional;
            }
            //weighted
            //strong con
            //weak con
            //tree
            //full
            //dvudol
            //k-dol
            //chordal
            this.AdditionalInfo = new Array(7) ;
            var i ;
            for( i = 0 ; i < 7 ; ++i )
                this.AdditionalInfo[i] = new Array(2) ;
            this.AdditionalInfo[0][0] = "-" ;

            this.AdditionalInfo[0][1] = "State" ;
            this.AdditionalInfo[1][0] = "Weighted" ;
            this.AdditionalInfo[2][0] = "Strongly connected" ;
            this.AdditionalInfo[3][0] = "Weakly connected" ;
            this.AdditionalInfo[4][0] = "Tree-like" ;
            this.AdditionalInfo[5][0] = "Full" ;
            this.AdditionalInfo[6][0] = "Regular" ;
            //this.AdditionalInfo[7][0] = "Bipartite" ;
            //this.AdditionalInfo[8][0] = "Chordal" ;

            this.AdditionalInfo[1][1] = ( this.WEIGHTED ? "+" : "-" ) ;

            this.AdditionalInfo[2][1] = ( this.FundamentalCycles.length == 2 ? "+" : "-" ) ;

            this.AdditionalInfo[3][1] = ( checkWeakConnectivity(this) ? "+" : "-" ) ;

            this.AdditionalInfo[4][1] = ( this.FundamentalCycles.length == 1 + this.NODES_COUNT ? "+" : "-" ) ;

            this.AdditionalInfo[5][1] = ( checkFullness(this) ? "+" : "-" ) ;

            this.AdditionalInfo[6][1] = ( checkRegularity(this) ? "+" : "-" );

            //this.AdditionalInfo[7][1] = "+" ;

            //this.AdditionalInfo[8][1] = "+" ;
        }
        return this.AdditionalInfo ;
    }
}

function refreshImage() {
    context.clearRect( 0, 0, canvasWidth, canvasHeight ) ;
    canvasGraph.display( context ) ;
    setTimeout( refreshImage, FRAME_REFRESH_TIME ) ;
}

refreshImage() ;

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
                else if( tempWeighted == null ) {
                    tempWeighted = recNumber;
                    canvasGraph.WEIGHTED = recNumber ;
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

            var lastTemp = "", tempEdges = null, tempWeighted = null,  edgeParent = null, edgeTo = null;
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

            updateInputInfo();
            updateDistanceMatrix();
            updateAdjacencyMatrix();
            updateIncidenceMatrix();
            updateVerticesDegree();
            updateSourceNodesInfo();
            updateSinkNodesInfo();
            updateCyclesInfo();
            updateAdditionalInfo();
        };

        r.readAsText(f);
    } else {
        alert("Failed to load file");
    }
}

document.getElementById('fileinput').addEventListener('change', readFile, false);

function doNothing() {
    return 0 ;
}

var nodeTarget = null ;

canvas.onmousedown = function( event ) {
    var canvasRect = canvas.getBoundingClientRect(),
        clickX = event.clientX - canvasRect.left,
        clickY = event.clientY - canvasRect.top ;

    for( var i = canvasGraph.NODES_COUNT - 1 ; i >= 0 ; --i )
        if( canvas.pointInCircle( { x : clickX, y : clickY }, canvasGraph.getVertex(i), VERTEX_RADIUS ) ) {
            nodeTarget = canvasGraph.getVertex(i) ;
            event.target.style.cursor = 'move' ;
            break;
        }
} ;

canvas.onmousemove = function( event ) {
    if( nodeTarget == null )
        return ;

    var canvasRect = canvas.getBoundingClientRect() ;

    nodeTarget.x = event.clientX - canvasRect.left ;
    nodeTarget.y = event.clientY - canvasRect.top ;
} ;

canvas.onmouseup = function( event ) {
    if( nodeTarget != null )
        nodeTarget = null ;

    event.target.style.cursor = 'default' ;
} ;

canvas.pointInCircle = function( point, center, radius ) {
    var dist = canvas.distance( point, center ) ;
    return dist < radius + 1e-5 ;
} ;

canvas.distance = function( point1, point2 ) {
    var dx = point2.x - point1.x,
        dy = point2.y - point1.y ;
    return Math.sqrt( Math.pow(dx,2) + Math.pow(dy,2) ) ;
} ;

canvas.lineAngle = function( point1, point2 ) {
    if( point1 != point2 ) {
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
        return lineAngle ;
    }
    else
        //return 2 * Math.PI * point1.index / NODES_COUNT ;
        return canvas.lineAngle( { x: canvasWidth/2, y: canvasHeight/2 }, point1 ) ;
} ;

canvas.shortenLine = function( point1, point2, dLength ) {
    if( canvas.distance(point1,point2) > dLength + 1e-5 ) {
        var lineAngle = canvas.lineAngle(point1, point2);
        point1.x += dLength * Math.cos(lineAngle);
        point1.y += dLength * Math.sin(lineAngle);
        point2.x -= dLength * Math.cos(lineAngle);
        point2.y -= dLength * Math.sin(lineAngle);
    }
    return [point1,point2] ;
} ;

canvas.drawArrow = function( point1, point2, context ) {
    var lineAngle = canvas.lineAngle(point1, point2),
        angleLeft,
        angleRight,
        arrowLength = 10 ;

    if( point1 != point2 ) {
        context.beginPath();
        context.moveTo(point1.x, point1.y);
        context.lineTo(point2.x, point2.y);
        context.stroke();

        angleLeft = lineAngle - Math.PI / 6 ;
        angleRight = lineAngle + Math.PI / 6 ;

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
                y: point1.y + Math.sin(Math.PI / 6 + lineAngle) * VERTEX_RADIUS},
            pointFinish = {
                x: point1.x + Math.cos(-Math.PI / 6 + lineAngle) * VERTEX_RADIUS,
                y: point1.y + Math.sin(-Math.PI / 6 + lineAngle) * VERTEX_RADIUS} ;

        context.beginPath();
        context.moveTo(pointStart.x, pointStart.y);
        context.bezierCurveTo(
            point1.x + Math.cos(Math.PI / 6 + lineAngle) * loopLength, point1.y + Math.sin(Math.PI / 6 + lineAngle) * loopLength,
            point1.x + Math.cos(-Math.PI / 6 + lineAngle) * loopLength, point1.y + Math.sin(-Math.PI / 6 + lineAngle) * loopLength,
            pointFinish.x, pointFinish.y);
        context.stroke();

        angleLeft = lineAngle - Math.PI / 3 + Math.PI / 24 ;
        angleRight = lineAngle + Math.PI / 24 ;

        context.beginPath();
        context.moveTo(pointFinish.x + arrowLength * Math.cos(angleLeft), pointFinish.y + arrowLength * Math.sin(angleLeft));
        context.lineTo(pointFinish.x, pointFinish.y);
        context.lineTo(pointFinish.x + arrowLength * Math.cos(angleRight), pointFinish.y + arrowLength * Math.sin(angleRight));
        context.fill();
    }
} ;

//CSS

function resetTdHover() {
    var tableTDs = document.body.getElementsByTagName("td") ;
    for( var i = 0 ; i < tableTDs.length ; ++i )
        tableTDs[i].onmouseover = function() {
        }
}

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
    ] ;

function unsetZIndex() {
    for( var i = 0 ; i < divLinks.length ; ++i )
        divLinks[i].style.zIndex = 0 ;
}

document.body.getElementsByTagName("li")[0].onclick = function() {
    unsetZIndex();
    divLinks[0].style.zIndex = 10;

    updateInputInfo() ;
}

document.body.getElementsByTagName("li")[1].onclick = function() {
    unsetZIndex();
    divLinks[1].style.zIndex = 10;

    updateDistanceMatrix() ;
};

document.body.getElementsByTagName("li")[2].onclick = function() {
    unsetZIndex();
    divLinks[2].style.zIndex = 10;

    updateAdjacencyMatrix() ;
};

document.body.getElementsByTagName("li")[3].onclick = function() {
    unsetZIndex();
    divLinks[3].style.zIndex = 10;

    updateIncidenceMatrix() ;
};

document.body.getElementsByTagName("li")[4].onclick = function() {
    unsetZIndex();
    divLinks[4].style.zIndex = 10;

    updateVerticesDegree() ;
};

document.body.getElementsByTagName("li")[5].onclick = function() {
    unsetZIndex();
    divLinks[5].style.zIndex = 10;

    updateSourceNodesInfo() ;
};

document.body.getElementsByTagName("li")[6].onclick = function() {
    unsetZIndex();
    divLinks[6].style.zIndex = 10;

    updateSinkNodesInfo() ;
};

document.body.getElementsByTagName("li")[7].onclick = function() {
    unsetZIndex();
    divLinks[7].style.zIndex = 10;

    updateCyclesInfo() ;
};

document.body.getElementsByTagName("li")[8].onclick = function() {
    unsetZIndex();
    divLinks[8].style.zIndex = 10;

    updateAdditionalInfo() ;
};

document.body.getElementsByTagName("li")[9].onclick = function() {
    canvasGraph.prepareToDisplay() ;
};

function createTable( matrix, addIndexes ) {
    var
        newTable = document.createElement("table"),
        matrixHeight = matrix.length,
        newTr, newTd, i, j ;

    if( addIndexes ) {
        newTr = document.createElement("tr");
        newTd = document.createElement("td");
        newTd.appendChild(document.createTextNode(""));
        newTr.appendChild(newTd);
        for (j = 0; j < matrix[0].length; ++j) {
            newTd = document.createElement("td");
            newTd.appendChild(document.createTextNode("" + (j + 1)));
            newTr.appendChild(newTd);
        }
        newTable.appendChild(newTr);
    }

    for (i = 0; i < matrixHeight; ++i) {
        newTr = document.createElement("tr");
        if( addIndexes ) {
            newTd = document.createElement("td");
            newTd.appendChild(document.createTextNode("" + (i + 1)));
            newTr.appendChild(newTd);
        }
        for (j = 0; j < matrix[i].length; ++j) {
            newTd = document.createElement("td");
            newTd.appendChild(document.createTextNode("" + matrix[i][j]));
            newTr.appendChild(newTd);
        }
        newTable.appendChild(newTr);
    }

    return newTable ;
}

function updateInputInfo() {
    while( divContentLinks[0].getElementsByTagName("table")[0] != undefined )
        divContentLinks[0].removeChild( divLinks[0].getElementsByTagName("table")[0] ) ;
    var i ;
    for( i = 0 ; i < canvasGraph.getFormattedEdgesList().length ; ++i )
        divContentLinks[0].appendChild( createTable( canvasGraph.getFormattedEdgesList()[i], false, 40 ) ) ;
    var inputRows = divContentLinks[0].getElementsByTagName("tr") ;
    for( i = 0 ; i < inputRows.length ; ++i ) {
        inputRows[i].getElementsByTagName("td")[0].style.width = "55px";
        inputRows[i].getElementsByTagName("td")[1].style.width = "40px";
        inputRows[i].getElementsByTagName("td")[2].style.width = "35px";
        inputRows[i].getElementsByTagName("td")[3].style.width = "50px";
    }
}

function updateDistanceMatrix() {
    while ( divContentLinks[1].getElementsByTagName("table")[0] != undefined )
        divContentLinks[1].removeChild( divLinks[1].getElementsByTagName("table")[0] ) ;
    divContentLinks[1].appendChild( createTable( canvasGraph.getDistanceMatrix(), true ) ) ;
}

function updateAdjacencyMatrix() {
    while ( divContentLinks[2].getElementsByTagName("table")[0] != undefined )
        divContentLinks[2].removeChild( divLinks[2].getElementsByTagName("table")[0] ) ;
    divContentLinks[2].appendChild( createTable( canvasGraph.getAdjacencyMatrix(), true ) ) ;
}

function updateIncidenceMatrix() {
    while ( divContentLinks[3].getElementsByTagName("table")[0] != undefined )
        divContentLinks[3].removeChild( divLinks[3].getElementsByTagName("table")[0] ) ;
    divContentLinks[3].appendChild( createTable( canvasGraph.getIncidenceMatrix(), true ) ) ;
}

function updateVerticesDegree() {
    while( divContentLinks[4].getElementsByTagName("table")[0] != undefined )
        divContentLinks[4].removeChild( divLinks[4].getElementsByTagName("table")[0] ) ;
    var i ;
    for( i = 0 ; i < canvasGraph.getFormattedVerticesDegree().length ; ++i )
        divContentLinks[4].appendChild( createTable( canvasGraph.getFormattedVerticesDegree()[i], false, 40 ) ) ;
    var inputRows = divContentLinks[4].getElementsByTagName("tr") ;
    for( i = 0 ; i < inputRows.length ; ++i )
        inputRows[i].getElementsByTagName("td")[0].style.width =
        inputRows[i].getElementsByTagName("td")[1].style.width =
        inputRows[i].getElementsByTagName("td")[2].style.width = "55px" ;
}

function updateSourceNodesInfo() {
    while (divContentLinks[5].getElementsByTagName("table")[0] != undefined)
        divContentLinks[5].removeChild(divLinks[5].getElementsByTagName("table")[0]);
    var i;
    for (i = 0; i < canvasGraph.getSourceNodes().length; ++i)
        divContentLinks[5].appendChild(createTable(canvasGraph.getSourceNodes()[i], false));
    var inputRows = divContentLinks[5].getElementsByTagName("tr");
    for (i = 0; i < inputRows.length; ++i) {
        inputRows[i].getElementsByTagName("td")[0].style.width = "50px" ;
        inputRows[i].getElementsByTagName("td")[1].style.width = "65px";
    }
}

function updateSinkNodesInfo() {
    while (divContentLinks[6].getElementsByTagName("table")[0] != undefined)
        divContentLinks[6].removeChild(divLinks[6].getElementsByTagName("table")[0]);
    var i;
    for (i = 0; i < canvasGraph.getSourceNodes().length; ++i)
        divContentLinks[6].appendChild(createTable(canvasGraph.getSinkNodes()[i], false));
    var inputRows = divContentLinks[6].getElementsByTagName("tr");
    for (i = 0; i < inputRows.length; ++i) {
        inputRows[i].getElementsByTagName("td")[0].style.width = "50px" ;
        inputRows[i].getElementsByTagName("td")[1].style.width = "70px";
    }
}

function updateCyclesInfo() {
    while (divContentLinks[7].getElementsByTagName("table")[0] != undefined)
        divContentLinks[7].removeChild(divLinks[7].getElementsByTagName("table")[0]);
    divContentLinks[7].appendChild(createTable(canvasGraph.getFundamentalCycles(), false));
}

function updateAdditionalInfo() {
    while (divContentLinks[8].getElementsByTagName("table")[0] != undefined)
        divContentLinks[8].removeChild(divLinks[8].getElementsByTagName("table")[0]);
    divContentLinks[8].appendChild(createTable(canvasGraph.getAdditionalInfo(), false));
    divContentLinks[8].getElementsByTagName("tr")[0].getElementsByTagName("td")[0].style.width = "130px";
    divContentLinks[8].getElementsByTagName("tr")[0].getElementsByTagName("td")[1].style.width = "50px";
}

/***********START GRAPH***********/
canvasGraph.clear() ;
canvasGraph.init(7) ;
(function() {
    for( var i = 0 ; i < 7 ; ++i )
        for( var j = 0 ; j < 7 ; ++j )
            if( i != j )
                canvasGraph.addEdge( i,j ) ;
})() ;
canvasGraph.prepareToDisplay() ;

updateInputInfo();
updateDistanceMatrix();
updateAdjacencyMatrix();
updateIncidenceMatrix();
updateVerticesDegree();
updateSourceNodesInfo();
updateSinkNodesInfo();
updateCyclesInfo();
updateAdditionalInfo();
/***********                 ***********/