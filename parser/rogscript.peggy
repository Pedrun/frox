{{
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  function clamp(min, max, x) {
    return Math.max(Math.min(x, max), min);
  }

  function makeInteger(text, alt) {
    alt = alt ?? text;
    let value = parseInt(text, 10);
    return {
      value: value,
      values: [ value ],
      boolean: false,
      text: alt,
      dice: 0
    };
  }

  function makeLogic(left, right) {
    let result = left;
    for (let [op, operand] of right) {
      switch (op) {
        case "&&":
          result.left = (result.value && operand.value) ? 1 : 0;
          result.text += " && " + operand.text;
          break;
        case "||":
          result.left = (result.value || operand.value) ? 1 : 0;
          result.text += " || " + operand.text;
          break;
      }
      result.dice += operand.dice;
      result.boolean = true;
    }
    result.values = [result.value];
    return result;
  }

  function makeAddSub(left, right) {
    let result = left;
    let joined;
    for (let [op, operand] of right) {
      switch (op) {
        case "+":
          result.value += operand.value;
          result.values = [result.value];
          result.text = result.text + " + " + operand.text;
          break;
        case "-":
          result.value -= operand.value
          result.values = [result.value];
          result.text = result.text + " - " + operand.text;
          break;
        case "++":
          result.value += operand.value * result.values.length;
          result.values = result.values.map((val) => {
            return val + operand.value;
          });
          
          joined = "[" + result.values.join(", ") + "]";
          result.text = joined + " ⟵ " + result.text + " ++ " + operand.text;
          break;
        case "--":
            result.value -= operand.value * result.values.length;
            result.values = result.values.map((val) => {
            return val - operand.value;
          });
          
          joined = "[" + result.values.join(", ") + "]";
          result.text = joined + " ⟵ " + result.text + " -- " + operand.text;
          break;
      }
      result.dice += operand.dice;
      result.boolean = false;
    }
    return result;
  }

  function makeMultDiv(left, right) {
    let result = left;
    for (let [op, operand] of right) {
      if (op === "*") {
        result.value *= operand.value;
        result.values = result.values.map((val) => val * operand.value);
        result.text = result.text + " \\* " + operand.text;
      }
      else if (op === "/") {
        result.value /= operand.value;
        result.values = result.values.map((val) => val / operand.value);
        result.text = result.text + " / " + operand.text;
      }
      result.dice += operand.dice;
      result.boolean = false;
    }
    return result;
  }

  function makeUnary(op, operand) {
    switch(op) {
      case "!":
        operand.value = (operand.value) ? 0 : 1;
        operand.boolean = true;
        operand.text = "!" + operand.text;
        break;
      case "-":
        operand.value *= -1;
        operand.boolean = false;
        operand.text = "-" + operand.text;
        break;
      case "%":
        operand.value /= 100;
        operand.boolean = false;
        operand.text += "%";
        break;
    }

    operand.values = [operand.value];
    return operand;
  }

  function makeComparator(left, right, op) {
    let wasSuccess = false;
    switch(op) {
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
    wasSuccess = wasSuccess ? 1 : 0;
    const text = left.text + " " + op + " " + right.text;
    const value = wasSuccess;
    const values = [wasSuccess];
    return {
      value: value,
      values: values,
      boolean: true,
      text: text,
      dice: left.dice + right.dice
    };
  }

  function makeCounter(left, right, op) {
    let evaluator = () => { throw new Error("Nenhum Evaluator definido."); }
    switch(op) {
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
      boolean: false,
      text: left.text + " " + op + " " + right.text,
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
      lastRoll = randomInt(1, size);
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
    const textSymbols = ['**-**', '0', '**+**'];
    const textArr = valuesArr.map(v => textSymbols[v+1]);
    const text = '[' + textArr.join(', ') + '] ' + count + 'df';
    
    return {
      value: accumulator,
      values: valuesArr,
      boolean: false,
      text: text,
      dice: count
    };
  }
  function makeBasicRoll(left, right, explodeConfiguration, configuration) {
    const size = right.value;
    const count = left ? left.value : 1;
    const { aro, operator:keepDropOperator } = configuration;
    const sort = configuration.sort || ['k','d','kh','kl','dh','dl'].includes(keepDropOperator);
    let keepDropValue = clamp(configuration.value || 0, 0, count);
    if (size < 2) { error("Tamanho mínimo do dado é 2.", "CUSTOM"); }
    if (count > 100) { error("Número máximo de dados é 100.", "CUSTOM"); }
    let valuesArr = [];
    for (let i=0; i<count; i++) {
      valuesArr.push(...roll(size, explodeConfiguration));
    }
    if (aro && valuesArr.length > 1) {
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
      case "k":
      case "kh":
        keepRangeEndExclusive = keepDropValue;
        break;
      case "kl":
        keepRangeStart = sortedAugmentedValuesArr.length - keepDropValue;
        break;
      case "dh":
        keepRangeStart = keepDropValue;
        break;
      case "d":
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
    const textArr = formatOrder.map(v => dieFormatter(v.value, critrange, v.isKept));
    let text = "[" + textArr.join(", ") + "] " + (left ? left.text : 1) + "d" + right.text;
    if (explodeConfiguration) {
      text = text + "!";
      if (explodeConfiguration.value) {
        text = text + explodeConfiguration.value;
      }
    }
    if (keepDropOperator)
      text += keepDropOperator + keepDropValue
    valuesArr = formatOrder.filter(v => v.isKept).map(v => v.value);
    return {
      value: accumulator,
      values: valuesArr,
      boolean: false,
      text: text,
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
{
  const attributes = new Map(options.attributes);
  const variables = new Map(options.variables);
}
/*
{
  value: number,
  values: number[],
  boolean: boolean,
  text: string,
  dice: number
}
*/

Start
  = exp:Assingment _ label:(";" @$.*)? {
    let output = "";
    if (exp.boolean) {
      output = exp.value ? "**Sucesso!**" : "**Falha!**";
    } else  {
      output = exp.value.toLocaleString("pt-BR");
    }
    label = label?.trim() ?? "";
    if (label.length) {
      label = `**${label}** `;
    }
    output = `${label}\` ${output} \` ⟵ ${exp.text}`;
    return {
      expression: exp,
      text: output,
      dice: exp.dice,
      labeled: !!label,
      attributes: attributes,
      variables: variables
    }
  }

Assingment
  = attr:AttributeLiteral &{ return attributes.has(attr) } _ ":=" _ val:LogicOR {
    attributes.set(attr, clamp(val.value, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
    val.text = attr + " := " + val.text;
    val.dice++;
    return val;
  }
  / varb:VariableLiteral _ ":=" _ val:LogicOR {
    variables.set(varb, clamp(val.value, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
    val.text = varb + " := " + val.text;
    val.dice++;
    return val;
  }
  / LogicOR

LogicOR
  = left:LogicAND right:(_ @"||" _ @LogicAND)* {
    return makeLogic(left, right);
  }

LogicAND
  = left:Comparator right:(_ @"&&" _ @Comparator)* {
    return makeLogic(left, right);
  }

Comparator
  = left:Counter _ op:("<=" / ">=" / "=" / "<" / ">") _ right:Counter  {
    return makeComparator(left, right, op);
  }
  / Counter

Counter
  = left:AddSub _ op:("<<" / ">>") _ right:AddSub {
    return makeCounter(left, right, op);
  }
  / AddSub

AddSub
  = left:MultDiv right:(_ @("++" / "--" / "+" / "-") _ @MultDiv)* {
    return makeAddSub(left, right);
  }

MultDiv
  = left:UnaryLeft right:(_ @("*" / "/") _ @UnaryLeft)* {
    return makeMultDiv(left, right);
  }

UnaryLeft
  = op:("!" / "-") right:UnaryRight {
    return makeUnary(op, right)
  }
  / UnaryRight

UnaryRight
  = left:Group op:"%" {
    return makeUnary(op, left);
  }
  / Group

Group
  = "(" _ expr:LogicOR _ ")" {
    expr.text = "(" + expr.text + ")";
    return expr;
  }
  / BasicRoll
  / FateRoll
  / Number

Number
  = NumberLiteral
  / Attribute
  / Variable

/* --------------------------------------------------- */

FateRoll
  = left:Number? 'df' {
    return makeFateRoll(left);
  }

BasicRoll
  = left:Number? 'd' right:Number explodeConfiguration:ExplodeConfiguration? configuration:BasicRollConfiguration {
    return makeBasicRoll(left, right, explodeConfiguration, configuration);
  }

ExplodeConfiguration
  = "!" value:Number? {
    return {
      value: value?.value
    }
  }

BasicRollConfiguration
  = keepDrop:KeepDropConfiguration? aro:"aro"? sort:'s'? {
    const configuration = keepDrop || {operator: null, value: null};
    configuration.sort = sort ? true: false;
    configuration.allSameAndExplode = aro ? true : false;
    return configuration;
  }

KeepDropConfiguration
  = operator:("kh"/"kl"/"k"/"dh"/"dl"/"d") value:Number {
    return {
      operator: operator,
      value: value.value
    }
  }

/* --------------------------------------------------- */

NumberLiteral
  = [0-9]+ { return makeInteger(text()) }

Variable
  = k:VariableLiteral &{ return variables.has(k) } {
    const variable = variables.get(k);
    let integer = makeInteger(variable);
    integer.text = "[" + variable + "] " + k;
    return integer;
  }
VariableLiteral
  = $("$" AttributeLiteral)

Attribute
  = k:AttributeLiteral &{ return attributes.has(k) } {
    const attribute = attributes.get(k);
    const integer = makeInteger(attribute);
    integer.text = "[" + attribute + "] " + k;
    return integer;
  }
AttributeLiteral
  = $[A-Z_]+


_ "whitespace"
  = [\t\n\r ]*

___ "forced whitespace"
  = [\t\n\r ]+
