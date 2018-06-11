const parser = require('./parser')
const evaluator = require('./evaluator')

function addRule (state, name, rule, value) {
  let index = 0
  const rules = state.rules
  return parser.analyze(rule, name)
    .then(
      definition => {
        definition.fn = evaluator.compile(definition)
        let i = 0
        while (rules.length && i < rules.length) {
          if (rules[ i ].rank <= definition.rank) {
            break
          } else {
            i ++
          }
        }
        state.rules.splice(i, 0, definition)
        state.values[ name ] = value
      }
    )
}

function changeValue (state, name, value) {
  state.values[ name ] = value
}

function deleteRule (state, name) {
  let index = -1
  const rules = state.rules
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (r.name === name) {
      index = i
      break
    }
  }
  if (index >= 0) {
    const rule = state.rules.splice(index, 1)
    delete state.values[ rule.name ]
    return [ true, state.rules.length ]
  }
  return [ false, state.rules.length ]
}

function evaluate (state, sentence) {
  const match = evaluator.match(state.rules, sentence)
  const value = state.values[ match.name ]
  const data = match.data
  data.name = match.name
  return {
    data,
    value
  }
}

function getRank (state, name) {
  const rule = getRule(state, name)
  return rule ? rule.rank : -1
}

function getRule (state, name) {
  let rule
  const rules = state.rules
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (r.name === name) {
      rule = r
      break
    }
  }
  return rule
}

module.exports = function () {
  const state = {
    rules: [],
    values: {}
  }
  return {
    addRule: addRule.bind(null, state),
    changeValue: changeValue.bind(null, state),
    deleteRule: deleteRule.bind(null, state),
    evaluate: evaluate.bind(null, state),
    getRank: getRank.bind(null, state),
    getRule: getRule.bind(null, state)
  }
}
