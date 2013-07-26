gatekeeper
==========

Node.js powered Twilio door answering service.


Setup
==========
1. Sign up for Twilio.  It's pretty cheap*, if you're like me and you've already got a Google Voice number, but your stupid apartment complex requires a local phone number for the access door system.

(*Actually, free, if you don't mind the "This is a trial account, blah blah blah give us ponies etc." message before your stuff runs.)

2. Grab this project.  Rename config.js.sample to config.js.

3. You should absolutely change the twilio_token, forward_phone, and passcode.  You probably also want to generate the DTMF (http://en.wikipedia.org/wiki/Dual-tone_multi-frequency_signaling) file (currently named 6.wav) used to unlock your apartment door.  See comments in the config file for an online tool to generate the tone.

4. Run ````npm install````.

5. Run ````node server```` to start the server.

6. Point your browser to http://your-domain-here:config.port/test to make sure it's up and running.

7. In Twilio, point "Voice Request URL" to http://your-domain-here:config.port/dingdong

8. Make a test call to your phone number.
