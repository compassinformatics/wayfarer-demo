import { buffer, boundingExtent } from 'ol/extent.js'
import { primaryAction } from 'ol/events/condition.js'
import { Draw } from 'ol/interaction.js'
import VectorLayer from 'ol/layer/Vector.js'
import VectorSource from 'ol/source/Vector.js'
import { Fill, Stroke, Style, RegularShape } from 'ol/style.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import { callService } from './utils.js'

export function clearIsochrones () {
    // clear all previous features so only the last drawn feature remains
    resultsLayer.getSource().clear()
}

function resultsStyle (feature, resolution) {
    if (feature.getGeometry().getType() === 'Polygon') {
        const color = feature.get('color')

        return new Style({
            fill: new Fill({
                color
            })
        })
    } else {
        return new Style({
            image: new RegularShape({
                fill: new Fill({ color: 'red' }),
                stroke: new Stroke({ color: 'black', width: 2 }),
                points: 5,
                radius: 10,
                radius2: 4,
                angle: 0
            })
        })
    }
};

const resultsLayer = new VectorLayer({
    source: new VectorSource(),
    style: resultsStyle,
    opacity: 0.3
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
    }
}

function getIsochrones (resultsLayer, feature) {
    const coords = feature.getGeometry().getCoordinates()
    const jsonData = JSON.stringify({
        x: coords[0],
        y: coords[1]
    })

    callService('isochrones', jsonData, serviceCallback)
}

export function createIsochroneTool (map, networkLayer) {
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
            getIsochrones(resultsLayer, evt.feature)
        }
    })

    return draw
}
