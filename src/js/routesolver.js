import { buffer, boundingExtent } from 'ol/extent.js'
import { primaryAction } from 'ol/events/condition.js'
import { Draw, Select } from 'ol/interaction.js'
import VectorLayer from 'ol/layer/Vector.js'
import VectorSource from 'ol/source/Vector.js'
import { Fill, Stroke, Style, Circle, Text } from 'ol/style.js'
import { getNetworkEdits } from './networkeditor.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import { callService } from './utils.js'
import { updateTable } from './table.js'

let selectInteraction

export function clearRoutes () {
    // clear all previous features so only the last drawn feature remains
    resultsLayer.getSource().clear()
}

function resultsStyle (feature, resolution) {
    let text

    if (feature.getGeometry().getType() === 'LineString') {
        text = new Text({
            // text: feature.get('index').toString(),
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
            color: '#ff1dce',
            width: 2
        }),

        text,

        image: new Circle({
            radius: 12,
            fill: new Fill({
                color: '#ff1dce'
            })
        })
    })
};

const resultsLayer = new VectorLayer({
    source: new VectorSource(),
    style: resultsStyle
})

function clearPreviousFeatures () {
    // remove any previous edges from the results layer

    resultsLayer.getSource().forEachFeature(function (feature) {
        if (feature.getGeometry().getType() === 'LineString') {
            // Remove the feature from the layer
            resultsLayer.getSource().removeFeature(feature)
        }
    })
}

function isFeatureSnapped (map, coord, searchLayer) {
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

function serviceCallback (data) {
    // load route from the GeoJSON

    if (Object.keys(data).length !== 0) {
        clearPreviousFeatures()
        const geojsonFormat = new GeoJSON()
        const feats = geojsonFormat.readFeatures(data)
        resultsLayer.getSource().addFeatures(feats)

        updateTable(feats, selectInteraction, resultsLayer)
    }
}

function drawEnd (evt, networkLayer, resultsLayer) {
    const feature = evt.feature
    const coordinate = feature.getGeometry().getCoordinates()
    const closestNetworkFeature = networkLayer.getSource().getClosestFeatureToCoordinate(coordinate)

    if (closestNetworkFeature) {
        const index = getPointFeatures().length

        const edgeId = closestNetworkFeature.getId()
        feature.set('edgeId', edgeId)
        feature.set('index', index)
        return true
    }

    return false
}

function getPointFeatures () {
    const pointFeatures = []

    resultsLayer.getSource().forEachFeature(

        function (feature) {
            if (feature.getGeometry().getType() === 'Point') {
                pointFeatures.push(feature)
            }
        }
    )

    return pointFeatures
}

function getRoute (resultsLayer) {
    const pointFeatures = getPointFeatures()

    if (pointFeatures.length >= 2) {
        const geojsonFormat = new GeoJSON()

        const jsonData = JSON.stringify({
            points: geojsonFormat.writeFeatures(pointFeatures),
            edits: getNetworkEdits()
        })

        callService('solve_shortest_path_from_points', jsonData, serviceCallback)
    }
}

export function createRouteSolver (map, networkLayer) {
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

    resultsLayer.getSource().on('addfeature', function (evt) {
        if (evt.feature.getGeometry().getType() === 'Point') {
            getRoute(resultsLayer)
        }
    })

    selectInteraction = new Select({
        layers: [resultsLayer],
        style: function (feature, resolution) {
            return new Style({
                stroke: new Stroke({
                    color: '#00ffff',
                    width: 2
                })
            })
        }
    })
    selectInteraction.setActive(false)

    map.addInteraction(selectInteraction)

    draw.on('drawend', function (evt) {
        drawEnd(evt, networkLayer, resultsLayer)
    })

    return draw
}
