import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

const url = 'http://108.141.255.176:8000/api/'

function showToast (text) {
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

export function callService (serviceName, jsonData, serviceCallback) {
    // create a new XMLHttpRequest object

    const xhr = new XMLHttpRequest()

    // set the HTTP method and URL of the request
    xhr.open('POST', url + serviceName, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*')

    // set the function to be called when the request completes successfully
    xhr.onload = function () {
        // check if the status code indicates success
        if (xhr.status === 200) {
            // parse the response text as JSON
            const data = JSON.parse(xhr.responseText)
            // do something with the data
            console.log(data)
            serviceCallback(data)
        } else {
            // handle the error
            const msg = 'Request failed. Status code: ' + xhr.status
            showToast(msg)
            console.error(msg)
        }
    }

    // set the function to be called if an error occurs during the request
    xhr.onerror = function () {
        showToast('Request failed. Network error.')
    }

    // send the request
    xhr.send(jsonData)
}
