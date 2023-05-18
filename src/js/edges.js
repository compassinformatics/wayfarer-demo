import '../style.css'
import { Map, View } from 'ol'
import { Snap } from 'ol/interaction.js'
import { getCenter } from 'ol/extent'

import 'ol/ol.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import ContextMenu from 'ol-contextmenu'
import 'ol-contextmenu/ol-contextmenu.css'

import { createEdgeSolver, clearEdges } from './edgesolver.js'
import { createNetworkEditor, clearNetworkEdits } from './networkeditor.js'
import { createNetworkLayer, toggleLabels } from './networklayer.js'

import { createTable } from './table.js'

function init () {
    const geojsonFile = './data/dublin.json'
    const bbox = [-700886.9046790214, 7045529.032412218, -695548.0308066505, 7048223.495319679]
    const background = '#1a2b39'

    const networkLayer = createNetworkLayer(geojsonFile, background)

    createTable()

    const map = new Map({
        target: 'map',
        layers: [networkLayer],
        view: new View({
            center: getCenter(bbox),
            extent: bbox, // constrains extent
            zoom: 16
        })
    })

    const contextmenuItems = [
        {
            text: 'Hide/Show Labels',
            callback: toggleLabels
        },
        '-',
        {
            text: 'Activate Edge Solver',
            callback: function () {
                disableTools()
                edgeSolver.setActive(true)
            }
        },
        {
            text: 'Clear Edges',
            callback: clearEdges
        },
        '-',
        {
            text: 'Activate Network Editor',
            callback: function () {
                disableTools()
                networkEditor.setActive(true)
            }
        },
        {
            text: 'Clear Network Edits',
            callback: clearNetworkEdits
        },
        '-'
    ]

    function disableTools () {
        const tools = [edgeSolver, networkEditor]
        tools.forEach(function (tool) {
            tool.setActive(false)
        })
    }

    const contextmenu = new ContextMenu({
        width: 170,
        defaultItems: true, // defaultItems are (for now) Zoom In/Zoom Out
        items: contextmenuItems
    })
    map.addControl(contextmenu)

    const networkEditor = createNetworkEditor(map, networkLayer)
    const edgeSolver = createEdgeSolver(map, networkLayer)

    map.addInteraction(edgeSolver)
    map.addInteraction(networkEditor)

    disableTools()
    edgeSolver.setActive(true)

    const snap = new Snap({
        source: networkLayer.getSource()
    })

    // The snap interaction must be added after the Modify and Draw interactions
    // in order for its map browser event handlers to be fired first. Its handlers
    // are responsible of doing the snapping.
    map.addInteraction(snap)
}

init()
