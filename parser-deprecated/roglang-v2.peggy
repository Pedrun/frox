{{
  /*
  {
    value: number,
    values: number[],
    pretties: string,
    cost: number,
    dice: number
  }
  */
  function makeInteger(text) {
    const num = parseInt(text);
    return {
      value: num,
      values: [num],
      pretties: text,
      cost: 0,
      dice: 0
    }
  }

  function checkCost(cost) {
    if (cost > 1000)
      throw "cost overload";
    else
      return true;
 }
}}

start
  = .* {
    return checkCost(199999999);
  }