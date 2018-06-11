const joi = require('joi')
const log = require('bole')('nlp-rule')

// and lo, when they looked upon the source and saw the regular expression they pushed away their keyboards
// and wept, for the regular expression was too horrible a thing to look upon.
// and they raised their issues upon github in the days to follow with one voice and cried out,
// "why have you done this thing and committed foul source?"
// and he who had written it said, "why did you look upon it?"
// "did not your mothers or fathers teach you in your youth that regular expressions were wrought to bring unto us unholy power?"
// "and did you not know in your hearts that the penalty for taking such power into our own hands would be great torment of the soul and mind?"
// and they rejected these words and closed their browser tabs with a great shout and cast his source code into utter darkness
// though some could not escape the truth of these things and were troubled in their hearts ...
const PATTERN_EXTRACTION_REGEX = /([a-zA-Z0-9;:.,!?"]+|[{]([a-zA-Z][a-zA-Z0-9_]+)([ ,]{1,2}(\[([!A-Z$#\(\)\".:, ]+)\]|([!A-Z$]{2,5})|([!#\(\)\".:,]{1,2})))?([ =]{1,3}(\[([^\[\]}]+[ ,]{0,2})+\]|[^\[\]}]+|[\/][^\/]+[\/]))?[}])/g

/*
 ok, so here's the breakdown:

 * `[a-zA-Z0-9;:.,!?"]+` - captures a placeholder word

 * `([a-zA-Z][a-zA-Z0-9_]+)` - captures the token name

the next optional block grabs POS tags:

 * `([ ,]{1,2}(\[([!A-Z$#\(\)\".:, ]+)\]|([!A-Z$]{2,5})|([!#\(\)\".:,]{1,2})))?`
 * `[ ,]{1,2}` - a leading comma, optionally followed by a space
 * `\[([!A-Z$#\(\)\".:, ]+)\]` - multiple, space delimited, pos tags in a [] array
 * `([!A-Z$]{2,5})` - a single alpha pos tag
 * `([!#\(\)\".:,]{1,2})` - a symbolic pos tag

the next optional block grabs value(s) or a regex assignment:

 * `([ =]{1,3}(\[([^\[\]}]+[ ,]{0,2})+\]|[^\[\]}]+))?`
 * `[ =]{1,3}` - a leading equals with optional surrounding spaces
 * `\[([^\[\]}]+[ ,]{0,2})+\]` - multiple, comma delimited (trailing space optional), values in a [] array
 * `[^\[\]}]+` - a single value
 * `[\/][^\/]+[\/]` - a regular expression

 The capture groups for a token are:
  * 2 - name
  * 4 - single POS tags
  * 5 - multiple POS tags (space delimited)
  * 9 - single value or regex
  * 10 - multiple values (comma delimited)

 For a placeholder, the capture group is 1.

*/

const PLACEHOLDER = 1
const NAME_INDEX = 2
const SINGLE_POS_INDEX = 4
const MULTI_POS_INDEX = 5
const SINGLE_VALUE_INDEX = 9
const MULTI_VALUE_INDEX = 10

const VALID_POS_TAGS = [
  ',', ':', '.', '"', '(', ')', '#',
  'CC', 'CD', 'DT', 'EX', 'FW', 'IN', 'JJ', 'JJR', 'JJS', 'LS',
  'MD', 'NN', 'NNP', 'NNPS', 'NNS', 'PDT', 'POS', 'PP', 'PRP$',
  'RB', 'RBR', 'RBS', 'RP', 'SYM', 'TO', 'UH', 'VB', 'VBD', 'VBG',
  'VBN', 'VBP', 'VBZ', 'WDT', 'WP', 'WP', 'WRB'
]

const VALID_SENTIMENTS = [ 'positive', 'neutral', 'mixed', 'negative' ]
const VALID_TENSES = [ 'present', 'past' ]
const VALID_TYPES = [ 'declarative', 'imperative', 'interrogative' ]

const RULE_SCHEMA = joi.object().keys(
  {
    name: joi.string(),
    pattern: joi.string(),
    ordered: joi.boolean(),
    type: joi.string().only(VALID_TYPES),
    sentiment: joi.string().only(VALID_SENTIMENTS),
    tense: joi.string().only(VALID_TENSES),
    degree: joi.number().min(.01).max(1.00),
    confidence: joi.number().min(.01).max(1.00),
    tokens: joi.array().items(
      joi.object().keys({
        name: joi.string().required(),
        pos: joi.array().items(joi.string()),
        match: joi.array().items(joi.string()),
        pattern: joi.any(),
        negated: joi.boolean()
      })
    )
  }
)

function analyze (rule, name) {
  if (rule.pattern) {
    rule.tokens = extract(rule.pattern)
  }
  standardize(rule)
  return validate(rule)
    .then(
      rule => {
        rank(rule)
        rule.name = name
        return rule
      },
      err => {
        log.error(`invalid rule '${name}' detected - ${err.message}`)
        throw err
      }
    )
}

function extract (pattern) {
  let match
  let placeholders = 0
  const tokens = []
  do {
    match = PATTERN_EXTRACTION_REGEX.exec(pattern)
    if (match) {
      if (match[ NAME_INDEX ]) {
        const token = {
          name: match[ NAME_INDEX ]
        }
        if (match[ MULTI_POS_INDEX ]) {
          let tags = match[ MULTI_POS_INDEX ]
            .split(' ')
            .map(tag => {
              if (/^[!]/.test(tag)) {
                token.negated = true
                tag = tag.replace(/^[!]/, '')
              }
              return tag
            })
          token.pos = tags
        } else if (match[ SINGLE_POS_INDEX ]) {
          let tag = match[ SINGLE_POS_INDEX ]
          if (/^[!]/.test(tag)) {
            token.negated = true
            tag = tag.replace(/^[!]/, '')
          }
          token.pos = [ tag ]
        }
        if (match[ MULTI_VALUE_INDEX ]) {
          let values = match[ MULTI_VALUE_INDEX ]
            .split(',')
            .map(value => {
              if (/^[ ]/.test(value)) {
                value = value.replace(/^[ ]/, '')
              }
              return value
            })
          token.match = values
        } else if (match[ SINGLE_VALUE_INDEX ]) {
          let value = match[ SINGLE_VALUE_INDEX ]
          if (/^[ ]/.test(value)) {
            token.match = [ value.replace(/^[ ]/, '') ]
          } else if (/[\/][^\/]+[\/]/.test(value)) {
            value = new RegExp(value.slice(1, -1))
            token.pattern = value
          }
        }
        tokens.push(token)
      } else {
        placeholders ++
        tokens.push({
          name: `placeholder_${placeholders}`,
          match: [ match[ 1 ] ]
        })
      }
    }
  } while (match)
  return tokens
}

function rank (rule) {
  let score = 0
  if (rule.ordered) {
    score += 10
  }
  if (rule.type) {
    score += 10
  }
  if (rule.tense) {
    score += 10
  }
  if (rule.sentiment) {
    score += 5
  }
  if (rule.degree) {
    score += 5
  }
  if (rule.confidence) {
    score += 5
  }
  if (rule.tokens) {
    rule.tokens.forEach(token => {
      if (token.pos && token.pos.length > 0) {
        score += .5
      }
      if (token.match && token.match.length > 0) {
        score += .5
      }
      if (token.pattern) {
        score += .5
      }
    })
  }
  rule.rank = score
  return score
}

function standardize (rule) {
  if (rule.pattern && rule.ordered === undefined) {
    rule.ordered = true
  }
  if (rule.tokens) {
    rule.tokens.forEach(token => {
      if (typeof token.pos === 'string') {
        token.pos = [ token.pos ]
      }
      if (typeof token.match === 'string') {
        token.match = [ token.match ]
      }
    })
  }
  return rule
}

function validate (rule) {
  return RULE_SCHEMA.validate(rule, {abortEarly: false})
}

module.exports = {
  analyze: analyze,
  extract: extract,
  rank: rank,
  standardize: standardize,
  validate: validate
}
