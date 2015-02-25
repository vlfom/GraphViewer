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

function Node( index ) {
    this.index = index ;
    this.edges_list = [] ;

    this.appendEdge = function ( edgeTo ) {
        this.edges_list.push( edgeTo ) ;
    } ;
}

function Graph( NODES_COUNT ) {
    this.NODES_COUNT = NODES_COUNT ;

    this.clear = function() {
        this.NODES_COUNT = this.EDGES_COUNT = null ; this.NodeList = this.EdgeList = [] ;
    } ;

    this.init = function( nodeCount ) {
        this.NODES_COUNT = nodeCount ;
        for(var i = 0 ; i < this.NODES_COUNT; ++i)
            this.NodeList.push( new Node(i) ) ;
        this.COLOR_SEED = Math.floor( Math.random() * 100 ) ;
    } ;

    this.prepareToDisplay = function() {
        var sX = canvasWidth/2,
            sY = canvasHeight/2,
            cAngle = 0,
            dAngle = 2*Math.PI / this.NODES_COUNT ;

        for( var i = 0 ; i < this.NODES_COUNT ; ++i ) {
            this.NodeList[i].x = this.NodeList[i].fX = sX + CIRCLE_RADIUS * Math.cos(cAngle);
            this.NodeList[i].y = this.NodeList[i].fY = sY + CIRCLE_RADIUS * Math.sin(cAngle);
            cAngle += dAngle ;
        }
    } ;

    this.addEdge = function( nodeStart, nodeFinish ) {
        this.NodeList[nodeStart].appendEdge(nodeFinish) ;
        this.EdgeList.push( { from: nodeStart, to: nodeFinish } ) ;

        this.notifyGraphChanged() ;
    } ;

    this.display = function( context, indexToDisplay ) {
        if( typeof indexToDisplay == "undefined" ) {
            var i ;
            for (i = 0; i < this.NODES_COUNT; ++i)
                this.displayVertex( context, i ) ;
            for (i = 0; i < this.NODES_COUNT; ++i)
                this.displayEdgesFromVertex( context, i );
        }
        else {
            this.displayVertex( context, indexToDisplay ) ;
            this.displayEdgesFromVertex( context, indexToDisplay ) ;
        }
    } ;

    this.displayVertex = function( context, indexToDisplay ) {
        context.fillStyle = COLOR_LIST[(this.COLOR_SEED+indexToDisplay)%COLOR_LIST.length] ;
        context.beginPath();
            context.arc(this.NodeList[indexToDisplay].x, this.NodeList[indexToDisplay].y, VERTEX_RADIUS, 0, 2 * Math.PI);
            context.fill();
        context.strokeStyle = "black" ; context.lineWidth = 1 ;
        context.beginPath();
            context.arc(this.NodeList[indexToDisplay].x, this.NodeList[indexToDisplay].y, VERTEX_RADIUS, 0, 2 * Math.PI);
        context.stroke();
        context.fillStyle = "white";
        context.font = "20px Consolas";
        var numberLength = Math.floor(Math.log(indexToDisplay + 1) / Math.log(10) + 1e-5) ;
        context.fillText((indexToDisplay + 1) + "", this.NodeList[indexToDisplay].x - 5.5 * numberLength - 5, this.NodeList[indexToDisplay].y + 7);
    } ;

    this.displayEdgesFromVertex = function( context, nodeStart, color, width ) {
        color = typeof color !== "undefined" ? color : "black" ;
        width = typeof width !== "undefined" ? width : 2 ;

        context.strokeStyle = context.fillStyle = color ; context.lineWidth = width ;
        for (var i = 0; i < this.NodeList[nodeStart].edges_list.length; ++i) {
            if( this.NodeList[nodeStart] == this.NodeList[this.NodeList[nodeStart].edges_list[i]] )
                canvas.drawArrow(this.NodeList[nodeStart], this.NodeList[nodeStart], context);
            else {
                var point1 = jQuery.extend({}, this.NodeList[nodeStart]),
                    point2 = jQuery.extend({}, this.NodeList[this.NodeList[nodeStart].edges_list[i]]);

                var shortenedLine = canvas.shortenLine(point1, point2, VERTEX_RADIUS);
                canvas.drawArrow(shortenedLine[0], shortenedLine[1], context);
            }
        }
    } ;

    this.getVertex = function( nodeIndex ) {
        return this.NodeList[ nodeIndex ] ;
    } ;

    this.notifyGraphChanged = function() {
        this.AdjacencyMatrix = null ;
    } ;

    this.AdjacencyMatrix = null ;
    this.getAdjacencyMatrix = function() {
        if( !this.AdjacencyMatrix ) {
            var i, j;
            this.AdjacencyMatrix = new Array(this.NODES_COUNT);
            for (i = 0; i < this.NODES_COUNT; ++i)
                this.AdjacencyMatrix[i] = new Array(this.NODES_COUNT);
            for (i = 0; i < this.NODES_COUNT; ++i)
                for (j = 0; j < this.NODES_COUNT; ++j)
                    this.AdjacencyMatrix[i][j] = 0;
            for (i = 0; i < this.NODES_COUNT; ++i)
                for (j = 0; j < this.NodeList[i].edges_list.length; ++j)
                    this.AdjacencyMatrix[i][this.NodeList[i].edges_list[j]] = 1;
        }
        return this.AdjacencyMatrix ;
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

        r.onload = function(e) {
            canvasGraph.clear() ;

            var fileContent = e.target.result ;

            function processReadNumber( numberText ) {
                var recNumber = parseInt(numberText);
                if (canvasGraph.NODES_COUNT == null)
                    canvasGraph.init( recNumber ) ;
                else if (canvasGraph.EDGES_COUNT == null)
                    canvasGraph.EDGES_COUNT = recNumber ;
                else if (edgeParent == null)
                    edgeParent = recNumber - 1;
                else {
                    canvasGraph.addEdge( edgeParent, recNumber-1 ) ;
                    edgeParent = null;
                }
            }

            var lastTemp = "", edgeParent ;
            for( var i = 0, len = fileContent.length ; i < len ; ++i )
                if( fileContent[i] == " " || fileContent[i] == "\n" ) {
                    if( lastTemp != "" ) {
                        processReadNumber(lastTemp);
                        lastTemp = "";
                    }
                }
                else
                    lastTemp += fileContent[i] ;
            if( lastTemp != "" )
                processReadNumber(lastTemp) ;

            canvasGraph.prepareToDisplay() ;


            updateInputInfo() ;
            updateAdjacencyMatrix() ;
            updateIncidenceMatrix() ;
            updateVerticesDegree() ;
        } ;

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

var divLinks = [
        document.body.getElementsByClassName("input-info")[0],
        document.body.getElementsByClassName("adjacency-matrix")[0],
        document.body.getElementsByClassName("incidence-matrix")[0],
        document.body.getElementsByClassName("vertices-degree")[0]
    ],
    tableLinks = [
        undefined,
        document.body.getElementsByClassName("adjacency-matrix")[0]
            .getElementsByTagName("table")[0],
        document.body.getElementsByClassName("incidence-matrix")[0]
            .getElementsByTagName("table")[0],
        document.body.getElementsByClassName("vertices-degree")[0]
            .getElementsByTagName("table")[0]
    ] ;

function unsetZIndex() {
    for( var i = 0 ; i < 4 ; ++i )
        divLinks[i].style.zIndex = 0 ;
}

document.body.getElementsByTagName("li")[0].onclick = function() {
    unsetZIndex();
    divLinks[0].style.zIndex = 10;

    updateInputInfo() ;
};

document.body.getElementsByTagName("li")[1].onclick = function() {
    unsetZIndex();
    divLinks[1].style.zIndex = 10;

    updateAdjacencyMatrix() ;
};

document.body.getElementsByTagName("li")[2].onclick = function() {
    unsetZIndex();
    divLinks[2].style.zIndex = 10;

    updateIncidenceMatrix() ;
};

document.body.getElementsByTagName("li")[3].onclick = function() {
    unsetZIndex();
    divLinks[3].style.zIndex = 10;

    updateVerticesDegree() ;
};

function updateInputInfo() {

}

function updateAdjacencyMatrix() {while( tableLinks[1].firstChild )
    tableLinks[1].removeChild( tableLinks[1].firstChild ) ;

    var newTr, newTd, i, j;

    newTr = document.createElement("tr");
    newTd = document.createElement("td");
    newTd.appendChild(document.createTextNode(""));
    newTr.appendChild(newTd);
    for (i = 0; i < canvasGraph.NODES_COUNT; ++i) {
        newTd = document.createElement("td");
        newTd.appendChild(document.createTextNode("" + (i + 1)));
        newTr.appendChild(newTd);
    }
    tableLinks[1].appendChild(newTr);

    for (i = 0; i < canvasGraph.NODES_COUNT; ++i) {
        newTr = document.createElement("tr");
        newTd = document.createElement("td");
        newTd.appendChild(document.createTextNode("" + (i + 1)));
        newTr.appendChild(newTd);
        for (j = 0; j < canvasGraph.NODES_COUNT; ++j) {
            newTd = document.createElement("td");
            newTd.appendChild(document.createTextNode("" + canvasGraph.getAdjacencyMatrix()[i][j]));
            newTr.appendChild(newTd);
        }
        tableLinks[1].appendChild(newTr);
    }
}

function updateIncidenceMatrix() {

}

function updateVerticesDegree() {

}