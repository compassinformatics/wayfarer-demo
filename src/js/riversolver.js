import { buffer, boundingExtent } from 'ol/extent.js'
import { primaryAction } from 'ol/events/condition.js'
import { Draw, Select } from 'ol/interaction.js'
import VectorLayer from 'ol/layer/Vector.js'
import VectorSource from 'ol/source/Vector.js'
import { Fill, Stroke, Style, Circle } from 'ol/style.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import { callService } from './utils.js'
import { updateTable } from './table.js'

let selectInteraction

export function clearRoutes () {
    // clear all previous features so only the last drawn feature remains
    resultsLayer.getSource().clear()
}

function resultsStyle (feature, resolution) {
    return new Style({

        stroke: new Stroke({
            color: '#ff1dce',
            width: 2
        }),

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
    // opacity: 0.3
})

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
        resultsLayer.getSource().clear()

        const geojsonFormat = new GeoJSON()
        const feats = geojsonFormat.readFeatures(data)
        resultsLayer.getSource().addFeatures(feats)

        updateTable(feats, selectInteraction, resultsLayer)
    }
}

function getDownstream (networkLayer, resultsLayer, feature) {
    const coords = feature.getGeometry().getCoordinates()
    const coordinate = feature.getGeometry().getCoordinates()
    const closestNetworkFeature = networkLayer.getSource().getClosestFeatureToCoordinate(coordinate)

    if (closestNetworkFeature) {
        const edgeId = closestNetworkFeature.getId()

        const jsonData = JSON.stringify({
            x: coords[0],
            y: coords[1],
            edge_id: edgeId
        })

        callService('solve_downstream', jsonData, serviceCallback)
        // callService('solve_upstream', jsonData, serviceCallback)
    }
}

export function createRiverSolver (map, networkLayer) {
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

    resultsLayer.getSource().on('addfeature', function (evt) {
        if (evt.feature.getGeometry().getType() === 'Point') {
            getDownstream(networkLayer, resultsLayer, evt.feature)
        }
    })

    return draw
}
