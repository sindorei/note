var shareWorker = new SharedWorker('shareTask.js');
shareWorker.port.addEventListener('message',function(e) {
    console.log(e.data);
});

shareWorker.port.postMessage('我来哦');
shareWorker.port.start();
