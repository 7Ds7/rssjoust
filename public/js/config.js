var CONFIG = {};

CONFIG.DB_URL = (typeof(process) !== 'undefined' && process.env.MONGODB_URL) ? process.env.MONGODB_URL : 'mongodb://localhost:27017/';
CONFIG.DB_NAME = 'rssjoust';

// Direct link to RSS channels to be scrapped
CONFIG.RSS_CHANNELS = [
  'http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
  'http://feeds.feedburner.com/foxnews/latest',
  'http://www.voanews.com/api/',
  'http://www.msnbc.com/feeds/latest',
  'http://feeds.skynews.com/feeds/rss/home.xml',
  'http://www.cbc.ca/cmlink/rss-topstories',
  'http://feeds.feedburner.com/euronews/en/home/',
  'http://feeds.bbci.co.uk/news/rss.xml?edition=int',
  'http://www.france24.com/en/top-stories/rss',
  'http://www.aljazeera.com/xml/rss/all.xml',
  'https://www.geo.tv/rss/1/2',
  'http://www.enca.com/rss/top-stories',
  'http://www.nileinternational.net/en/?feed=rss2',
  'http://www.presstv.ir/RSS/MRSS/1',
  'https://www.rt.com/rss/',
];

// Strings to be chosen by default on first load
CONFIG.CATCH_STRINGS = [
  ['Palestine', 'Israel'],
  ['Russia', 'Korea'],
  ['Trump', 'Clinton'],
  ['Kim', 'Putin'],
  [' EU ', ' US '],
  ['Turkey', 'ISIL'],
  ['Facebook', 'Twitter'],
  ['Snowden', ' NSA '],
  ['Cameron', ' Brexit ']
];

// To work in node and browser
if ( typeof(module) !== 'undefined' ) {
  module.exports = CONFIG;
}
