/**
 * This is the request module for web browser
 * All async function are rewritten in `Promise` style
 */

function getJSON(url, async=true) {
    if (async) {
        var promise = new Promise(function(resolve, reject) {
            getText(url, "application/json").then((json) => {
                resolve(JSON.parse(json));
            }).catch((error) => {
                reject(error);
            });
        });
        return promise;
    } else {
        var json = getTextSync(url, "application/json", false);
        return JSON.parse(json);
    }
}

function getBinary(url) {
    var promise = new Promise(function(resolve, reject) {
        var client = new XMLHttpRequest();
        client.open("GET", url, true);
        client.responseType = "arraybuffer";
        client.onload = function (oEvent) {
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
    return promise;
}


function getText(url, mimeType, async=true)
{
    var client = new XMLHttpRequest();
    if (async) {
        var promise = new Promise(function(resolve, reject){
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
        return promise;
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

export { getJSON, getBinary, getText };