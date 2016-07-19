var matches = [];
var matchCanvas = document.getElementById('matchCanvas');
var matchCounter = 0;
var nodes = [];

(function () {
    window.addEventListener('resize', function() {
        resizeCanvas();
    })
})();

// Generate nodes
function generate() {
    reset();
    document.getElementById('data').className = '';
    resizeCanvas()

    var prob = document.getElementById('connectionProb').value || 0.4;
    if (0.4 === prob) {
        document.getElementById('connectionProb').value = 0.4;
    }
    var count = document.getElementById('nodeCount').value || 7;
    if (7 === count) {
        document.getElementById('nodeCount').value = 7;
    }

    generatNodes(prob, count);
    tableNodes(nodes);    
    generateMatches(nodes);
}

// Reset nodes and matches
function reset() {
    document.getElementById('nodesTable').innerHTML = '';
    document.getElementById('matchTable').innerHTML = '';
    document.getElementById('up').disabled = true;
    document.getElementById('down').disabled = true;
    nodes = [];
    matches = [];
    eliminated = [];
    possibleMatches = [];
    matchCounter = 0;
}

// Resize Canvas
function resizeCanvas() {
    matchCanvas.style.width = '100%';
    matchCanvas.style.height = matchCanvas.offsetWidth + 'px';

    if (matchCanvas.getContext) {
        var context = matchCanvas.getContext('2d');
        context.canvas.width = matchCanvas.offsetWidth;
        context.canvas.height = matchCanvas.offsetWidth;
    }
}

// Generate nodes
function generatNodes(prob, count) {
    for (var i = 1; i <= count; i++) {
        var connections = [];        
        for (var j = 1; j <= count; j++) {
            if ((j != i) && (Math.random() < prob)) {
                connections.push(j); 
            }
        }
        var node = {
            id: i,
            connections: connections,
            x: 0,
            y: 0
        }
        nodes[i] = node;
    }
}

// Table nodes
function tableNodes(nodes) {
    var table = document.getElementById('nodesTable');
    for (var i in nodes) {
        var tr = document.createElement('tr');

        var id = document.createElement('td');
        var id_content = document.createTextNode(nodes[i].id);
        id.appendChild(id_content);

        var connections = document.createElement('td');
        var connections_content = document.createTextNode(nodes[i].connections);
        connections.appendChild(connections_content);

        tr.appendChild(id);
        tr.appendChild(connections);
        table.appendChild(tr);
    }
}

// Generate matches
function generateMatches(nodes) {
    var possibleMatches = [];
    var eliminated = [];
    var cycle = 0;

    // Create initial possibleMatches objects and eliminated array
    for (var i in nodes) {
        if (0 < nodes[i].connections.length) {
            possibleMatches.push({
                nodes: [],
                currentNode: nodes[i].id,
                startNode: nodes[i].id,
            });
        } else {
            eliminated.push(nodes[i].id);
        }
    }

    // Get matches
    getMatches(possibleMatches, eliminated, cycle);

    // Draw table and canvas
    if (0 < matches.length) {
        tableMatch(matches, matchCounter);
        canvasMatch(nodes, matches, [], matchCounter);
        document.getElementById('down').disabled = false;
    }
}

