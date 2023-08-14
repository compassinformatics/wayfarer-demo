import { Fill, Stroke, Style, Text } from 'ol/style.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import VectorLayer from 'ol/layer/Vector.js'
import VectorSource from 'ol/source/Vector.js'
import { Point } from 'ol/geom'

let showNetworkLabels = false
let networkLayer

let networkLineColor = 'rgba(255, 255, 255, 0.7)'

function networkStyle (feature, resolution) {
    function getText (feature) {
        if (showNetworkLabels === true) {
            return feature.getId().toString()
        } else {
            return ''
        }
    }

    const styles = [new Style({
        stroke: new Stroke({
            color: networkLineColor, // 'rgba(255, 255, 255, 0.7)',
            width: 2
        }),
        text: new Text({
            // text: feature.get('index').toString(),
            text: getText(feature),
            font: '10px Open Sans',
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({ color: '#fff', width: 3 }),
            offsetX: 0,
            offsetY: -16,
            textAlign: 'center',
            textBaseline: 'middle'
        })
    })]

    // only show labels and line directions below a certain resolution

    if (showNetworkLabels && resolution < 0.2) {
        const geometry = feature.getGeometry()

        const start = geometry.getCoordinateAt(0.4) // geometry.getFirstCoordinate();
        const end = geometry.getCoordinateAt(0.6) // geometry.getLastCoordinate();
        const centerCoordinate = geometry.getCoordinateAt(0.5)

        const dx = end[0] - start[0]
        const dy = end[1] - start[1]
        const rotation = Math.atan2(dy, dx)

        styles.push(
            new Style({
                geometry: new Point(centerCoordinate),
                text: new Text({
                    text: '>',
                    font: '20px Open Sans',
                    rotation: -rotation,
                    rotateWithView: true,
                    stroke: new Stroke({ color: '#fff', width: 3 }),
                    fill: new Fill({ color: '#000' })
                })
            })
        )

        // following is too slow to render

        // geometry.forEachSegment(function (start, end) {

        //    const dx = end[0] - start[0];
        //    const dy = end[1] - start[1];
        //    const rotation = Math.atan2(dy, dx);

        //    styles.push(
        //        new Style({
        //            geometry: new Point(end),
        //            text: new Text({
        //                text: '>',
        //                font: '20px Open Sans',
        //                rotation: -rotation,
        //                rotateWithView: true,
        //                fill: new Fill({ color: '#000' }),
        //                stroke: new Stroke({ color: '#fff', width: 3 }),
        //                fill: new Fill({ color: '#000' }),
        //            })
        //        })
        //    )

        // });
    }

    return styles
};

export function toggleLabels () {
    if (showNetworkLabels === false) {
        showNetworkLabels = true
    } else {
        showNetworkLabels = false
    }
    // trigger a redraw of the layer
    networkLayer.getSource().changed()
}

export function createNetworkLayer (jsn, background = '#1a2b39', lineColor = 'rgba(255, 255, 255, 0.7)') {
    networkLineColor = lineColor

    networkLayer = new VectorLayer({
        background,
        source: new VectorSource({
            url: jsn,
            format: new GeoJSON({
                featureProjection: 'EPSG:3857'
            })
        }),
        style: networkStyle
    })

    return networkLayer
}
