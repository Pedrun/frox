File
  = @Define _ Garbage

Define
  = "[" @Keys:(_ @DefExp)* _ "]"

DefExp
  = "%"Key 
  / t:"@Target" n:("#"@[1-5])? { return [t, n ?? '1'] }


Key
  = $[A-Z]+

_ "whitespace"
  = [   \n\r]*

___ "forced whitespace"
= [   \n\r]+

Garbage "any characters"
  = $.*