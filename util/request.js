/**
 * This is the request module for web browser
 * All async function are rewritten in `Promise` style
 */

function getJSON(url, async=true) {
    if (async)
        return getText(url, "application/json").then(json => JSON.parse(json));
    else
        return JSON.parse(getTextSync(url, "application/json", false));
}

function getBinary(url) {
    return new Promise((resolve, reject) => {
        var client = new XMLHttpRequest();
        client.open("GET", url, true);
        client.responseType = "arraybuffer";
        client.onload = oEvent => {
            if (client.readyState !== 4) {
                return;
            }
            if (client.status === 200) {
                resolve(client.response);
            } else {
                reject(new Error(client.statusText));
            }
        };
        client.send();
    });
}


function getText(url, mimeType, async=true) {
    var client = new XMLHttpRequest();
    if (async) {
        return new Promise((resolve, reject) => {
            var client = new XMLHttpRequest();
            if (mimeType != null && client.overrideMimeType) {
                client.overrideMimeType(mimeType);
            }
            client.open("GET", url);
            client.onreadystatechange = () => {
                if (client.readyState !== 4) {
                    return;
                }
                if (client.status === 200) {
                    resolve(client.response);
                } else {
                    reject(new Error(client.statusText));
                }
            };
            client.send();
        });
    } else {
        client.open("GET", url, false);
        if (mimeType != null && client.overrideMimeType) {
            client.overrideMimeType(mimeType);
        }
        client.send();
        if (client.status === 200) {
            return client.responseText;
        } else {
            throw client.statusText;
        }
    }
}

/**
 * export data to file, as download content
 */
function saveAs(filename, data, type) {
    var blob = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
    }
}

/**
 * export text to file, as download content
 */
function exportText(filename, data) {
    saveAs(filename, data, 'text/csv');
}

function exportJSON(filename, data) {
    saveAs(filename, JSON.stringify(data), 'json');
}

/**
 * export text to file, as download content
 */
function exportBinary(filename, data) {
    saveAs(filename, data, 'application/octet-stream');
}

export {
    getJSON, getBinary, getText,
    saveAs, exportText, exportBinary, exportJSON
};