// Get matches
function getMatches(possibleMatches, eliminated, cycle) {
    let poMatches = [];
    let pMatches = [];

    // Check if new match still possible (more than 2 nodes)
    if (eliminated.length < nodes.length - 2) {

        // Loop through current possible matches
        for (var i in possibleMatches) {

            // Make sure possibleMatches is defined
            if (possibleMatches[i] && 0 < nodes[possibleMatches[i].currentNode].connections.length) {
                
                // Loop through connection of each possible match
                for (var j in nodes[possibleMatches[i].currentNode].connections) {

                    // Check if connection is not eliminated
                    if (!eliminated.includes(nodes[possibleMatches[i].currentNode].connections[j])) {
                        var newNodes = possibleMatches[i].nodes.concat(nodes[possibleMatches[i].currentNode].connections[j])
                        var newCurrentNode = nodes[possibleMatches[i].currentNode].connections[j];
                        // Push extended possible match to poMatch array
                        poMatches.push({
                            nodes: newNodes,
                            currentNode: newCurrentNode,
                            startNode: possibleMatches[i].startNode,
                        })
                    }
                }                
            }
        }

        // Iterate through poMatches
        pMatches = poMatches.map(function(pm) {

            // Check for matches
            if (pm.nodes.includes(pm.startNode)) {

                // Check if any of the nodes is eliminated
                var elim = false;
                for (var m in pm.nodes) {
                    if (eliminated.includes(pm.nodes[m])) elim = true;
                }

                // If not, add to matches and all involved nodes to eliminated
                if (!elim) {
                    pm.id = matches.length + 1;
                    pm.nodes.unshift(pm.nodes.pop());
                    matches.push(pm);
                    Array.prototype.push.apply(eliminated, pm.nodes);
                }
            } else if (pm) {

                // Assign possible match to pMatches
                return Object.assign({}, pm, pm.nodes.concat());
            }
        })
    }

    // Call getMatches recursively for nodes.length times
    if (nodes.length > ++cycle) {
        getMatches(pMatches, eliminated, cycle);
    }
}

// Table matches
function tableMatch(matches, matchCounter) {
    var table = document.getElementById('matchTable');
    for (var i in matches) {
        var tr = document.createElement('tr');
        tr.id = matches[i].id;

        var id = document.createElement('td');
        var id_content = document.createTextNode(matches[i].id);
        id.appendChild(id_content);

        var nodeList = document.createElement('td');
        var nodeList_content = document.createTextNode(matches[i].nodes.toString());
        nodeList.appendChild(nodeList_content);

        var distance = document.createElement('td');
        var distance_content = document.createTextNode(matches[i].nodes.length);
        distance.appendChild(distance_content);

        tr.appendChild(id);
        tr.appendChild(nodeList);
        tr.appendChild(distance);
        table.appendChild(tr);
    }
}

