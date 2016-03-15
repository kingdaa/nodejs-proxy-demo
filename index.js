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


let server = http.createServer((req, res) => {
	console.log(`Request received at: ${req.url}`)
    // res.end('hello world\n')
    for (let header in req.headers) {
    	res.setHeader(header, req.headers[header])
    }
    req.pipe(res, {end: false})
	logStream.write('Request headers: ' + JSON.stringify(req.headers))
    // Log the req headers and content in the **server callback**
	// getLogStream().write('\n\n\n' + JSON.stringify(req.headers))
	req.pipe(logStream, {end: false})
	// req.pipe(logStream, {end: false})
}).listen(8000)


let proxy = http.createServer((req, res) => {
	// let destinationUrl = req.headers['x-destination-url'] || destinationUrl
	// console.log(req.headers['x-destination-url'])
	let url = destinationUrl
	if (req.headers['x-destination-url']) {
	    url = req.headers['x-destination-url']
	    delete req.headers['x-destination-url']
	}
	// console.log(`Proxying request to: ${destinationUrl + req.url}`)
    // Proxy code
  	let options = {
	  	headers: req.headers,
	    url: url + req.url
  	}
  	options.method = req.method
	let downstreamResponse = req.pipe(request(options), {end: false})
	req.pipe(logStream, {end: false})
	// logStream.write(JSON.stringify(downstreamResponse.headers))
	logStream.write(`\nRequest proxied to: ${url + req.url}: \n` + JSON.stringify(req.headers))
	downstreamResponse.pipe(logStream, {end: false})
	downstreamResponse.pipe(res, {end: false})
}).listen(8001)