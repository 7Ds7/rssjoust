RSS Joust
===========
Sentiment and Volume analysis of major news channels around the world

# Very basic setup
- Prior to run you need [node.js](https://nodejs.org/) and [mongodb](https://www.mongodb.com/)  installed
- This project is set up to run on a https://www.openshift.com/ or on a local environment
- Check public/js/config.js
 - CONFIG.RSS_CHANNELS array contains the direct links for the rss feeds to be parsed
 - CONFIG.CATCH_STRINGS array contains the words that are randomly choosen on page load
- ```$ npm install```
- ```$ bower install```
- ```$ node create_channels.js``` to create the channels in the mongo database according to the RSS feed
- ```$ node parse_entries.js``` to gather all the titles of the respective feeds (if you run in a openshift server then the cronjob is already setup to run hourly)
- ```$ node server.js```