var CONFIG = require('./public/js/config.js');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var RssParser = require('rss-parser');
var url = CONFIG.DB_URL + CONFIG.DB_NAME;
var docs = [];
var processed = 0;

CONFIG.RSS_CHANNELS.forEach(parseSources);

function parseSources ( element, index, array ) {
  console.log(index);
  console.log('------------------------------------------------------------------------------------------');
  RssParser.parseURL(element, function( err, parsed ) {
    console.log(index);
    var doc = { _id: parsed.feed.title.replace(/\W/g, ''), title: parsed.feed.title, url: parsed.feed.link };
    docs.push(doc);
    processed += 1;
    // sloppy way to sync processed feeds with RSS_CHANNELS array length
    if ( processed == array.length ) {
      insertSources(docs);
    }
  });
};


function insertSources ( docs ){
  MongoClient.connect(url, function( err, db ) {
    assert.equal(null, err);
    console.log('Connected correctly to server');
    insertBatch(db, function() {
      db.close();
    }, docs);
  });
};


var insertBatch = function ( db, callback, docs ) {
  var collection = db.collection('channels');
  collection.insertMany(docs, function( err, result ) {
      assert.equal(null, err);
      console.log(result);
      callback(result);
    });
};