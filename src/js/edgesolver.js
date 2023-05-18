import { buffer, boundingExtent } from 'ol/extent.js'
import { primaryAction } from 'ol/events/condition.js'
import { Draw } from 'ol/interaction.js'
import VectorLayer from 'ol/layer/Vector.js'
import VectorSource from 'ol/source/Vector.js'
import { Fill, Stroke, Style, Circle, Text } from 'ol/style.js'
import { getNetworkEdits } from './networkeditor.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import { callService } from './utils.js'

import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

let orderedEdges = []

export function clearEdges() {
    orderedEdges = []
    // clear all previous features so only the last drawn feature remains
    resultsLayer.getSource().clear()
}

function resultsStyle(feature, resolution) {
    let text

    if (feature.getGeometry().getType() === 'LineString') {
        text = new Text({
            text: feature.get('index').toString(),
            font: '10px Open Sans',
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({ color: '#fff', width: 3 }),
            offsetX: 0,
            offsetY: -12,
            textAlign: 'center',
            textBaseline: 'middle'
        })
    } else {
        text = new Text({
            text: feature.get('index').toString(),
            font: '14px Open Sans',
            // fill: new Fill({ color: '#000' }),
            // stroke: new Stroke({ color: '#000', width: 3 }),
            offsetX: 0,
            offsetY: 0,
            textAlign: 'center',
            textBaseline: 'middle'
        })
    }

    return new Style({

        stroke: new Stroke({
            color: 'yellow',
            width: 2
        }),

        text,

        image: new Circle({
            radius: 12,
            fill: new Fill({
                color: 'yellow'
            })
            // stroke: new Stroke({
            //    color: 'black',
            //    width: 2
            // })
        })
    })
};

const resultsLayer = new VectorLayer({
    source: new VectorSource(),
    style: resultsStyle
})

function clearPreviousFeatures() {
    // remove any previous edges from the results layer

    resultsLayer.getSource().forEachFeature(function (feature) {
        if (feature.getGeometry().getType() === 'LineString') {
            // Remove the feature from the layer
            resultsLayer.getSource().removeFeature(feature)
        }
    })
}

// function highlightRoute (networkLayer, resultsLayer, orderedEdgeIds) {
//    clearPreviousFeatures()

//    orderedEdgeIds.forEach(function (edgeId, index) {
//        // when we handle split edges the keys no longer exist on the original layer
//        // so we can't simply clone these features

//        const feature = networkLayer.getSource().getFeatureById(edgeId)
//        const clonedFeature = feature.clone()
//        clonedFeature.set('index', index)
//        resultsLayer.getSource().addFeature(clonedFeature)
//    })
// }


function isFeatureSnapped(map, coord, searchLayer) {
    let extent = boundingExtent([coord]) // still a single point
    const bufferDistance = map.getView().getResolution() * 3 // use a 6 pixel tolerance for snapping
    extent = buffer(extent, bufferDistance) // buffer the point

    const feats = searchLayer.getSource().getFeaturesInExtent(extent)

    if (feats.length > 0) {
        return true
    } else {
        return false
    }
}


function serviceCallback(data) {
    // load route from the GeoJSON

    clearPreviousFeatures()

    // load route from the GeoJSON
    const geojsonFormat = new GeoJSON()
    const feats = geojsonFormat.readFeatures(data)
    resultsLayer.getSource().addFeatures(feats)

    // highlightRoute(networkLayer, resultsLayer, data)dateTable(feats, selectInteraction, resultsLayer)

}

function drawEnd(evt, networkLayer, resultsLayer) {
    const feature = evt.feature
    const coordinate = feature.getGeometry().getCoordinates()
    const closestNetworkFeature = networkLayer.getSource().getClosestFeatureToCoordinate(coordinate)

    if (closestNetworkFeature) {
        orderedEdges.push(closestNetworkFeature.getId())
        feature.set('index', orderedEdges.length)
    }

    const jsonData = JSON.stringify({
        path: orderedEdges,
        edits: getNetworkEdits()
    })

    if (orderedEdges.length > 1) {
        callService('solve_shortest_path_from_edges', jsonData, serviceCallback)
    }
}

function showToast(text) {
    Toastify({
        text,
        duration: 3000,
        close: true,
        gravity: 'bottom', // `top` or `bottom`
        position: 'right', // `left`, `center` or `right`
        stopOnFocus: true // Prevents dismissing of toast on hover
        // style: {
        //    background: "linear-gradient(to right, #00b09b, #96c93d)",
        // },
    }).showToast()
}

export function createEdgeSolver(map, networkLayer) {
    map.addLayer(resultsLayer)

    const draw = new Draw({
        source: resultsLayer.getSource(),
        type: 'Point',
        condition: function (evt) {
            if (primaryAction(evt) === true) {
                return isFeatureSnapped(map, evt.coordinate, networkLayer)
            } else {
                return false
            }
        }
    })

    draw.on('drawend', function (evt) {
        drawEnd(evt, networkLayer, resultsLayer)
    })

    return draw
}
