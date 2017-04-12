process.on('message', (data) => {
    console.log('message from parent: ' + data)
})

process.send('world')