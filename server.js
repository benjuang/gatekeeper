var express = require('express')
    fileSystem = require('fs'),
    path = require('path'),
    twilio = require('twilio'),
    config = require('./config'),
    app = express();

function validateTwilioRequest(req, res){
  //validateRequest returns true if the request originated from Twilio
  if (twilio.validateExpressRequest(req, config.twilio_token)) {
    return true;
  } else {
    res.writeHead(403, { 'Content-Type':'text/plain' });
    res.end('Banana missing.  Please insert donut to continue.');
    return false;
  }
}

// so we parse POSTs?
app.use(express.bodyParser());

// Simple endpoint to check if the server is up and running.
app.get('/test', function(req, res){
  res.send('OK');
});

// Twilio will hit this first.
app.post('/dingdong', function(req, res){
  if (!validateTwilioRequest(req, res)) return false;

  var response = new twilio.TwimlResponse();

  response.gather({
        action: '/passcode',
        finishOnKey: '#',
        timeout: 180,
        numDigits: config.passcode.length
      }, function() {
          this.say({
            voice: 'alice'
          }, config.greeting)
      })
    .dial({
          timeout: 30,
          timeLimit: 180,
        }, config.forward_phone);

  res.send(response.toString());
});

// If the length of the passcode has been entered, twilio will visit this.
app.post('/passcode', function(req, res){
  if (!validateTwilioRequest(req, res)) return false;

  var response = new twilio.TwimlResponse();

  if (req && req.body && req.body.Digits){
    if (req.body.Digits == config.passcode){
      response.play("/unlock.wav");
    }
  }

  res.send(response.toString());
});

// This retrieves the file to play to unlock a door.
app.get('/unlock.wav', function(req, res){
  // this was shamelessly stolen from http://stackoverflow.com/questions/10046039/nodejs-send-file-in-response
  // My node.js-foo isn't strong enough to know just what it does yet.
  var filePath = path.join(__dirname, config.unlock_file);
  var stat = fileSystem.statSync(filePath);

  res.writeHead(200, {
        'Content-Type': 'audio/wave',
        'Content-Length': stat.size
    });

  var readStream = fileSystem.createReadStream(filePath);
  readStream.pipe(res);
});

app.listen(config.port);
console.log('Listening on port '+config.port);
