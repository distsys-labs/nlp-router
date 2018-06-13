# nlp-router

A means to associate metadata or calls with patterns of speech so that when text is analyzed, a match is provided (along with a level of confidence) so that the program can determine a course of action in response.

[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Version npm][version-image]][version-url]
[![npm Downloads][downloads-image]][downloads-url]
[![Dependencies][dependencies-image]][dependencies-url]

Designed for use with [`deftly-bot`](https://github.com/deftly/deftly-bot) but generic enough to be used with other approaches. Deftly's declarative resource approach coupled with the initialization process performs the router's initialization which may seem otherwise tedious.

Consider stealing the code (modlo, fount, deftly) to provide your own means of creating a way to associate patterns of speech with methods to be dispatched on matches.

## What problem it attempts to solve

Observations of support and operational tooling that makes use of chat interfaces is that it is very difficult to remember specific command patterns and incantations.

This leads not only to command misses and frequent command list invocations (littering the common channel) but can have unintended outcomes.

By utilizing natural speech processing the focus can be on specific keywords, synonyms and possible patterns for a valid request. This follows the paradigm, "be liberal in what you accept".

Chat interfaces are far more welcoming and powerful when they don't expect people to provide explicit/perfect incantations and punish them for omissions, transpositions, and typos.

## What it is not

A typical "router" pattern that can be plugged into an HTTP or message dispatch stack directly.

## Patterns of Speech

This same table is available in a single document [here](/tree/master/docs/PoS-tags.md)

| Tag | Description | Example |
|:--------:|:-----------:|:-------:|
| `,` | Comma | `,` |
| `:` | Mid-sent punctuation | `:`,`;` |
| `.` | Sent-final punctuation  | `.`, `!`, `?` |
| `"` | quote  | `"` |
| `(` | Left paren  | `(` |
| `)` | Right paren  | `)` |
| `#` | Pound sign  | `#` |
| `CC` | Coordinating conjunction  | `and`, `but`, `or` |
| `CD` | Cardinal number  | `one`, `two`, `1`, `2` |
| `DT` | Determiner  | `the`, `some` |
| `EX` | Existential there | `there` |
| `FW` | Foreign word | `mon dieu` |
| `IN` | Preposition | `of`, `in`, `by` |
| `JJ` | Adjective | `big` |
| `JJR` | Adjective comparitive | `bigger` |
| `JJS` | Adjective superlative | `biggest` |
| `LS` | List item maker | `1`, `One` |
| `MD` | Modal | `can`, `should` |
| `NN` | Noun, singular or mass | `dog` |
| `NNP` | Proper noun, singular | `Edingburgh` |
| `NNPS` | Proper noun, plural | `Smiths` |
| `NNS` | Noun, plural | `dogs` |
| `PDT` | Predeterminer | `all`, `both` |
| `POS` | Possessive ending | `'s` |
| `PP` | Personal pronoun | `I`, `you`, `she` |
| `PRP$` | Possessive pronoun | `my`, `one's` |
| `RB` | Adverb | `quickly`, `not` |
| `RBR` | Adverb, comparative | `faster` |
| `RBS` | Adverb, superlative | `fastest` |
| `RP` | Particle | `up`, `off` |
| `SYM` | Symbol | `%`, `+`, `&` |
| `TO` | 'to' | `to` |
| `UH` | Interjection | `oh`, `oops` |
| `VB` | Verb, base form | `eat` |
| `VBD` | Verb, past tense | `ate` |
| `VBG` | Verb, gerund | `eating` |
| `VBN` | Verb, past part | `eaten` |
| `VBP` | Verb, present | `eat` |
| `VBZ` | Verb, present | `eats` |
| `WDT` | Wh-determiner | `which`, `that` |
| `WP` | Wh pronoun | `who`, `what` |
| `WP$` | Possessive-Wh | `whose` |
| `WRB` | Wh-adverb | `how`, `where` |

## API

The API supports adding, retrieving, changing the value of, and evaluating rule definitions.

### addRule (name, definition, value)

Adds a rule to the router and returns a promise that either resolves to the current rank for the rule or rejects with validation errors.

```js
const rank = router.addRule(
  'checkStatus', 
  {}
  engine.checkStatus
)

// rank is the current order of the rule provided
```

### changeValue (name, value)

Changes the value associated with the rule.

```js
router.changeValue('myRule', engine.someNewMethod)
```

### deleteRule (name)

Returns an array with a boolean indicating whether a matching rule was deleted and an integer indicating the number of rules left in the router.

```js
const [deleted, remaining] = router.deleteRule('myRule')
```

### getRule (name)

Returns the rule definition for the name. `undefined` is returned if the name does not match.

```js
const rule = router.getRule('myRule')
```

### getRank (name)

Returns the current rank for the rule. If the rule name does not match an existing rule, a `-1` is returned.

```js
const rank = router.getRank('myRule')
```

### evaluate (sentence)

Evaluates a sentence for a potential match and, if there is a match, returns data extracted from the sentence as well as the value. If no match is found, `undefined` is returned.

```js
const match = router.evaluate('my voice is my passport verify me')
// match will have the properties `data` and `value`

// it's more likely that you'd want to feed the match into a 
// dispatcher, but YMMV
match.value(match.data.values)
```

### data returned in match

The data returned in the match will contain the properties:

 * `sentiment` - 'positive'|'neutral'|'mixed'|'negative'
 * `confidence` - %
 * `degree` - %
 * `dirtiness` - %
 * `ordered` - true|false
 * `politeness` - %
 * `tense` - 'past'|'present'
 * `tokens` - the full token array extracted during sentence analysis
 * `type` - 'declarative'|'imperative'|'interrogative'
 * `values` - a hash of name/value pairs extracted

Each token has the following properties:

 * `abbreviation` - true|false
 * `acronym` - true|false
 * `alt` - alternate text for the tag's value
 * `entity` - either undefined or a hash with the following details:
    * `alt` - alternate text content
    * `value` - the value of the entity detected
    * `type` - 'unknown'|'email'|'ip'|etc.
 * `plural` - true|false
 * `pos` - part of speech tag,
 * `value` - text content for the tag,
 * `verb` - true|false

[travis-image]: https://travis-ci.org/deftly/nlp-router.svg?branch=master
[travis-url]: https://travis-ci.org/deftly/nlp-router
[coveralls-url]: https://coveralls.io/github/deftly/nlp-router?branch=master
[coveralls-image]: https://coveralls.io/repos/github/deftly/nlp-router/badge.svg?branch=master
[version-image]: https://img.shields.io/npm/v/consequent.svg?style=flat
[version-url]: https://www.npmjs.com/package/consequent
[downloads-image]: https://img.shields.io/npm/dm/consequent.svg?style=flat
[downloads-url]: https://www.npmjs.com/package/consequent
[dependencies-image]: https://img.shields.io/david/deftly/nlp-router.svg?style=flat
[dependencies-url]: https://david-dm.org/deftly/nlp-router
