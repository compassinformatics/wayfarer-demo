import './style.css'
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { transformExtent } from 'ol/proj'

import ContextMenu from 'ol-contextmenu'
import 'ol-ext/control/bar.css'

const map = new Map({
    target: 'map',
    layers: [
        new TileLayer({
            source: new OSM()
        })
    ],
    view: new View({
        center: [-697841.1416552059, 7046686.336793598],
        // extent: [-700886.9046790214, 7045529.032412218, -695548.0308066505, 7048223.495319679], // constrains extent
        zoom: 5
    })
})

const contextmenuItems = [
    '-'
]

const contextmenu = new ContextMenu({
    width: 170,
    defaultItems: true, // defaultItems are (for now) Zoom In/Zoom Out
    items: contextmenuItems
})
map.addControl(contextmenu)

// Listen for the moveend event
map.on('moveend', function () {
    // Get the current view
    const view = map.getView()

    // Calculate the extent of the view
    const extent = view.calculateExtent(map.getSize())

    console.log(extent)

    const bbox = transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
    console.log(bbox)

    console.log(view.getCenter())
    console.log(view.getZoom())
})
