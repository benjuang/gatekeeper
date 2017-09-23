var express = require('express')
    fileSystem = require('fs'),
    path = require('path'),
    app = express(),
    https = require('https'),
    querystring = require('querystring');

var config = require('./config');
var client = require('twilio')(config.twilio_sid, config.twilio_token);
var twilio = require('twilio');

function validateTwilioRequest(req, res){
  return true;

  //validateRequest returns true if the request originated from Twilio
  if (req && req.body){
    // For some reason, I'm seeing __proto__ in the request on my linode server
    // It throws off the signature calculation, so we don't want it.
    delete req.body["__proto__"];
  }
  if (twilio.validateExpressRequest(req, config.twilio_token)) {
    debug('Validation successful.');
    return true;
  } else {
    debug('Validation failed.');
    res.writeHead(403, { 'Content-Type':'text/plain' });
    res.end('Banana missing.  Please insert donut to continue.');
    return false;
  }
}

// so we parse POSTs?
app.use(express.bodyParser());

// Simple endpoint to check if the server is up and running.
app.get('/test', function(req, res){
  debug('/test - server is up and running!');
  res.send('OK');
});

// Twilio will hit this first.
app.post('/dingdong', function(req, res){
  debug('/dingdong');
  if (!validateTwilioRequest(req, res)) return false;

  var response = new twilio.TwimlResponse();

  /*
  response.dial({
          timeout: 30,
          timeLimit: 180,
        }, config.forward_phone);
  res.send(response.toString());
  return;
  */
  response.pause({ length:5 }).gather({
        action: '/passcode',
        finishOnKey: '#',
        timeout: 10,
        numDigits: config.passcode.length
      }, function() {
          if (typeof(config.message) == "string") {
            this.say({
              voice: 'alice'
            }, config.message);
          } else {
            this.play("/message.wav");
          }
      }).dial({
          timeout: 30,
          timeLimit: 180,
        }, config.forward_phone);

  res.send(response.toString());

  client.sendMessage({
    to: '+12403883850',
    from: '+14152363539',
    body: 'Door activated.'
  }, function(){});
});

// If the length of the passcode has been entered, twilio will visit this.
app.post('/passcode', function(req, res){
  debug('/passcode');
  // if (!validateTwilioRequest(req, res)) return false;

  var response = new twilio.TwimlResponse();

  if (req && req.body && req.body.Digits){
    debug('validating '+req.body.Digits+' == '+config.passcode);
    if (req.body.Digits == config.passcode){
      // response.play("/unlock.wav");

      var postData = querystring.stringify(config.on_success_endpoint.post_data);

      var options = config.on_success_endpoint.options;
      options.headers = {
             'Content-Type': 'application/x-www-form-urlencoded',
             'Content-Length': postData.length
           };

      var req = https.request(options, (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        // The whole response has been received. Print out the result.
        res.on('end', () => {
          console.log(data);
        });
      });

      req.on('error', (e) => {
        console.log("Error: " + err.message);
      });

      req.write(postData);
      req.end();

    } else {
      response.say("Incorrect.  Goodbye.")
    }
  }

  res.send(response.toString());
});

// This retrieves the file to play to unlock a door.
app.get('/unlock.wav', function(req, res){
  debug('/unlock.wav');

  // this was shamelessly stolen from http://stackoverflow.com/questions/10046039/nodejs-send-file-in-response
  // My node.js-foo isn't strong enough to know just what it does yet.
  var filePath = path.join(__dirname, config.unlock_file);
  var stat = fileSystem.statSync(filePath);

  res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': stat.size
    });

  var readStream = fileSystem.createReadStream(filePath);
  readStream.pipe(res);
});

// This returns the message sound file
app.get('/message.wav', function(req, res){
  debug('/message.wav');

  // this was shamelessly stolen from http://stackoverflow.com/questions/10046039/nodejs-send-file-in-response
  // My node.js-foo isn't strong enough to know just what it does yet.
  var filePath = path.join(__dirname, config.message_file);
  var stat = fileSystem.statSync(filePath);

  res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': stat.size
    });

  var readStream = fileSystem.createReadStream(filePath);
  readStream.pipe(res);
});


app.listen(config.port);
debug('Listening on port '+config.port);


function debug(message){
  if (config.debug)
    console.log(message);
}
