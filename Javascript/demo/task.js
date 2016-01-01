addEventListener('message',function(e) {
    if(e.data == 1) {
        postMessage('hello everyone');
    }
});
