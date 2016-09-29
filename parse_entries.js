var CONFIG = require('./public/js/config.js');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var RssParser = require('rss-parser');
var Sentiment = require('sentiment');
var Chalk = require('chalk');

var url = CONFIG.DB_URL + CONFIG.DB_NAME;
var docs = [];
var processed = 0;

CONFIG.RSS_CHANNELS.forEach(parseChannels);

function parseChannels( element, index, array ) {

  RssParser.parseURL(element, function( err, parsed ) {
    //assert.equal(null, err);
    if ( !err ) {
      console.log('\n');
      console.log(Chalk.black.bgWhite(' ||=======|| Parsing Channel ' + parsed.feed.title + ' ||=======|| '));

      parsed.feed.entries.forEach(function(entry) {
        console.log('  === Parsing entry -> ' + entry.title + ' ===')
        var sent = Sentiment(entry.title)
        var ent = { _id: entry.link, title: entry.title, link: entry.link, source: parsed.feed.title.replace(/\W/g, ''), score: sent.score, comparative: parseFloat(sent.comparative.toFixed(3)), pub_date: new Date(entry.pubDate) }
        docs.push(ent);
      });

    } else {
      console.log('\n');
      console.log(Chalk.black.bgRed(' ||=======|| Error parsing channel Channel ' + element + ' ||=======|| '));
      console.log(err);
    }

    processed += 1;
    // sloppy way to sync processed feeds with RSS_CHANNELS array length
    if ( processed == array.length ) {
      processEntries(docs);
    }

  });
};


function processEntries( docs ) {
  console.log(Chalk.black.bgYellow(' ||=======|| Process entries ||=======|| '));
  //console.log(docs);
  MongoClient.connect(url, function( err, db ) {
    assert.equal(null, err);
    console.log('Connected correctly to server');

    insertEntries(db, function() {
      console.log("Finished on " + new Date());
      db.close();
    }, docs);
  });
};


var insertEntries = function( db, callback, docs ) {
  console.log(Chalk.black.bgYellow(' ||=======|| Insert Entries ||=======|| '));
  var collection = db.collection('entries');

  docs.forEach(function(el, ind, arr){
    //console.log(el._id);
    collection.findAndModify({ _id: el._id },
    [],
    { $set: el },
    { upsert: true },

     function( err, result ) {
        console.log(Chalk.black.bgGreen(' ||=======|| UPDATE OR NOT ||=======|| '));
        //console.log(el._id);
        assert.equal(null, err);
        console.log('RESULT');
        console.log(result);
        if (ind == arr.length - 1) {
          callback(result);
        }
      });
  });

};