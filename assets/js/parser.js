/* ============================================================
   极小型数学表达式解析器（递归下降，编译为闭包，不用 eval）
   支持：x、数字（含 1.5e3）、+ - * / ^、括号、隐式乘法（2x、2(x+1)、x(x-1)）
   函数：sin cos tan sqrt abs ln log(=lg) exp   常量：pi e
   用法：var f = MathExpr.compile('x^2 - 3*x + 2');  f(3) => 2
         若语法错误则抛 Error（带中文提示）
   ============================================================ */
(function () {
  'use strict';

  var FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp,
    ln: Math.log, log: Math.log10
  };
  var CONSTS = { pi: Math.PI, e: Math.E };
  // 顺序即匹配优先级：长名字在前，避免把 exp 拆成 e*x*p
  var NAMES = ['sin', 'cos', 'tan', 'sqrt', 'abs', 'exp', 'ln', 'log', 'pi', 'x', 'e'];

  function tokenize(src) {
    var tokens = [], i = 0;
    src = String(src).replace(/\s+/g, '');
    while (i < src.length) {
      var ch = src[i];
      if (/[0-9.]/.test(ch)) {
        var m = /^[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(src.slice(i));
        if (!m) throw new Error('数字格式不对：「' + src.slice(i, i + 6) + '…」');
        tokens.push({ t: 'num', v: parseFloat(m[0]) });
        i += m[0].length;
        continue;
      }
      if (/[a-zA-Z]/.test(ch)) {
        var rest = src.slice(i), matched = null;
        for (var k = 0; k < NAMES.length; k++) {
          if (rest.indexOf(NAMES[k]) === 0) { matched = NAMES[k]; break; }
        }
        if (!matched) throw new Error('不认识的符号「' + rest.slice(0, 4) + '…」：可用 x、pi、e 或 sin/cos/tan/sqrt/abs/ln/log');
        if (matched === 'x') tokens.push({ t: 'x' });
        else if (matched === 'pi' || matched === 'e') tokens.push({ t: 'num', v: CONSTS[matched] });
        else tokens.push({ t: 'fn', v: matched });
        i += matched.length;
        continue;
      }
      if ('+-*/^()'.indexOf(ch) >= 0) { tokens.push({ t: ch }); i++; continue; }
      throw new Error('无法识别的字符「' + ch + '」');
    }
    return tokens;
  }

  function compile(src) {
    var tokens = tokenize(src);
    var pos = 0;

    function peek() { return tokens[pos]; }
    function next() { return tokens[pos++]; }
    function expect(t) {
      if (!peek() || peek().t !== t) throw new Error('这里应该是「' + t + '」：检查括号是否配对');
      return next();
    }
    function binop(a, b, op) {
      return function (x) {
        var va = a(x), vb = b(x);
        switch (op) {
          case '+': return va + vb;
          case '-': return va - vb;
          case '*': return va * vb;
          case '/': return va / vb;
          case '^': return Math.pow(va, vb);
        }
      };
    }
    function neg(f) { return function (x) { return -f(x); }; }
    function call(f, g) { return function (x) { return f(g(x)); }; }

    // expr := term (('+'|'-') term)*
    function expr() {
      var left = term();
      while (peek() && (peek().t === '+' || peek().t === '-')) {
        var op = next().t;
        left = binop(left, term(), op);
      }
      return left;
    }

    // term := unary (('*'|'/') unary | 隐式乘法 unary)*
    function term() {
      var left = unary();
      for (;;) {
        var tk = peek();
        if (!tk) break;
        if (tk.t === '*' || tk.t === '/') {
          next();
          left = binop(left, unary(), tk.t);
        } else if (tk.t === 'num' || tk.t === 'x' || tk.t === 'fn' || tk.t === '(') {
          // 隐式乘法：2x、3(x+1)、(x+1)(x-1)
          left = binop(left, unary(), '*');
        } else break;
      }
      return left;
    }

    // unary := '-' unary | power
    function unary() {
      if (peek() && peek().t === '-') { next(); return neg(unary()); }
      if (peek() && peek().t === '+') { next(); return unary(); }
      return power();
    }

    // power := atom ('^' unary)?   （右结合，且 -x^2 = -(x^2)）
    function power() {
      var base = atom();
      if (peek() && peek().t === '^') {
        next();
        return binop(base, unary(), '^');
      }
      return base;
    }

    // atom := num | x | fn '(' expr ')' | '(' expr ')'
    function atom() {
      var tk = peek();
      if (!tk) throw new Error('表达式意外结束：是不是少了内容？');
      if (tk.t === 'num') { next(); var v = tk.v; return function () { return v; }; }
      if (tk.t === 'x') { next(); return function (x) { return x; }; }
      if (tk.t === 'fn') {
        next(); expect('(');
        var arg = expr();
        expect(')');
        return call(FUNCS[tk.v], arg);
      }
      if (tk.t === '(') {
        next();
        var inner = expr();
        expect(')');
        return inner;
      }
      throw new Error('这里出现了一个多余或缺失的部分');
    }

    var f = expr();
    if (pos !== tokens.length) throw new Error('表达式末尾有多余内容');
    return f;
  }

  window.MathExpr = { compile: compile };
})();
