import '../style.css'
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { Snap } from 'ol/interaction.js'
import { transformExtent } from 'ol/proj'
import { getCenter } from 'ol/extent'

import 'ol/ol.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import ContextMenu from 'ol-contextmenu'
import 'ol-contextmenu/ol-contextmenu.css'

import { createRouteSolver, clearRoutes } from './routesolver.js'
import { createNetworkEditor, clearNetworkEdits } from './networkeditor.js'
import { createNetworkLayer, toggleLabels } from './networklayer.js'

import { createTable } from './table.js'

function init () {
    // const geojsonFile = './data/dublin.json'
    // const bbox = [-700886.9046790214, 7045529.032412218, -695548.0308066505, 7048223.495319679]
    // const background = '#1a2b39'

    const geojsonFile = './data/stbrice.json'
    const extent = [2.3314107610246633, 48.988440397479536, 2.4050093789098863, 49.01280894618151]
    const bbox = transformExtent(extent, 'EPSG:4326', 'EPSG:3857')
    const background = null
    const networkLayer = createNetworkLayer(geojsonFile, background, 'rgba(255, 255, 255, 0.0)')

    createTable()

    const map = new Map({
        target: 'map',
        layers: [
            new TileLayer({
                source: new OSM()
            }),
            networkLayer
        ],
        view: new View({
            center: getCenter(bbox),
            extent: bbox, // constrains extent
            zoom: 16
        })
    })

    function disableTools () {
        const tools = [routeSolver, networkEditor]
        tools.forEach(function (tool) {
            tool.setActive(false)
        })
    }
    const contextmenuItems = [
        {
            text: 'Hide/Show Labels',
            callback: toggleLabels
        },
        '-',
        {
            text: 'Activate Route Solver',
            callback: function () {
                disableTools()
                routeSolver.setActive(true)
            }
        },
        {
            text: 'Clear Routes',
            callback: clearRoutes
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

    const contextmenu = new ContextMenu({
        width: 170,
        defaultItems: true, // defaultItems are (for now) Zoom In/Zoom Out
        items: contextmenuItems
    })
    map.addControl(contextmenu)

    const networkEditor = createNetworkEditor(map, networkLayer)
    const routeSolver = createRouteSolver(map, networkLayer)

    map.addInteraction(routeSolver)
    map.addInteraction(networkEditor)

    disableTools()
    routeSolver.setActive(true)

    const snap = new Snap({
        source: networkLayer.getSource()
    })

    // The snap interaction must be added after the Modify and Draw interactions
    // in order for its map browser event handlers to be fired first. Its handlers
    // are responsible of doing the snapping.
    map.addInteraction(snap)
}

init()
