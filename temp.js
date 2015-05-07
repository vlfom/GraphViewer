var multipleTables = [
        1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0
    ],
    needTableNumeration = [
        false, true, true, true, false, false, false, false, false, false, false, false
    ],
    columnWidths = [
        [55,40,35,50], [], [], [], [55,55,55], [50,65], [50,70], [], [0, 50,100,100], [50,50], [], [130,50]
    ] ;

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
            return function() { return [] ; } ; //traversal algorithms
        case 9:
            return canvasGraph.getTopologicalSort;
        case 10:
            return function() { return [] ; } ; //shortest path algorithms
        case 11:
            return canvasGraph.getAdditionalInfo;
    }
}

function updateAllInfo() {
    var newOption = document.createElement("option");
    newOption.appendChild(document.createTextNode("Pick start vertex.."));
    $("select[name=\"popup-pick\"]").empty().append(newOption);
    for (j = 0; j < canvasGraph.NODES_COUNT; ++j) {
        newOption = document.createElement("option");
        newOption.appendChild(document.createTextNode("Vertex " + (j + 1)));
        $("select[name=\"popup-pick\"]").append(newOption);
    }
    for (var i = 0; i < divsCount; ++i) {
        document.body.getElementsByTagName("li")[i].onclick = (function () {
            var remI = i;
            return function () {
                var j;
                if (remI == 8) {
                    state = "traversal" ;
                    newOption = document.createElement("option");
                    newOption.appendChild(document.createTextNode("Choose algorithm.."));
                    $("select[name=\"popup-pick\"]").empty().append(newOption);
                    for (j = 0; j < canvasGraph.NODES_COUNT; ++j) {
                        newOption = document.createElement("option");
                        newOption.appendChild(document.createTextNode("Vertex " + (j + 1)));
                        $("select[name=\"popup-pick\"]").append(newOption);
                    }
                    $("label[for=\"first\"]").text("DFS") ;
                    $("label[for=\"second\"]").text("BFS") ;
                    $("#overlay").css("visibility", "visible");
                }
                else if (remI == 10) {
                    state = "shortest" ;
                    $("label[for=\"first\"]").text("Dejkstra") ;
                    $("label[for=\"second\"]").text("Ford-Bellman") ;
                    $("#overlay").css("visibility", "visible");
                }
                else {
                    for (j = 0; j < divsCount; ++j)
                        divLinks[j].style.zIndex = 0;
                    divLinks[remI].style.zIndex = 10;
                    removeDivTables(remI);
                    if (multipleTables[remI])
                        for (j = 0; j < divsFunctionList(remI)().length; ++j)
                            divContentLinks[remI].appendChild(createTable(divsFunctionList(remI)()[j],
                                needTableNumeration[remI], columnWidths[remI]));
                    else
                        divContentLinks[remI].appendChild(createTable(divsFunctionList(remI)(),
                            needTableNumeration[remI], columnWidths[remI]));
                }
            }
        })();
    }
}

function updateAllFunctions() {
    for (var i = 0; i < divsCount; ++i)
        divsFunctionList(i)();
}

var state ;

$(".popup-choose").on("click", function() {
    $("#overlay").css("visibility", "hidden");
    for (j = 0; j < divsCount; ++j)
        divLinks[j].style.zIndex = 0;
    divLinks[8].style.zIndex = 10;
    removeDivTables(8);
    var traversalType,
        startNode = parseInt($("select[name=\"popup-pick\"] option:selected").text()[7]) - 1;

    if (isNaN(startNode))
        $("#traversal-algo-name").text("You did not pick start vertex");
    else if( state == "traversal" ) {
        if ($('input[type=radio][id="first"]:checked').val())
            traversalType = "DFS";
        else if ($('input[type=radio][id="second"]:checked').val())
            traversalType = "BFS";
        $("#traversal-algo-name").text(traversalType + " traverse order");
        divContentLinks[8].appendChild(createTable(
            canvasGraph.getTraversalAlgorithmsInfo(
                traversalType,
                parseInt($("select[name=\"popup-pick\"] option:selected").text()[7]) - 1
            ),
            needTableNumeration[8], columnWidths[8]
        ));
    } else if( state == "shortest" ) {

    }
}) ;

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

$("#settings").on("click", function() {

}) ;
