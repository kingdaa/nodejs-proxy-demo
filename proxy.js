"use strict";

// Set a the default value for --host to 127.0.0.1
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv
let scheme = 'http://'
let http = require('http')
let request = require('request')
let path = require('path')
let fs = require('fs')

// Get the --port value, if none, default to the echo server port, or 80 if --host exists
let port = argv.port || (argv.host === '127.0.0.1' ? 8000 : 80)
let destinationUrl = argv.url || scheme + argv.host + ':' + port
// console.log(`${destinationUrl}`)
let logPath = argv.log && path.join(__dirname, argv.log)
// console.log(`${logPath}`)
// let getLogStream = ()=> logPath ? fs.createWriteStream(logPath) : process.stdout
let logStream = logPath ? fs.createWriteStream(logPath) : process.stdout

http.createServer((req, res) => {
	// let destinationUrl = req.headers['x-destination-url'] || destinationUrl
	console.log(`Proxying request to: ${destinationUrl + req.url}`)
	if (req != null && req.headers['x-destination-url'] != null){
		let destinationUrl = req.headers['x-destination-url']
	}
    // Proxy code
  	let options = {
	  	headers: req.headers,
	  	url: `http://${destinationUrl}${req.url}`
  	}
  	options.method = req.method
	let downstreamResponse = req.pipe(request(options))
	logStream.write(JSON.stringify(downstreamResponse.headers))
	downstreamResponse.pipe(logStream, {end: false})
	downstreamResponse.pipe(res)
}).listen(8001)