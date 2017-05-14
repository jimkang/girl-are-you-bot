/* global process */

var config = require('./config');
var callNextTick = require('call-next-tick');
var Masto = require('mastodon');
var getWordDefinitionPhrase = require('./get-word-definition-phrase');

var dryRun = false;
if (process.argv.length > 2) {
  dryRun = (process.argv[2].toLowerCase() == '--dry');
}

var tryLimit = 10;
var tries = 0;

var mastodon = new Masto({
  access_token: config.mastodon.access_token,
  // timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
  api_url: 'https://botsin.space/api/v1/', // optional, defaults to https://mastodon.social/api/v1/
});

getWordDefinitionPhrase(usePhrase);

function usePhrase(error, phrase) {
  tries += 1;

  if (error) {
    console.log(error);
    if (tries < tryLimit) {
      // Try again.
      callNextTick(getWordDefinitionPhrase, usePhrase);
    }
  }
  else {
    postToot(phrase, wrapUp);
  }
}

function postToot(text, done) {
  if (dryRun) {
    console.log('Would have tooted:', text);
    callNextTick(done);
  }
  else {
    var body = {
      status: text
    };
    mastodon.post('statuses', body, done);
  }
}

function wrapUp(error, data) {
  if (error) {
    console.log(error, error.stack);

    if (data) {
      console.log('data:', data);
    }
  }
  else {
    console.log('Posted to Mastodon without error.');
  }
}
