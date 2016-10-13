var CONFIG = require('./public/js/config.js');
var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;

var url = CONFIG.DB_URL + CONFIG.DB_NAME;

var app = express();
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});


app.get('/about', function (req, res) {
  res.sendFile(__dirname + '/about.html');
});


app.post('/channels', function (req, res) {
  MongoClient.connect(url, function(err, db) {
    //assert.equal(null, err);
    if (!err) {
      console.log("Connected correctly to server to find channels");
      var collection = db.collection('channels');
      collection.find({}).toArray(function(err, result) {
        parseChannels(result, res, req.body);
        db.close();
      });
    } else {
      res.json( {success: false } );
    }
  });
});


http.createServer(app).listen(app.get('port'), process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1" , function(){
  console.log('Express server listening on port ' + app.get('port'));
});


function parseChannels(channels, res, rbody) {
  console.log(channels);
  MongoClient.connect(url, function(err, db) {
    //assert.equal(null, err);
    if (!err) {
      console.log("Connected correctly to server to find entries");
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

      channels.forEach(function(c, i) {
        collection.find({
          pub_date: {
              $gte: new Date(rbody.date_from),
              $lte: new Date(new Date(rbody.date_to).setHours(24))
          },
          source: c._id,
          $where: function() { return (obj.title.toLowerCase().indexOf(rbody.word1.toLowerCase()) != -1 || obj.title.toLowerCase().indexOf.indexOf(rbody.word2.toLowerCase()) != -1 ) }
        } ).sort({pub_date: -1}).toArray(function(err, result) {
          console.log(' FIND FOR ' + c._id);
          if( !result || result.length <= 1) {
            console.log('NO RESULT FOR ' + c._id);
            //console.log(result);
            var q = {
              pub_date: {
                  $gte: new Date(rbody.date_from),
                  $lte: new Date(new Date(rbody.date_to).setHours(24))
              },
              source: c._id,
              $where: function() { return (obj.title.toLowerCase().indexOf(rbody.word1.toLowerCase()) != -1 || obj.title.toLowerCase().indexOf.indexOf(rbody.word2.toLowerCase()) != -1 ) }
            };
            //console.log(q);
          }
          channels[i]['word1'] = [];
          channels[i]['word2'] = [];
          if ( result ) {
            // Push word to respective channel
            result.forEach( function(r, ind){
              if ( r.title.toLowerCase().indexOf(rbody.word1.toLowerCase()) != -1 ) {
                channels[i]['word1'].push(r);
              }

              if ( r.title.toLowerCase().indexOf(rbody.word2.toLowerCase()) != -1 ) {
                channels[i]['word2'].push(r);
              }
            });
          }

          if ( i == channels.length - 1) {
            // this timeout ensures callstack is finished
            setTimeout(function(){
              console.log('Close DB Connection');
              res.json( {success: true, results: channels} );
              db.close();
            }, 1000);

          }

        });

      });

    } else {
      res.json( {success: false } );
    }
  });
};