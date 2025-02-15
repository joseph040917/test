import { 
  Token, 
  TokenType, 
  Position, 
  BaseToken, 
  HeadingToken,
  ListToken,
  TableToken
} from './types';

export class Tokenizer {
  private input: string;
  private pos: number;
  private line: number;
  private column: number;

  constructor(input: string) {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.input.length) {
      let token: Token | null = null;

      // 尝试匹配各种类型的标记
      if (this.current() === '#') {
        token = this.handleHeading();
      } else if (this.isListStart(this.current())) {
        token = this.handleList();
      } else if (this.current() === '*' || this.current() === '~') {
        token = this.handleFormatting();
      } else if (this.current() === '|') {
        token = this.handleTable();
      } else if (this.current() === '[') {
        token = this.tokenizeLink();
      } else if (this.current() === '!') {
        token = this.tokenizeImage();
      } else if (this.current() === '>') {
        token = this.tokenizeBlockquote();
      } else {
        token = this.tokenizeText();
      }

      if (token) {
        tokens.push(token);
      } else {
        this.advance();
      }
    }
    return tokens;
  }

  private createToken<T extends Token>(
    type: TokenType,
    content: string,
    extras: Omit<T, keyof BaseToken> = {} as any
  ): T {
    const position = this.getPosition();
    const indent = this.getIndentation();

    return {
      type,
      content: content || '',
      position,
      indent,
      ...extras
    } as T;
  }

  private getPosition(): Position {
    return {
      line: this.line,
      column: this.column,
      offset: this.pos
    };
  }

  private getIndentation(): number {
    const lineStart = this.input.lastIndexOf('\n', this.pos - 1) + 1;
    const currentLine = this.input.slice(lineStart, this.pos);
    const match = currentLine.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  private isListStart(char: string): boolean {
    return char === '•' || char === '*' || char === '-' || this.isDigit(char);
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private peek(offset: number): string {
    if (this.pos + offset >= this.input.length) return '\0';
    return this.input[this.pos + offset];
  }

  private current(): string {
    if (this.pos >= this.input.length) return '\0';
    return this.input[this.pos];
  }

  private advance(): void {
    if (this.current() === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.pos++;
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.current())) {
      this.advance();
    }
  }

  private handleHeading(): Token | null {
    if (this.input[this.pos] === '#') {
      let level = 0;
      while (this.input[this.pos] === '#' && level < 6) {
        level++;
        this.pos++;
      }

      // Skip whitespace after #
      this.skipWhitespace();

      const start = this.pos;
      while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
        this.pos++;
      }
      const content = this.input.slice(start, this.pos).trim();

      // Special handling for #title
      if (level === 1 && content.toLowerCase() === 'title') {
        return this.createToken('heading', 'title', { level: 1 });
      }

      return this.createToken<HeadingToken>('heading', content, { level });
    }
    return null;
  }

  private handleList(): Token | null {
    // 处理无序列表
    if (this.current() === '•' || this.current() === '*' || this.current() === '-') {
      this.advance();
      this.skipWhitespace();
      const start = this.pos;
      while (this.pos < this.input.length && this.current() !== '\n') {
        this.advance();
      }
      const content = this.input.slice(start, this.pos).trim();
      return this.createToken<ListToken>('list', content, { ordered: false });
    }

    // 处理有序列表
    if (this.isDigit(this.current())) {
      const startPos = this.pos;
      let number = '';
      while (this.isDigit(this.current())) {
        number += this.current();
        this.advance();
      }
      
      if (this.current() === '.') {
        this.advance();
        this.skipWhitespace();
        const start = this.pos;
        while (this.pos < this.input.length && this.current() !== '\n') {
          this.advance();
        }
        const content = this.input.slice(start, this.pos).trim();
        return this.createToken<ListToken>('list', content, { 
          ordered: true, 
          startNumber: parseInt(number) 
        });
      }
    }
    return null;
  }

  private handleFormatting(): Token | null {
    // 处理加粗
    if (this.peek(0) === '*' && this.peek(1) === '*') {
      this.advance(); // 跳过第一个 *
      this.advance(); // 跳过第二个 *
      const start = this.pos;
      while (this.pos < this.input.length && !(this.current() === '*' && this.peek(1) === '*')) {
        this.advance();
      }
      const content = this.input.slice(start, this.pos).trim();
      this.advance(); // 跳过结束的第一个 *
      this.advance(); // 跳过结束的第二个 *
      return this.createToken('bold', content);
    }

    // 处理斜体
    if (this.current() === '*' && this.peek(1) !== '*') {
      this.advance();
      const start = this.pos;
      while (this.pos < this.input.length && this.current() !== '*') {
        this.advance();
      }
      const content = this.input.slice(start, this.pos).trim();
      this.advance();
      return this.createToken('italic', content);
    }

    // 处理删除线
    if (this.peek(0) === '~' && this.peek(1) === '~') {
      this.advance(); // 跳过第一个 ~
      this.advance(); // 跳过第二个 ~
      const start = this.pos;
      while (this.pos < this.input.length && !(this.current() === '~' && this.peek(1) === '~')) {
        this.advance();
      }
      const content = this.input.slice(start, this.pos).trim();
      this.advance(); // 跳过结束的第一个 ~
      this.advance(); // 跳过结束的第二个 ~
      return this.createToken('strikethrough', content);
    }

    return null;
  }

  private handleTable(): Token | null {
    if (this.current() === '|') {
      const headers: string[] = [];
      const alignments: ('left' | 'center' | 'right')[] = [];
      const rows: string[][] = [];

      // 处理表头
      this.advance(); // 跳过开始的 |
      while (this.pos < this.input.length && this.current() !== '\n') {
        const start = this.pos;
        while (this.pos < this.input.length && this.current() !== '|' && this.current() !== '\n') {
          this.advance();
        }
        headers.push(this.input.slice(start, this.pos).trim());
        if (this.current() === '|') this.advance();
      }

      // 跳过换行
      if (this.current() === '\n') this.advance();

      // 处理对齐行
      if (this.current() === '|') {
        this.advance();
        while (this.pos < this.input.length && this.current() !== '\n') {
          const start = this.pos;
          while (this.pos < this.input.length && this.current() !== '|' && this.current() !== '\n') {
            this.advance();
          }
          const align = this.input.slice(start, this.pos).trim();
          if (align.startsWith(':') && align.endsWith(':')) {
            alignments.push('center');
          } else if (align.endsWith(':')) {
            alignments.push('right');
          } else {
            alignments.push('left');
          }
          if (this.current() === '|') this.advance();
        }
      }

      return this.createToken<TableToken>('table', '', {
        headers,
        alignments,
        rows
      });
    }
    return null;
  }

  private tokenizeLink(): Token | null {
    this.pos++;

    let content = '';
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === ']') {
        this.pos++;
        break;
      }
      content += this.input[this.pos];
      this.pos++;
    }

    if (this.input[this.pos] !== '(') {
      return null;
    }
    this.pos++;

    let url = '';
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === ')') {
        this.pos++;
        break;
      }
      url += this.input[this.pos];
      this.pos++;
    }

    const position = this.getPosition();
    return this.createToken('link', content.trim(), { url });
  }

  private tokenizeImage(): Token | null {
    this.pos++; this.pos++;

    let alt = '';
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === ']') {
        this.pos++;
        break;
      }
      alt += this.input[this.pos];
      this.pos++;
    }

    if (this.input[this.pos] !== '(') {
      return null;
    }
    this.pos++;

    let url = '';
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === ')') {
        this.pos++;
        break;
      }
      url += this.input[this.pos];
      this.pos++;
    }

    const position = this.getPosition();
    return this.createToken('image', '', { url, alt });
  }

  private tokenizeBlockquote(): Token | null {
    this.pos++;

    let content = '';
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === '\n') {
        this.pos++;
        return this.createToken('blockquote', content);
      }
      content += this.input[this.pos];
      this.pos++;
    }

    return null;
  }

  private tokenizeText(): Token | null {
    let content = '';
    const startPos = this.pos;
    
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      
      if (char === '#' || char === '*' || char === '_' || 
          char === '[' || char === '!' || char === '>' || 
          char === '|' || char === '\n') {
        break;
      }
      
      content += char;
      this.pos++;
    }
    
    if (content.length === 0) {
      return null;
    }
    
    return this.createToken('text', content.trim());
  }
}