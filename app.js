var express = require('express');
var config = require("./config");
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'pug');
app.use(express.static('public'));

app.listen(3000);

app.get('/', function(req,res) {
	turnOffExpiredTimers();
	res.render('index', {config: config});
});

app.post('/', function(req, res) {
	var action = req.body.change.split('-')[0];
	var id = req.body.change.split('-')[1];
	if(action == "off" || action == "on") {
		config[id - 1].status = action
	} else if(action == "timer") {
		config[id - 1].timerEnds = getTimerToEnd(req.body['timer-'+id]);
		config[id - 1].status = action
	}
	writeToFile();
	res.redirect('/');
});

app.get('/api', function(req,res) {
	turnOffExpiredTimers();
	res.json(config.map(function(relay) {
		return {id: relay.id, on: relay.status!="off"};
	}))
});

function getTimerToEnd(timeString) {
	var minuteParts = timeString.split(':');
	var minutes = (parseInt(minuteParts[0]) * 60) + parseInt(minuteParts[1])
	var timerToEnd = new Date();
	timerToEnd.setMinutes(timerToEnd.getMinutes() + minutes);
	return timerToEnd.getTime();
}

function turnOffExpiredTimers() {
	var dirty = false;
	for(relay of config) {
		if(relay.status == "timer" && Date.now() > relay.timerEnds) {
			relay.status = "off";
			dirty = true;
		}
	}
	if(dirty) {
		writeToFile();
	}
}

function writeToFile() {
	fs.writeFile("config.json", JSON.stringify(config));
}