import '../style.css'
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ.js'
import { Snap } from 'ol/interaction.js'
import { transformExtent } from 'ol/proj'

import 'ol/ol.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import ContextMenu from 'ol-contextmenu'
import 'ol-contextmenu/ol-contextmenu.css'
import { createIsochroneTool } from './isochronessolver.js'

import { createNetworkLayer, toggleLabels } from './networklayer.js'

function init () {
    const geojsonFile = './data/stbrice.json'
    const extent = [2.3314107610246633, 48.988440397479536, 2.4050093789098863, 49.01280894618151]
    const bbox = transformExtent(extent, 'EPSG:4326', 'EPSG:3857')
    const background = null// '#1a2b39'  //null
    // const showOSM = true

    const networkLayer = createNetworkLayer(geojsonFile, background)

    const map = new Map({
        target: 'map',
        layers: [
            new TileLayer({
                source: new ol.source.StadiaMaps({
                    layer: 'stamen_toner',
                    retina: true
                })
            }),
            networkLayer
        ],
        view: new View({
            center: [-697841.1416552059, 7046686.336793598],
            extent: bbox, // constrains extent
            zoom: 16
        })
    })

    const contextmenuItems = [
        {
            text: 'Hide/Show Labels',
            callback: toggleLabels
        },
        '-'
    ]

    const contextmenu = new ContextMenu({
        width: 170,
        defaultItems: true, // defaultItems are (for now) Zoom In/Zoom Out
        items: contextmenuItems
    })
    map.addControl(contextmenu)

    const isoChroneTool = createIsochroneTool(map, networkLayer)
    map.addInteraction(isoChroneTool)
    isoChroneTool.setActive(true)

    const snap = new Snap({
        source: networkLayer.getSource()
    })

    // The snap interaction must be added after the Modify and Draw interactions
    // in order for its map browser event handlers to be fired first. Its handlers
    // are responsible of doing the snapping.
    map.addInteraction(snap)
}

init()
