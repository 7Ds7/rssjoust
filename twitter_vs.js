var CONFIG = require('./public/js/config.js');
var argv = require('yargs').argv;
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var url = CONFIG.DB_URL + CONFIG.DB_NAME;


var Twit = require('twit')
var T = new Twit({
  consumer_key:         'XXX',
  consumer_secret:      'XXX',
  access_token:         'XXX',
  access_token_secret:  'XXX'
});

var Bitly = require('bitly');
var bitly = new Bitly('XXX');

var forbidden_words = [
  // prepositions
  "a","an","aboard","about","bout","above","bove","abreast","abroad","absent","across","cross","adjacent","after","against","gainst","along","alongside","amid","amidst","midst","among","amongst","apropos","apud","around","round","as","astride","at","atop","ontop","bar","before","afore","tofore","behind","below","beneath","neath","beside","besides","between","atween","beyond","ayond","but","by","chez","circa","c.","ca.","come","dehors","despite","spite","down","during","except","for","4","from","in","inside","into","less","like","minus","near","nearer","nearest","anear","notwithstanding","of","off","on","onto","opposite","out","outen","outside","over","pace","past","per","post","pre","pro","qua","re","sans","sauf","short","since","sithence","than","through","thru","throughout","thruout","to","toward","towards","under","underneath","unlike","until","til","up","upon","pon","upside","versus","vs.","v.","via","vice","vis-à-vis","with","w/","within","w/i","without","w/o","worth",
  // pronouns
  "i","me","we","us","you","she","her","he","him","it","they","them","that","which","who","whom","whose","whichever","whoever","whomever","this","these","that","those","anybody","anyone","anything","each","either","everybody","everyone","everything","neither","nobody","one","nothing","somebody","someone","something","both","few","many","several","all","any","most","none","some","myself","ourselves","yourself","yourselves","himself","herself","itself","themselves","what","who","which","whom","whose","my","your","his","her","its","our","your","their","mine","yours","hers","ours","yours","theirs",
  //others
  "the", "s", "for", "and", "nor", "but", "or", "yet", "so", "am", "is", "was", "be", "video", "new", "enca", "says", "videos", "photos"
  ];

var today = new Date();
var today_day = today.getDate();
var today_month = today.getMonth();
var today_year = today.getFullYear();
today = new Date( today_year, today_month, today_day);
var end_day = new Date( today_year, today_month, today_day);
end_day = new Date(end_day.setHours(24));

switch ( argv.timespan ) {
  case 'day':
  default:
    break;
  case 'week':
    today.setDate(today.getDate()-7);
    end_day = new Date();
    break;
  case 'month':
    //var days_in_month = new Date(today_year, today_month+1, 0).getDate();
    var days_in_month = new Date(today_year, today_month, 0).getDate();
    today.setDate(today.getDate()-days_in_month); // reset day when twitting
    break;
  case 'year':
    var days_in_year = 365-28+( new Date(2016, 2, 0).getDate() );
    today.setDate(today.getDate()-days_in_year); // reset day when twitting
    break;
}


MongoClient.connect(url, function(err, db) {
  //assert.equal(null, err);
  if (err) {
    console.log(err);
  } else {
    console.log("Connected correctly to server to find processed tests");
    var collection = db.collection('entries');
      collection.find({
        pub_date: {
            $gte: today,
            $lte: end_day
        }
      } ).sort({pub_date: -1}).toArray(function(err, result) {
        //console.log(result);
        var all_titles = '';
        result.forEach(function(r, ind){
          all_titles += ' ' + r.title.toLowerCase().replace(/['"]+/g, '');
        });
        if ( all_titles.length > 0) {
          countWords(all_titles);
        } else {
          console.log('No entries found');
          process.exit();
        }

      });

  }

});

function countWords( str ) {
  //console.log(str);
  var pattern = /\w+/g;
  var string = str;
  var matched_words = string.match( pattern );

  //console.log(matched_words);
  /* The Array.prototype.reduce method assists us in producing a single value from an
     array. In this case, we're going to use it to output an object with results. */
  var counts = matched_words.reduce(function ( stats, word ) {

    if (forbidden_words.indexOf(word) <= -1) {
      if ( stats.hasOwnProperty( word ) ) {
        stats[ word ] = stats[ word ] + 1;
      } else {
        stats[ word ] = 1;
      }
    }
    return stats;
  }, {} );

  var final_obj = orderObjAscending(counts);
  finalObj(final_obj);

};

function finalObj( fobj ) {
  var json_resp = {};
  var stat = '';
  json_resp.word1 = fobj[0]['word'];
  json_resp.word2 = fobj[1]['word'];
  json_resp.date_from = today;
  json_resp.date_to = end_day;
  console.log(fobj);

  switch ( argv.timespan ) {
    case 'day':
    default:
      stat += 'RSS Joust - Top hits for '+today_day+'/'+(today_month+1)+'/'+today_year;
      break;
    case 'week':
      stat += 'RSS Joust - Top hits for the week of '+today.getDate()+'/'+(today.getMonth()+1)+'/'+today.getFullYear()+' to '+end_day.getDate()+'/'+(end_day.getMonth()+1)+'/'+end_day.getFullYear();
      break;
    case 'month':
      today = new Date();
      stat += 'RSS Joust - Top hits for '+today.toLocaleString('en', { month: "long" }) +' '+today.getFullYear();
      break;
    case 'year':
      today = new Date();
      stat += 'RSS Joust - Top hits for '+today.getFullYear();
      break;
  }

  stat += '\n' + json_resp.word1 + ' VS ' + json_resp.word2;

  bitly.shorten('http://binaryunit-rssjoust.rhcloud.com?w1='+encodeURI(' '+json_resp.word1+' ')+'&w2='+encodeURI(' '+json_resp.word2+ ' ')+'&date_from='+encodeURI(today.toISOString())+'&date_to='+encodeURI(end_day.toISOString()))
    .then(function(response) {
      var short_url = response.data.url;
      stat += '\n'+short_url;
      T.post('statuses/update', { status: stat }, function(err, data, response) {
        console.log(data);
        console.log('Twitter sent');
        process.exit();
      });
    }, function(error) {
      throw error;
    });
}

function orderObjAscending( obj ) {
  var obj_arr = [];

  for (var prop in obj) {
    //console.log(prop);
    obj_arr.push({word: prop, count: obj[prop]});
  }

  obj_arr.sort(function (a, b) {
    if (a.count < b.count) {
      return 1;
    }
    if (a.count > b.count) {
      return -1;
    }
    // a must be equal to b
    return 0;
  });
  return obj_arr;
};