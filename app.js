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
	if(action == "off") {
		config[id - 1].status = action
	} else if(action == "on" && config[id - 1].function == "switch") {
		config[id - 1].status = action
	} else if (action == "on" && config[id - 1].function == "timer") {
		config[id - 1].status = action
		config[id - 1].timerEnds = getTimerToEnd(config[id - 1].timer);
	}
	writeToFile();
	res.redirect('/');
});

app.get('/config', function(req, res) {
	res.render('config', {config: config});
});

app.post('/config', function(req, res) {
	for(var index=1; index < 5; index++) {
		config[index-1].title = req.body['title-'+index];
		config[index-1].function = req.body['function-'+index];
		config[index-1].timer = req.body['time-'+index];
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

function getTimerToEnd(minutes) {
	return Date.now() + (minutes * 60000)
}

function turnOffExpiredTimers() {
	var dirty = false;
	for(relay of config) {
		if(relay.status == "on" && relay.function == "timer" && Date.now() > relay.timerEnds) {
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