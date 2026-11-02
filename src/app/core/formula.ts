type FormulaValue = number | string;
type Token = { type: 'number' | 'column' | 'string' | 'operator' | 'identifier'; value: string };

function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let position = 0;
  const pattern = /\s*(?:(\d+(?:\.\d+)?(?:e[+-]?\d+)?)|(\[[^\]]+\])|([A-Za-z_][A-Za-z0-9_]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|([(),+\-*/]))/iy;
  while (position < formula.length) {
    pattern.lastIndex = position;
    const match = pattern.exec(formula);
    if (!match) throw new Error(`Unexpected formula input near "${formula.slice(position, position + 12)}".`);
    position = pattern.lastIndex;
    if (match[1]) tokens.push({ type: 'number', value: match[1] });
    else if (match[2]) tokens.push({ type: 'column', value: match[2].slice(1, -1) });
    else if (match[3]) tokens.push({ type: 'identifier', value: match[3] });
    else if (match[4]) tokens.push({ type: 'string', value: match[4] });
    else if (match[5]) tokens.push({ type: 'operator', value: match[5] });
  }
  return tokens;
}

class FormulaParser {
  private position = 0;
  private readonly tokens: Token[];

  constructor(
    formula: string,
    private readonly row: Record<string, string>,
  ) {
    this.tokens = tokenize(formula.trim());
  }

  evaluate(): FormulaValue {
    if (!this.tokens.length) throw new Error('Enter a formula to preview its result.');
    const value = this.parseAddition();
    if (this.position !== this.tokens.length) throw new Error(`Unexpected token "${this.tokens[this.position].value}".`);
    return value;
  }

  private parseAddition(): FormulaValue {
    let value = this.parseMultiplication();
    while (this.match('+') || this.match('-')) {
      const operator = this.previous().value;
      const right = this.parseMultiplication();
      const arithmeticAddition = operator === '+' && this.canNumber(value) && this.canNumber(right);
      value = operator === '+' && !arithmeticAddition && (typeof value === 'string' || typeof right === 'string')
        ? String(value) + String(right)
        : this.number(value) + (operator === '+' ? 1 : -1) * this.number(right);
    }
    return value;
  }

  private parseMultiplication(): FormulaValue {
    let value = this.parseUnary();
    while (this.match('*') || this.match('/')) {
      const operator = this.previous().value;
      const right = this.number(this.parseUnary());
      const left = this.number(value);
      if (operator === '/' && right === 0) throw new Error('Division by zero is not allowed.');
      value = operator === '*' ? left * right : left / right;
    }
    return value;
  }

  private parseUnary(): FormulaValue {
    if (this.match('-')) return -this.number(this.parseUnary());
    if (this.match('+')) return this.number(this.parseUnary());
    return this.parsePrimary();
  }

  private parsePrimary(): FormulaValue {
    if (this.match('(')) {
      const value = this.parseAddition();
      if (!this.match(')')) throw new Error('Add a closing parenthesis.');
      return value;
    }
    if (this.position >= this.tokens.length) throw new Error('The formula ends before a value is complete.');
    const token = this.tokens[this.position++];
    if (token.type === 'number') return Number(token.value);
    if (token.type === 'string') {
      return token.value.startsWith('"')
        ? JSON.parse(token.value) as string
        : token.value.slice(1, -1).replace(/\\'/g, "'");
    }
    if (token.type === 'column') {
      if (!(token.value in this.row)) throw new Error(`Column "${token.value}" does not exist.`);
      return this.row[token.value];
    }
    if (token.type === 'identifier') {
      if (this.match('(')) return this.parseFunction(token.value);
      if (!(token.value in this.row)) {
        throw new Error(`Column "${token.value}" does not exist. Use [Column Name] for names with spaces.`);
      }
      return this.row[token.value];
    }
    throw new Error(`Unexpected token "${token.value}".`);
  }

  private parseFunction(name: string): FormulaValue {
    const argumentsList: FormulaValue[] = [];
    if (!this.match(')')) {
      argumentsList.push(this.parseAddition());
      while (this.match(',')) argumentsList.push(this.parseAddition());
      if (!this.match(')')) throw new Error(`Add a closing parenthesis to ${name}().`);
    }
    const numericArguments = (): number[] => argumentsList.map((value) => this.number(value));
    switch (name.toUpperCase()) {
      case 'ABS':
        this.requireArgumentCount(name, argumentsList, 1);
        return Math.abs(this.number(argumentsList[0]));
      case 'ROUND': {
        if (argumentsList.length < 1 || argumentsList.length > 2) throw new Error('ROUND() expects a value and an optional number of decimal places.');
        const places = argumentsList.length === 2 ? this.number(argumentsList[1]) : 0;
        if (!Number.isInteger(places) || Math.abs(places) > 10) throw new Error('ROUND() decimal places must be an integer between -10 and 10.');
        const factor = 10 ** places;
        return Math.round(this.number(argumentsList[0]) * factor) / factor;
      }
      case 'MIN':
        if (!argumentsList.length) throw new Error('MIN() expects at least one value.');
        return Math.min(...numericArguments());
      case 'MAX':
        if (!argumentsList.length) throw new Error('MAX() expects at least one value.');
        return Math.max(...numericArguments());
      case 'LOWER':
        this.requireArgumentCount(name, argumentsList, 1);
        return String(argumentsList[0]).toLowerCase();
      case 'UPPER':
        this.requireArgumentCount(name, argumentsList, 1);
        return String(argumentsList[0]).toUpperCase();
      case 'CONCAT':
        return argumentsList.map(String).join('');
      default:
        throw new Error(`Function "${name}" is not supported.`);
    }
  }

  private requireArgumentCount(name: string, values: FormulaValue[], count: number): void {
    if (values.length !== count) throw new Error(`${name}() expects ${count} value${count === 1 ? '' : 's'}.`);
  }

  private number(value: FormulaValue): number {
    const parsed = Number(typeof value === 'string' ? value.replace(/,/g, '') : value);
    if (!Number.isFinite(parsed)) throw new Error(`"${value}" is not a valid number for this operation.`);
    return parsed;
  }

  private canNumber(value: FormulaValue): boolean {
    const text = String(value).trim();
    return text !== '' && Number.isFinite(Number(text.replace(/,/g, '')));
  }

  private match(value: string): boolean {
    if (this.tokens[this.position]?.value !== value) return false;
    this.position += 1;
    return true;
  }

  private previous(): Token {
    return this.tokens[this.position - 1];
  }
}

export function evaluateFormula(formula: string, row: Record<string, string>): string {
  const value = new FormulaParser(formula, row).evaluate();
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('The formula result is not finite.');
  return String(value);
}
