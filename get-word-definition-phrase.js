var config = require('./config');
var async = require('async');
var createWordnok = require('wordnok').createWordnok;
var callNextTick = require('call-next-tick');
var probable = require('probable');
var canonicalizer = require('canonicalizer');

var wordnok = createWordnok({
  apiKey: config.wordnikAPIKey,
  logger: {
    log: function noOp() {}
  }
});

function getWordDefinitionPhrase(done) {
  var baseWord;

  async.waterfall(
    [
      wordnok.getTopic,
      saveBase,
      getDefinition,
      pickDefinition,
      assemblePhrase
    ],
    done
  );

  function saveBase(word, done) {
    baseWord = canonicalizer.getSingularAndPluralForms(word)[0];
    callNextTick(done, null, baseWord);
  }

  function getDefinition(word, done) {
    var opts = {
      word: word,
      partOfSpeech: 'noun'
    };
    wordnok.getDefinitions(opts, done);
  }

  function pickDefinition(definitions, done) {
    var picked;
    if (definitions && Array.isArray(definitions) && definitions.length > 0) {
      if (probable.roll(2) === 0) {
        picked = definitions[0];
      }
      else {
        picked = probable.pickFromArray(definitions);
      }
    }

    if (picked) {
      callNextTick(done, null, picked);
    }
    else {
      callNextTick(done, new Error('Could not find definition.'));
    }
  }

  function assemblePhrase(definition, done) {
    if (definition.charAt(definition.length - 1) === '.') {
      definition = definition.slice(0, -1);
    }

    var endPunctuation = probable.pickFromArray([
      '!',
      '.',
      '. 😉'
    ]);

    var subjectTable = probable.createTableFromSizes([
      [10, 'Girl'],
      [9, 'Boy'],
      [10, 'Enby'],
      [1, 'Apex Gender Unit']
    ]);
  
    var phrase = `${subjectTable.roll()}, are you ${getArticleForWord(baseWord)} ${baseWord}? ` +
      `Because you are ${lowerCaseFirst(definition)}${endPunctuation}`;

    callNextTick(done, null, phrase);
  }
}

function getArticleForWord(word) {
  if (['a', 'e', 'i', 'o', 'u'].indexOf(word.charAt(0).toLowerCase()) === -1) {
    return 'a';
  }
  else {
    return 'an';
  }
}

function lowerCaseFirst(word) {
  return word.charAt(0).toLowerCase() + word.slice(1);
}

module.exports = getWordDefinitionPhrase;
