# rule definition

Routing rules specify the parameters an incoming message must match in order to activate the route.

## Structure

Each rule can be defined using the following data structure. After showing the layout of the structure, the following sections will discuss how the properties are used by the routing engine to determine the most likely match.

> Note: while some values are necessary to make a meaningful rule, none of them are required. Rules with no tags or tokens are treated as a last-resort 'catch-all' rule which will be moved to the end of the rules list.

```js
{
  pattern: '',
  ordered: true|false,
  type: 'declarative'|'imperative'|'interrogative',
  sentiment: 'positive'|'neutral'|'mixed'|'negative',
  degree: %,
  confidence: %,
  tense: 'past'|'present',
  tokens: [
    {
      name: '', // token alias
      pos: ''|[], // part of speech tag(s) to filter by
      match: ''|[], // literal values to limit matches by
      pattern: //,  // regex to limit matches
      multiple: true|false, // allows regex to match multiple words - not allowed with pos
      negated: true|false // only valid if one or more pos tags are included
    }
  ]
}
```

### pattern

A specific DSL in string form which the router can turn into a tag and/or token list.

Plain text will be interpreted as literal tags with a single allowed match.

#### Tag values

Tag values can be fully expressed with the pattern `{name,!POS=[match]/pattern/}`

Examples:

 * `{action,VBP=[find,search]}` - a tag named 'verb' matching 'find' or 'search'
 * `{target,NN=[server,cluster,machine]}` - tag named 'target' with possible matches
 * `{state,!NN=[on,running,healthy]}` - negated tag named 'state'
 * `{address,NN=/.../}` - tag named 'address' with regex for matching valid forms of address
 * `{inquiry,[WDT,WP]}` - tag named 'inquiry' which allows for either part of speech 
 * `{phrase,=/.../+}` - tag named 'phrase' with regex. the `+` allows it to span multiple words. Only valid without parts of speech tags

### ordered

Specifies whether or not the order of the tokens or tags in their arrays should be considered when evaluating the incoming sentence.

### type

Match on the type of sentence - interrogative, imperative or declarative.

### sentiment

Allows for matching based on detected sentiment.

### degree

Match if the degree of the sentiment is equal to or greater than the percentage (expressed in decimal form).

### confidence

Match if the degree of confidence in the sentence's evaluation is equal to or greater than the percentage (expressed in decimal form).

### politeness

Matches if the politeness ranking is equal to or greater than the percentage (in decimal form).

### dirtiness

Matches if the dirtiness ranking is equal to or greater than the percentage (in decimal form).

### tense

Allows for a match based on a past or present tense.

### tags

Tags match parts of the sentence primarily based on the `pos` (part of speech) abbreviation (see [this](/tree/master/docs/PoS-tags.md) for reference). The remaining properties provide additional matching characteristics.

### tags - name

The name to assign the extracted value to when constructing metadata about the sentence that gets returned with the match information.

### tags - pos

The pos abbreviation(s) that trigger a potential match. This can be omitted but is required in order to use the `negated` flag.

### tags - match

The words that are legal matches for the part(s) of speech.

### tags - pattern

A regular expression to limit legal matches for the part(s) of speech. Can also be used without a pos tag to capture a token or multiple tokens (see `multiple`)

### tags - multiple

Allows the regular expression to capture more than one token. Not allowed with `pos`.

### tags - negated

A flag to indicate whether or not the word should still match if negated. Only valid if used along with one or more `pos` tags.
