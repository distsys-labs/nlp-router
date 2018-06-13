const compendium = require('compendium-js')
const log = require('bole')('nlp-engine')

function compile (rule) {
  if (rule.ordered) {
    return compileOrdered(rule)
  }
  return compileUnordered(rule)
}

function filterAttributes (rule, data) {
  let attributes = [ 'type', 'sentiment', 'tense', 'negated' ]
  let failed = attributes.reduce((flag, attribute) => {
    if (rule[ attribute ] && rule[ attribute ] !== data[ attribute ]) {
      flag = true
    }
    return flag
  }, false)
  if (failed) {
    return false
  }
  if (rule.confidence && rule.confidence > data.confidence) {
    return false
  }
  if (rule.degree && rule.degree > data.degree) {
    return false
  }
  return true
}

function compileOrdered (rule) {
  return function (data) {
    if (!filterAttributes(rule, data)) {
      log.debug(`sentence '${data.raw}' failed rule '${rule.name}' on attribute pass`)
      return undefined
    }
    const values = {}
    let ri = 0
    let di = 0
    let missed = false
    while (rule.tokens && ri < rule.tokens.length && !missed) {
      let rt = rule.tokens[ ri ]
      let [next, dt] = findNext(rt, data.tokens, di)
      di = next
      if (dt) {
        values[ rt.name ] = dt.value
        ri ++
      } else {
        missed = true
      }
    }
    if (missed) {
      return undefined
    } else {
      return processRule(rule, data, values)
    }
  }
}

function compileUnordered (rule) {
  return function (data) {
    if (!filterAttributes(rule, data)) {
      log.debug(`sentence '${data.raw}' failed rule '${rule.name}' on attribute pass`)
      return undefined
    }
    const values = {}
    let ri = 0
    let missed = false
    while (rule.tokens && ri < rule.tokens.length && !missed) {
      let rt = rule.tokens[ ri ]
      let [, dt] = findNext(rt, data.tokens)
      if (dt) {
        values[ rt.name ] = dt.value
        ri ++
      } else {
        missed = true
      }
    }
    if (missed) {
      return undefined
    } else {
      return processRule(rule, data, values)
    }
  }
}

function findNext (criteria, tokens, start = 0) {
  let token
  let index = start
  do {
    let t = tokens[ index ]
    index ++
    if (criteria.match && criteria.match.indexOf(t.value) < 0 && criteria.match.indexOf(t.alt) < 0) {
      continue
    }
    if (criteria.pos && criteria.pos.indexOf(t.pos) < 0) {
      continue
    }
    if (criteria.pattern && !criteria.pattern.test(t.value) && !criteria.pattern.test(t.alt)) {
      continue
    }
    if (criteria.negated && !criteria.negated) {
      continue
    }
    token = t
    break
  } while (index < tokens.length)
  return [ index, token ]
}

/*
{
	language: "en"
	time: ms
	length: #
	raw: ""
	stats:
		confidence: %
		p_foreign
		p_upper
		p_cap
		avg_length
	profile
		label: "positive" | "neutral" | "mixed", "negative",
    sentiment: %
    amplitude: #
    politeness:
		dirtiness:
		types - "imperative" | "interrogative"
		main_tense: "past" | "present"
		negated: true | false
	entities: [ {
    raw: 'Dr. Jekyll',
    norm: 'doctor jekyll',
    fromIndex: # (token index)
    toIndex: # (token index)
    type: '' - type of entity (null when unknown but 'ip', 'email', etc)
  } ],
	tokens: [
		{
			raw: ""
			norm: ""
			pos: "" // PoS tag
			profile: {
        sentiment: # score
        emphasis: # multiplier
        negated: true|false
        breakpoint: true|false
      },
			attr: {
        acronym: true|false
        plural: true|false
        abbr: true|false
        verb: true|false
        entity: # - the index in the entity array, -1 if not an entity
      },
			deps: {}
		}
	],
	tags: []
}
*/

function parse (sentence) {
  const [data] = compendium.analyse(sentence)
  return {
    raw: sentence,
    time: data.time,
    confidence: data.stats.confidence,
    type: data.profile.types[ 0 ],
    tense: data.profile.main_tense,
    negated: data.profile.negated,
    sentiment: data.profile.label,
    degree: data.profile.sentiment,
    entities: data.entities,
    tokens: data.tokens.map(token => {
      return {
        pos: token.pos,
        value: token.raw,
        alt: token.norm,
        negated: token.profile.negated,
        plural: token.attr.plural,
        verb: token.attr.verb,
        entity: token.attr.entity,
        deps: token.deps
      }
    })
  }
}

function processRule (rule, data, values) {
  return {
    name: rule.name,
    data: {
      values,
      ordered: true,
      type: data.type,
      sentiment: data.sentiment,
      degree: data.degree,
      confidence: data.confidence,
      tense: data.tense
    }
  }
}

function match (rules, sentence) {
  if (rules && rules.length) {
    const data = parse(sentence)
    let index = 0
    do {
      const rule = rules[ index ]
      const result = rule.fn(data)
      if (result) {
        return result
      }
      index ++
    } while (index < rules.length)
  }
  return undefined
}

module.exports = {
  compile,
  match
}
