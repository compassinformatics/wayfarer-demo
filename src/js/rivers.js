import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import { Snap } from 'ol/interaction.js'
import { transformExtent } from 'ol/proj'
import StadiaMaps from 'ol/source/StadiaMaps.js'
import { getCenter } from 'ol/extent'

import 'ol/ol.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import ContextMenu from 'ol-contextmenu'
import 'ol-contextmenu/ol-contextmenu.css'

import '../style.css'

import { createNetworkLayer, toggleLabels } from './networklayer.js'
import { createRiverSolver, clearRoutes } from './riversolver.js'
import { createTable } from './table.js'

function init () {
    const extent = [-10.460090, 52.139686, -9.069436, 52.562382]
    const bbox = transformExtent(extent, 'EPSG:4326', 'EPSG:3857')

    const geojsonFile = './data/rivers.json'

    createTable()

    const background = null
    const networkLayer = createNetworkLayer(geojsonFile, background, '#6495ED')

    const map = new Map({
        target: 'map',
        layers: [
            new TileLayer({
                source: new StadiaMaps({
                    layer: 'stamen_toner',
                    retina: true
                }),
                opacity: 0.7
            }),
            networkLayer
        ],
        view: new View({
            center: getCenter(bbox),
            extent: bbox, // constrains extent
            zoom: 10
        })
    })

    const contextmenuItems = [
        {
            text: 'Hide/Show Labels',
            callback: toggleLabels
        },
        {
            text: 'Clear Results',
            callback: clearRoutes
        },
        '-'
    ]

    const contextmenu = new ContextMenu({
        width: 170,
        defaultItems: true, // defaultItems are (for now) Zoom In/Zoom Out
        items: contextmenuItems
    })
    map.addControl(contextmenu)

    const riverSolver = createRiverSolver(map, networkLayer)

    map.addInteraction(riverSolver)
    riverSolver.setActive(true)

    const snap = new Snap({
        source: networkLayer.getSource()
    })

    map.addInteraction(snap)
}

init()
