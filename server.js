var CONFIG = require('./public/js/config.js');
var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;

var url = CONFIG.DB_URL + CONFIG.DB_NAME;

/*
EXPRESS APP SETUP
 */
var app = express();
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

/*
INDEX ROUTE
 */
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

/*
ABOUT ROUTE
 */
app.get('/about', function (req, res) {
  res.sendFile(__dirname + '/about.html');
});

/*
CHANNELS POST ENDPOINT
 */
app.post('/channels', function (req, res) {
  MongoClient.connect(url, function(err, db) {
    //assert.equal(null, err);
    if (!err) {
      console.log('Connected correctly to server to find channels');
      var collection = db.collection('channels');
      collection.find({}).toArray(function(err, result) {
        getEntries(result, res, req.body);
        db.close();
      });
    } else {
      res.json( {success: false } );
    }
  });
});

/*
CREATE EXPRESS SERVER
 */
http.createServer(app).listen(app.get('port'), process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1' , function(){
  console.log('Express server listening on port ' + app.get('port'));
});

/**
 * Gets all entries from a time period that match word1 and word2
 * @param  {object} channels
 * @param  {object} res      response
 * @param  {object} rbody    request body
 */
function getEntries (channels, res, rbody) {
  MongoClient.connect(url, function(err, db) {
    //assert.equal(null, err);
    if (!err) {
      console.log('Connected correctly to server to find entries');
      var collection = db.collection('entries');

      // If search for single day make it search from 00:00 to 00:00
      if ( rbody.date_from == rbody.date_to ) {
        var pub_query = {
              $gte: new Date(rbody.date_from),
              $lte: new Date(new Date(rbody.date_from).setHours(24))
          };
      } else {
        var pub_query = {
              $gte: new Date(rbody.date_from),
              $lte: new Date(rbody.date_to)
          };
      }

      collection.find({
        pub_date: {
            $gte: new Date(rbody.date_from),
            $lte: new Date(new Date(rbody.date_to).setHours(24))
        },
        $where: function() { return (obj.title.toLowerCase().indexOf(rbody.word1.toLowerCase()) != -1 || obj.title.toLowerCase().indexOf.indexOf(rbody.word2.toLowerCase()) != -1 ) }
      } ).sort({pub_date: -1}).toArray(function(err, result) {
        stitchQuery(channels, result, rbody, db, res);

      });

    } else {
      res.json( {success: false } );

      db.close();
    }
  });
};

/**
 * Constructs object from entries to serve back
 * @param  {object} channels channels object from db
 * @param  {object} entries  entries object from db
 * @param  {object} rbody    request  body
 * @param  {object} db       database connection
 * @param  {object} res      response object
 * @return {object}          [description]
 */
function stitchQuery (channels, entries, rbody, db, res) {
  channels.forEach( function(c, i) {
    channels[i]['word1'] = [];
    channels[i]['word2'] = [];
    if ( entries ) {
      // Push word to respective channel
      entries.forEach( function(r, ind){
        if ( r.title.toLowerCase().indexOf(rbody.word1.toLowerCase()) != -1 && r.source == channels[i]._id ) {
          channels[i]['word1'].push(r);
        }
        if ( r.title.toLowerCase().indexOf(rbody.word2.toLowerCase()) != -1 && r.source == channels[i]._id ) {
          channels[i]['word2'].push(r);
        }
      });
    }
  });

  console.log('Close DB Connection');
  res.json( {success: true, results: channels} );
  db.close();
};