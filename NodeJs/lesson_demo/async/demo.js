// const co = require('co')
'use strict'
const fetch = require('node-fetch')


async function test () {
    let result = await fetch('http://airtest.t.ly.com/flight/flightpmsajax.aspx?type=GetAirportInfo&airportcode=PEK')
    let json = await result.json()
    console.log(json)
}

test()