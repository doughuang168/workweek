#!/bin/env node

var express = require('express');
var fs      = require('fs');
var mongodb = require('mongodb');

var App = function() {

  // Scope
  var self = this;

  // Setup
  self.dbServer = new mongodb.Server(process.env.OPENSHIFT_MONGODB_DB_HOST,parseInt(process.env.OPENSHIFT_MONGODB_DB_PORT));
  self.db       = new mongodb.Db(process.env.OPENSHIFT_APP_NAME, self.dbServer, {auto_reconnect: true});
  self.dbUser   = process.env.OPENSHIFT_MONGODB_DB_USERNAME;
  self.dbPass   = process.env.OPENSHIFT_MONGODB_DB_PASSWORD;

  self.ipaddr   = process.env.OPENSHIFT_NODEJS_IP;
  self.port     = parseInt(process.env.OPENSHIFT_NODEJS_PORT) || 8080;
  if (typeof self.ipaddr === "undefined") {
    console.warn('No OPENSHIFT_NODEJS_IP environment variable');
  };


  // Web app logic
  self.routes = {};
  
  //default response with info about app URLs
  var conn    = 'mongodb://' + self.dbUser + ':' + self.dbPass +'@'+process.env.OPENSHIFT_MONGODB_DB_HOST+ ':' +process.env.OPENSHIFT_MONGODB_DB_PORT;
  self.routes['root'] = function(req, res){ 
      res.render('index', { title: 'Express' });
  };
 
  self.routes[process.env.OPENSHIFT_APP_NAME] = function(req, res){
    //in production you would do some sanity checks on these values before parsing and handle the error if they don't parse
    var workweek_date = req.params.ww_date;
    
    //need to validate format here
    var json = { ww_date: workweek_date };
    var errobj = { status: 'error', message : 'invalid date '+workweek_date, workweek: ''}; 

    self.db.collection(process.env.OPENSHIFT_APP_NAME).find(json).toArray(function (err, items) {
          if (err) res.json(errobj);
          else if ( items.length === 0) res.json(errobj); //not found in collection
          else {
            wwobj = { status: 'success', message : '', workweek: items[0].year+'WW'+ items[0].week};
            res.json(wwobj);
          }
      });
  };
  
  // Web app urls
  self.app  = express();

  //////Set your template engine as ejs  ///////
  self.app.use(express.static(__dirname + '/public'));
  self.app.set('views', __dirname + '/views');
  self.app.engine('html', require('ejs').renderFile);
  self.app.set('view engine', 'html');

  //This uses the Connect frameworks body parser to parse the body of the post request
  var bodyParser = require('body-parser');
  var methodOverride = require('method-override');
  
  self.app.use(bodyParser.urlencoded());
  self.app.use(bodyParser.json());
  self.app.use(methodOverride('_method'))

  //define all the url mappings
  self.app.get('/',  self.routes['root']);
  self.app.get('/' + process.env.OPENSHIFT_APP_NAME + '/:ww_date', self.routes[process.env.OPENSHIFT_APP_NAME]);
  
  // Logic to open a database connection. We are going to call this outside of app so it is available to all our functions inside.
  self.connectDb = function(callback){
    self.db.open(function(err, db){
      if(err){ throw err };
      self.db.authenticate(self.dbUser, self.dbPass, {authdb: "admin"}, function(err, res){
        if(err){ throw err };
        callback();
      });
    });
  };
  
  //starting the nodejs server with express
  self.startServer = function(){
    self.app.listen(self.port, self.ipaddr, function(){
      console.log('%s: Node server started on %s:%d ...', Date(Date.now()), self.ipaddr, self.port);
    });
  }

  // Destructors
  self.terminator = function(sig) {
    if (typeof sig === "string") {
      console.log('%s: Received %s - terminating Node server ...', Date(Date.now()), sig);
      process.exit(1);
    };
    console.log('%s: Node server stopped.', Date(Date.now()) );
  };

  process.on('exit', function() { self.terminator(); });

  self.terminatorSetup = function(element, index, array) {
    process.on(element, function() { self.terminator(element); });
  };

  ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'].forEach(self.terminatorSetup);

};

//make a new express app
var app = new App();

//call the connectDb function and pass in the start server command
app.connectDb(app.startServer);