// Draw matchCanvas
function canvasMatch(nodes, matches, eliminated, matchCounter) {
    if (matchCanvas.getContext) {
        var context = matchCanvas.getContext('2d');
        var axis = (matchCanvas.offsetWidth - 2);
        var halfAxis = (axis / 2);
        var count = nodes.length;
        var fieldRadius = halfAxis * (1 - (1 / count));
        var elementRadius = halfAxis * (1 / count) - 2;
        var fontSize = elementRadius / 2;
        var textPos = fontSize / 1.7;
        var textPos10 = fontSize / 0.9;

        context.clearRect(0,0,axis,axis);

        // Get node centers
        for (var i in nodes) {
            radians = 2 / (count - 1) * i * Math.PI;
            nodes[i].x = fieldRadius * Math.cos(radians) + halfAxis + 1;
            nodes[i].y = fieldRadius * Math.sin(radians) + halfAxis + 1;
        }

        // Draw connections
        for (var i in nodes) {
            if (!eliminated.includes(nodes[i].id)) {
                for (var j in nodes[i].connections) {
                    if (!eliminated.includes(nodes[i].connections[j])) {
                        context.beginPath();
                        context.moveTo(nodes[i].x, nodes[i].y);
                        context.lineTo(nodes[nodes[i].connections[j]].x, nodes[nodes[i].connections[j]].y);
                        var gradiant = context.createLinearGradient(nodes[i].x, nodes[i].y, nodes[nodes[i].connections[j]].x, nodes[nodes[i].connections[j]].y);
                        gradiant.addColorStop(0, 'black');   
                        gradiant.addColorStop(1, 'transparent');
                        context.strokeStyle = gradiant;
                        context.lineWidth = 5;
                        context.stroke();
                    }
                }                
            }
        }

        // Draw nodes
        for (var i in nodes) {
            if (!eliminated.includes(nodes[i].id)) {
                context.beginPath();
                context.arc(nodes[i].x, nodes[i].y, elementRadius, 0, Math.PI * 2, true);
                context.fillStyle = '#337ab7';
                context.lineWidth = 1;
                context.strokeStyle = '#2e6da4';
                context.fill();
                context.stroke();

                context.fillStyle = '#FFF';
                context.font = elementRadius + 'px Helvetica';
                if (10 > nodes[i].id) {
                    context.fillText(nodes[i].id, nodes[i].x - textPos, nodes[i].y + textPos);
                } else {
                    context.fillText(nodes[i].id, nodes[i].x - textPos10, nodes[i].y + textPos);
                }
            }
        }

        // Draw match nodes
        if (matches[matchCounter - 1]) {
            for (var i in matches[matchCounter - 1].nodes) {
                if (!eliminated.includes(nodes[matches[matchCounter - 1].nodes[i]].id)) {
                    context.beginPath();
                    context.arc(nodes[matches[matchCounter - 1].nodes[i]].x, nodes[matches[matchCounter - 1].nodes[i]].y, elementRadius, 0, Math.PI * 2, true);
                    context.fillStyle = '#f0ad4e';
                    context.lineWidth = 1;
                    context.strokeStyle = '#eea236';
                    context.fill();
                    context.stroke();

                    context.fillStyle = '#FFF';
                    context.font = elementRadius + 'px Helvetica';
                    if (10 > nodes[matches[matchCounter - 1].nodes[i]].id) {
                        context.fillText(nodes[matches[matchCounter - 1].nodes[i]].id, nodes[matches[matchCounter - 1].nodes[i]].x - textPos, nodes[matches[matchCounter - 1].nodes[i]].y + textPos);
                    } else {
                        context.fillText(nodes[matches[matchCounter - 1].nodes[i]].id, nodes[matches[matchCounter - 1].nodes[i]].x - textPos10, nodes[matches[matchCounter - 1].nodes[i]].y + textPos);
                    }
                }
            }            
        }

        // Draw eliminated nodes
        for (var i in nodes) {
            if (eliminated.includes(nodes[i].id)) {
                context.beginPath();
                context.arc(nodes[i].x, nodes[i].y, elementRadius, 0, Math.PI * 2, true);
                context.fillStyle = '#D3D3D3';
                context.lineWidth = 1;
                context.strokeStyle = '#b3b3b3';
                context.fill();
                context.stroke();

                context.fillStyle = '#FFF';
                context.font = elementRadius + 'px Helvetica';
                if (10 > nodes[i].id) {
                    context.fillText(nodes[i].id, nodes[i].x - textPos, nodes[i].y + textPos);
                } else {
                    context.fillText(nodes[i].id, nodes[i].x - textPos10, nodes[i].y + textPos);
                }
            }
        }
    }    
}

function upMatch() {
    matchCounter--;
    var eliminated = getEliminated(matchCounter);

    if (matchCounter < 1) {
        document.getElementById('up').disabled = true;
        document.getElementById(matchCounter + 1).className = '';
    } else if (matchCounter == 1) {
        if (document.getElementById(matchCounter + 1)) {
            document.getElementById(matchCounter + 1).className = '';
        }
        document.getElementById(matchCounter).className = 'warning';        
    } else if (matchCounter > 1) {
        if (document.getElementById(matchCounter + 1)) {
            document.getElementById(matchCounter + 1).className = '';
        }
        document.getElementById(matchCounter).className = 'warning';        
    }

    document.getElementById('down').disabled = false;
    canvasMatch(nodes, matches, eliminated, matchCounter);        
}

function downMatch() {
    matchCounter++;
    var eliminated = getEliminated(matchCounter);

    if (matchCounter == matches.length + 1) {
        document.getElementById('down').disabled = true;
        document.getElementById(matchCounter - 1).className = '';
    } else if (matchCounter == 1) {
        document.getElementById(matchCounter).className = 'warning';        
    } else if (matchCounter > 1) {
        document.getElementById(matchCounter - 1).className = '';
        document.getElementById(matchCounter).className = 'warning';        
    }

    document.getElementById('up').disabled = false;
    canvasMatch(nodes, matches, eliminated, matchCounter);        
}

function getEliminated(c) {
    var eliminated = [];
    if (1 < c) {
        for (var i = 0; i < c - 1; i++) {
            Array.prototype.push.apply(eliminated, matches[i].nodes);
        }        
    }

    return eliminated;
}
