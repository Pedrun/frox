{{
  // Requirements
  const Util = require('../util.js');
  
  // Functions
  function makeInteger(text) {
    var value = parseInt(text, 10);
    return {
      value: value,
      values: [value],
      pretties: text,
      depth: 1,
      dice: 0
    };
  }
  function makeCounter(left, expr, right) {
    let evaluator = () => { throw new Error("Nenhum Evaluator definido."); }
    switch(expr) {
      case "<<":
        evaluator = function(v) { return v <= right.value; }
        break;
      case ">>":
        evaluator = function(v) { return v >= right.value; }
        break;
    }
    let count = 0;
    left.values.forEach(v => { count += evaluator(v) });
    return {
      value: count,
      values: [count],
      pretties: left.pretties + " " + expr + " " + right.pretties,
      depth: Math.max(left.depth, right.depth) + 1,
      dice: left.dice + right.dice
    }
  }
  function roll(size, explodeConfiguration) {
    let allRolls = [],
    explodeSize = (explodeConfiguration && explodeConfiguration.value)
      ? explodeConfiguration.value
      : size;
    
    if (explodeSize < 2) error("O valor de Explodir precisa ser maior que 1.", "CUSTOM");
    if (explodeSize < size/1000) error("A chance de Explodir precisa ser menor que 99.9%", "CUSTOM");
    
    let lastRoll;
    do {
      lastRoll = Util.randomInt(1, size);
      allRolls.push(lastRoll);
    } while (explodeConfiguration && lastRoll >= explodeSize)
    return allRolls;
  }
  function makeFateRoll(left) {
    let count = left ? left.value : 1;
    if (count > 100) error("Número máximo de dados é 100.", "CUSTOM");
    let valuesArr = [];
    for (let i = 0; i < count; i++) {
      valuesArr.push(...roll(3));
    }
    valuesArr = valuesArr.map(v => v-2);
    let accumulator = 0;
    valuesArr.forEach(v => accumulator += v)
    const prettiesSymbols = ['**-**', '0', '**+**'];
    const prettiesArr = valuesArr.map(v => prettiesSymbols[v+1]);
    const pretties = '[' + prettiesArr.join(', ') + '] ' + count + 'dF';
    return {
      value: accumulator,
      values: valuesArr,
      pretties: pretties,
      depth: left ? left.depth+1 : 2,
      dice: count
    };
  }
  function makeBasicRoll(left, right, explodeConfiguration, configuration) {
    const size = right.value;
    const count = left ? left.value : 1;
    const { daro, operator:keepDropOperator } = configuration;
    const sort = configuration.sort || ['kh','kl','dh','dl'].includes(keepDropOperator);
    let keepDropValue = Util.clamp(configuration.value || 0, 0, count);
    if (size < 2) { error("Tamanho mínimo do dado é 2.", "CUSTOM"); }
    if (count > 100) { error("Número máximo de dados é 100.", "CUSTOM"); }
    let valuesArr = [];
    for (let i=0; i<count; i++) {
      valuesArr.push(...roll(size, explodeConfiguration));
    }
    if (daro && valuesArr.length > 1) {
      let allSame = valuesArr.every(v => v == valuesArr[0]);
      while (allSame) {
        const newVals = roll(size, explodeConfiguration);
        allSame = newVals.every(v => v == valuesArr[0]);
        valuesArr.push(...newVals);
      }
    }
    const augmentedValuesArr = valuesArr.map(v => { return {value: v, isKept: false}; });
    const sortedAugmentedValuesArr = Array.from(augmentedValuesArr).sort((a,b) => b.value - a.value);
    let keepRangeStart = 0;
    let keepRangeEndExclusive = sortedAugmentedValuesArr.length;
    let critrange = size;
    switch (keepDropOperator) {
      case "kh":
        keepRangeEndExclusive = keepDropValue;
        break;
      case "kl":
        keepRangeStart = sortedAugmentedValuesArr.length - keepDropValue;
        break;
      case "dh":
        keepRangeStart = keepDropValue;
        break;
      case "dl":
        keepRangeEndExclusive = sortedAugmentedValuesArr.length - keepDropValue
        break;
      case "c":
        critrange = configuration.value;
        keepDropValue = critrange;
        break;
    }
    sortedAugmentedValuesArr.slice(keepRangeStart, keepRangeEndExclusive).forEach(v => v.isKept = true);
    let accumulator = 0;
    augmentedValuesArr.filter(v => v.isKept).forEach(v => accumulator += v.value);
    const formatOrder = sort ? sortedAugmentedValuesArr : augmentedValuesArr;
    const prettiesArr = formatOrder.map(v => dieFormatter(v.value, critrange, v.isKept));
    let pretties = "[" + prettiesArr.join(", ") + "] " + count + "d" + right.pretties;
    if (explodeConfiguration) {
      pretties = pretties + "!";
      if (explodeConfiguration.value) {
        pretties = pretties + explodeConfiguration.value;
      }
    }
    if (keepDropOperator)
      pretties += keepDropOperator + keepDropValue
    valuesArr = formatOrder.filter(v => v.isKept).map(v => v.value);
    return {
      value: accumulator,
      values: valuesArr,
      pretties: pretties,
      depth: left ? Math.max(left.depth, right.depth)+1 : right.depth+1,
      dice: count
    };
  }
  function dieFormatter(value, size, isKept=true) {
    let formatted = value;
    if (value >= size)
      formatted = "**" + formatted + "**"
    else if (value === 1)
      formatted = "**" + formatted + "**"
    if (!isKept)
      formatted = "~~" + formatted + "~~"
    
    return formatted;
  }
}}

