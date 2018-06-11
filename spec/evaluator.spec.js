require('./setup')

const evaluator = require('../src/evaluator')

describe('Evaluator', function () {
  let rules = []
  before(function() {
    rules.push({ fn:
      evaluator.compile({
        name: 'command',
        type: 'imperative',
        ordered: true,
        tokens: [
          {
            name: 'action',
            pos: ['VB', 'VBP']
          },
          {
            name: 'target',
            pos: ['NN', 'NRP', 'NNS', 'NRPS']
          }
        ]
      })
    })

    rules.push({ fn :
      evaluator.compile({
        name: 'whatever',
        tokens: [
          {
            name: 'action',
            pos: ['VB', 'VBP']
          },
          {
            name: 'target',
            pos: ['NN', 'NRP', 'NNS', 'NRPS']
          }
        ]
      })
    })

    rules.push({ fn:
      evaluator.compile({
        name: 'catch-all',
        tokens: []
      })
    })
  })

  it('should match ordered rule', function() {
    return evaluator.match(rules, 'run the jewels fast')
      .should.eql({
        name: 'command',
        data: {
          confidence: 1,
          degree: 0.0825,
          ordered: true,
          sentiment: 'neutral',
          tense: 'present',
          type: 'imperative',
          values: {
            action: 'run',
            target: 'jewels'
          }
        }
      })
  })

  it('should match unordered rule', function() {
    return evaluator.match(rules, 'the jewels run fast')
      .should.eql({
        name: 'whatever',
        data: {
          confidence: 0.75,
          degree: 0.0825,
          ordered: true,
          sentiment: 'neutral',
          tense: 'present',
          type: undefined,
          values: {
            action: 'run',
            target: 'jewels'
          }
        }
      })
  })

  it('should fall back to catch-all', function() {
    return evaluator.match(rules, 'what what what')
      .should.eql({
        name: 'catch-all',
        data: {
          confidence: 1,
          degree: 0,
          ordered: true,
          sentiment: 'neutral',
          tense: 'present',
          type: 'interrogative',
          values: {}
        }
      })
  })
})
