import { buffer, boundingExtent } from 'ol/extent.js'
import { primaryAction } from 'ol/events/condition.js'
import { Draw } from 'ol/interaction.js'
import VectorLayer from 'ol/layer/Vector.js'
import VectorSource from 'ol/source/Vector.js'
import GeoJSON from 'ol/format/GeoJSON'
import { Stroke, Style } from 'ol/style.js'

export function clearNetworkEdits () {
    networkEditsLayer.getSource().clear()
}

function resultsStyle (feature, resolution) {
    return new Style({
        stroke: new Stroke({
            color: 'DeepPink',
            width: 2
        })
    })
};

const networkEditsLayer = new VectorLayer({
    source: new VectorSource(),
    style: resultsStyle
})

export function getNetworkEdits () {
    const geojsonFormat = new GeoJSON()
    const feats = networkEditsLayer.getSource().getFeatures()
    return geojsonFormat.writeFeatures(feats)
}

function isFeatureSnapped (map, coord, searchLayer) {
    let extent = boundingExtent([coord]) // still a single point
    const bufferDistance = map.getView().getResolution() * 1 // use a 6 pixel tolerance for snapping
    extent = buffer(extent, bufferDistance) // buffer the point

    const feats = searchLayer.getSource().getFeaturesInExtent(extent)

    if (feats.length > 0) {
        return true
    } else {
        return false
    }
}

function drawEnd (evt, networkLayer) {
    const feature = evt.feature

    const geom = feature.getGeometry()
    const networkSource = networkLayer.getSource()

    const networkFeatureAtStart = networkSource.getClosestFeatureToCoordinate(geom.getFirstCoordinate())

    // give the edited features negative ids so we can find them again later
    // note the feature is only added to the layer once this method finishes so we add 1 to the length
    const featureId = (networkEditsLayer.getSource().getFeatures().length + 1) * -1
    feature.setId(featureId)

    if (networkFeatureAtStart) {
        feature.set('startFeatureId', networkFeatureAtStart.getId())
    }

    const networkFeatureAtEnd = networkSource.getClosestFeatureToCoordinate(geom.getLastCoordinate())

    if (networkFeatureAtEnd) {
        feature.set('endFeatureId', networkFeatureAtEnd.getId())
    }
}

export function createNetworkEditor (map, networkLayer) {
    map.addLayer(networkEditsLayer)

    const draw = new Draw({
        source: networkEditsLayer.getSource(),
        type: 'LineString',
        condition: function (evt) {
            if (primaryAction(evt) === true) {
                return isFeatureSnapped(map, evt.coordinate, networkLayer)
            } else {
                return false
            }
        }
    })

    draw.on('drawend', function (evt) {
        drawEnd(evt, networkLayer, networkEditsLayer)
    })

    return draw
}
