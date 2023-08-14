// https://fiduswriter.github.io/simple-datatables/documentation/
// https://fiduswriter.github.io/simple-datatables/documentation/Dynamically-adding-data

import { DataTable } from 'simple-datatables'
import interact from 'interactjs'

// draggable

const position = { x: 0, y: 0 }

interact('.draggable').draggable({
    listeners: {
        start (event) {
            console.log(event.type, event.target)
        },
        move (event) {
            position.x += event.dx
            position.y += event.dy

            event.target.style.transform =
                `translate(${position.x}px, ${position.y}px)`
        }
    }
})

interact('.resizable')
    .resizable({
        edges: { top: true, left: true, bottom: true, right: true },
        listeners: {
            move: function (event) {
                let { x, y } = event.target.dataset

                x = (parseFloat(x) || 0) + event.deltaRect.left
                y = (parseFloat(y) || 0) + event.deltaRect.top

                Object.assign(event.target.style, {
                    width: `${event.rect.width}px`,
                    height: `${event.rect.height}px`,
                    transform: `translate(${x}px, ${y}px)`
                })

                Object.assign(event.target.dataset, { x, y })
            }
        }
    })

let myTable
let selectedRows = []
const headings = ['EdgeId', 'From', 'To', 'With Direction', 'Feature Id']

let selectInteraction

let resultsLayer
export function updateTable (feats, originSelectInteraction, originResultsLayer) {
    // now update the table

    const recs = []
    let rec

    feats.forEach(function (feat) {
        rec = [feat.get('EDGE_ID'), feat.get('FROM_M'), feat.get('TO_M'), feat.get('WITH_DIRECTION'), feat.getId()]
        recs.push(rec)
    })

    let total = 0
    recs.forEach(function (r) {
        total += (r[2] - r[1])
    })

    console.log('Total length: ' + total)

    // clear previous records
    myTable.data.data = []

    myTable.insert({
        headings,
        data: recs
    })

    selectInteraction = originSelectInteraction
    resultsLayer = originResultsLayer

    // myTable.refresh()

    const tableDiv = document.getElementById('mydiv')
    tableDiv.style.visibility = 'visible'
}

export function createTable () {
    const multiSelect = false

    myTable = new DataTable('#myTable', {
        searchable: false,
        sortable: false,
        paging: false,
        // fixedHeight: true,
        rowNavigation: false,
        rowRender: (_row, tr, index) => {
            if (!selectedRows.includes(index)) {
                return
            }
            if (!tr.attributes) {
                tr.attributes = {}
            }
            if (!tr.attributes.class) {
                tr.attributes.class = 'selected'
            } else {
                tr.attributes.class += ' selected'
            }
            return tr
        },
        data: {
            headings
        }
    })

    myTable.on('datatable.selectrow', function (rowIndex, event) {
        // https://fiduswriter.github.io/simple-datatables/documentation/Events#datatableselectrow

        // allow selection of values in the table
        // event.preventDefault();

        if (isNaN(rowIndex)) {
            return
        }

        if (selectedRows.includes(rowIndex)) {
            selectedRows = selectedRows.filter(row => row !== rowIndex)
        } else {
            if (!multiSelect) {
                selectedRows.pop()
            }
            selectedRows.push(rowIndex)
        }
        selectInteraction.getFeatures().clear()
        const featureId = myTable.data.data[rowIndex][4].text
        const feat = resultsLayer.getSource().getFeatureById(featureId)
        selectInteraction.getFeatures().push(feat)
        myTable.update()
    })

    return myTable
}
