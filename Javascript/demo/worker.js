document.getElementById('div1').addEventListener('click',function() {
    alert(1);
});

var worker = new Worker('task.js');
worker.onmessage = function(e) {
    console.log(e.data);
}
worker.postMessage(1);