/* ----------------------------------------------------------- */

{
  const { player } = options;
}

/* ----------------------------------------------------------- */

start
  = Assignment / RollExpression

Assignment
  = attr:ValidAttribute &{ return player.card.hasAttr(attr) } _ ":=" _ exp:RollExpression {
    player.card.setAttr(attr, Util.clamp(exp.value, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
    exp.pretties = `${attr} := ${exp.pretties}`
    exp.values = [exp.value];
    exp.depth += 2;
    exp.dice++;
    return exp;
  }

RollExpression
  = result:Comparator {
    result.values = [result.value];
    return result;
  }

Label
  = _____ label:Garbage? {
    return label;
  }

Comparator
  = left:Counter _ expr:("<=" / ">=" / "=" / "<" / ">") _ right:Counter {
    let wasSuccess = false;
    switch(expr) {
      case "<":
        wasSuccess = left.value < right.value;
        break;
      case "<=":
        wasSuccess = left.value <= right.value;
        break;
      case ">":
        wasSuccess = left.value > right.value;
        break;
      case ">=":
        wasSuccess = left.value >= right.value;
        break;
      case "=":
        wasSuccess = left.value === right.value;
        break;
    }
    const pretties =
      left.value + " " + expr + " " + right.value +
        " ⟵ " + left.pretties + " " + expr + " " + right.pretties;
    const value = wasSuccess;
    const values = [wasSuccess];
    return {
      value: value,
      values: values,
      pretties: pretties,
      depth: Math.max(left.depth, right.depth) + 1,
      dice: left.dice + right.dice
    };
  }
  / Counter
  / Expression

Counter
  = left:Expression _ expr:("<<" / ">>") _ right:Expression {
    return makeCounter(left, expr, right);
  }
  / Expression

Expression
  = left:Term right:(_ ("++" / "--" / "+" / "-") _ Term)* {
    let result = left, i;
    for (i = 0; i < right.length; i++) {
      let current = right[i][3];
      result.depth = Math.max(result.depth, current.depth + 1);
      result.dice = result.dice + current.dice;
      let symbol = right[i][1];
      switch (symbol) {
        case "+":
          result.value += current.value;
          result.values = [result.value];
          result.pretties = result.pretties + " + " + current.pretties;
          break;
        case "-":
          result.value -= current.value
          result.values = [result.value];
          result.pretties = result.pretties + " - " + current.pretties;
          break;
        case "++":
          result.value += current.value * result.values.length;
          result.values = result.values.map((val) => {
            return val + current.value;
          });
          
          var joined = "[" + result.values.join(", ") + "]";
          result.pretties = joined + " ⟵ " + result.pretties + " ++ " + current.pretties;
          break;
        case "--":
           result.value -= current.value * result.values.length;
          result.values = result.values.map((val) => {
            return val - current.value;
          });
          
          var joined = "[" + result.values.join(", ") + "]";
          result.pretties = joined + " ⟵ " + result.pretties + " -- " + current.pretties;
          break;
      }
    }
    return result;
  }

Term
  = left:Percentage right:(_ ("*" / "/") _ Percentage)* {
    let result = left, i;
    for (i = 0; i < right.length; i++) {
      let current = right[i][3];
      result.depth = Math.max(result.depth, current.depth + 1);
      result.dice = result.dice + current.dice;
      if (right[i][1] === "*") {
        result.value *= current.value;
        result.values = result.values.map((val) => val * current.value);
        result.pretties = result.pretties + " \\* " + current.pretties;
      }
      if (right[i][1] === "/") {
        result.value /= current.value
        result.values = result.values.map((val) => val / current.value);
        result.pretties = result.pretties + " / " + current.pretties;
      }
    }
    return result;
  }
Percentage
  = left:Factor _ "%" {
    left.depth += 1;
    left.value /= 100;
    left.values = [left.value];
    left.pretties += "%"

    return left;
  }
  / Factor

Factor
  = "(" _ expr:Comparator _ ")" {
    expr.depth += 1;
    expr.pretties = "(" + expr.pretties + ")"
    return expr;
  }
  / BasicRoll
  / RogRoll
  / FateRoll
  // BurningWheelRoll
  / Integer

FateRoll
  = left:Integer? 'df' {
    return makeFateRoll(left);
  }

BasicRoll
  = left:Integer? 'd' right:Integer explodeConfiguration:ExplodeConfiguration? configuration:BasicRollConfiguration {
    return makeBasicRoll(left, right, explodeConfiguration, configuration);
  }

RogRoll
  = left:Integer? 'r' right:Integer explodeConfiguration:ExplodeConfiguration? configuration:BasicRollConfiguration {
    right = makeInteger(right.value + 20);
    return makeBasicRoll(left, right, explodeConfiguration, configuration);
  }

ExplodeConfiguration
  = "!" value:Integer? {
    return {
      operator: '!',
      value: value && value.value
    }
  }

BasicRollConfiguration
  = keepDrop:KeepDropConfiguration? daro:DaroConfiguration? sort:'s'?{
    const configuration = keepDrop || { operator:null, value:null }
    configuration.daro = daro ? true : false;
    configuration.sort = sort ? true : false;
    return configuration;
  }

DaroConfiguration
  = "daro"/"aro"/"taro"

KeepDropConfiguration
  = KeepConfiguration / DropConfiguration 
  / KeepHighestConfiguration / KeepLowestConfiguration 
  / DropHighestConfiguration / DropLowestConfiguration 
  / CritrangeConfiguration

/* ----------------------------------------------------------- */

KeepConfiguration
  = operator:"k" value:Integer {
    return {
      operator: "kh",
      value: value.value,
    }
  }

KeepHighestConfiguration
  = operator:"kh" value:Integer {
    return {
      operator: "kh",
      value: value.value,
    }
  }

KeepLowestConfiguration
  = operator:"kl" value:Integer {
    return {
      operator: "kl",
      value: value.value,
    }
  }

DropConfiguration
  = operator:"d" value:Integer {
    return {
      operator: "dl",
      value: value.value,
    }
  }

DropHighestConfiguration
  = operator:"dh" value:Integer {
    return {
      operator: "dh",
      value: value.value,
    }
  }

DropLowestConfiguration
  = operator:"dl" value:Integer {
    return {
      operator: "dl",
      value: value.value,
    }
  }

CritrangeConfiguration
  = operator:"c" value:Integer {
    return {
      operator:"c",
      value: value.value,
    }
  }

/* ----------------------------------------------------------- */

Integer "integer"
  = "-"?[0-9]+ {
    return makeInteger(text());
  }
  / Attribute
  
Attribute
  = attr:ValidAttribute &{ return player.card.hasAttr(attr) } {
    return makeInteger(player.card.getAttr(attr));
  }

ValidAttribute
  = v:$[A-Z_]+

_ "whitespace"
  = [   \n\r]*

_____ "forced whitespace"
= [   \n\r]+

Garbage "any characters"
 = $[^]*