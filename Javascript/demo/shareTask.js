addEventListener('connect' , function(e) {
    var port = e.ports[0];
    port.addEventListener('message' , function(e) {
        console.log(e);
    });
    port.postMessage('ni hao a')
})
