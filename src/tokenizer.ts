import { Token, TokenType, Position, BaseToken } from './types';

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
    console.log('Tokenizer 初始化:', { input: input.slice(0, 20) + '...' });
  }

  tokenize(): Token[] {
    console.log('开始 tokenize');
    const tokens: Token[] = [];
    while (this.pos < this.input.length) {
      console.log(`当前位置: ${this.pos}, 当前字符: "${this.input[this.pos]}", 行: ${this.line}, 列: ${this.column}`);
      const token = this.nextToken();
      console.log('获取到的 token:', token);
      if (token) {
        tokens.push(token);
      }
    }
    console.log('tokenize 完成, 共生成 tokens:', tokens.length);
    return tokens;
  }

  private createToken<T extends Token>(
    type: TokenType,
    content: string,
    extras: Omit<T, keyof BaseToken> = {} as any
  ): T {
    console.log('创建 token:', { type, content: content.slice(0, 20) + '...', extras });
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

  private nextToken(): Token | null {
    console.log('nextToken 开始');
    this.skipWhitespace();
    console.log('跳过空白后位置:', this.pos);
    
    if (this.pos >= this.input.length) {
      console.log('到达输入末尾');
      return null;
    }

    const char = this.input[this.pos];
    console.log('当前处理的字符:', char);
    
    let token: Token | null = null;
    
    // 先检查是否是列表开始
    if (this.isListStart()) {
      token = this.tokenizeList();
    } else if (char === '#') {
      token = this.tokenizeHeading();
    } else if (char === '*' || char === '_') {
      token = this.tokenizeEmphasis();
    } else if (char === '[') {
      token = this.tokenizeLink();
    } else if (char === '!') {
      token = this.tokenizeImage();
    } else if (char === '>') {
      token = this.tokenizeBlockquote();
    } else if (char === '|') {
      token = this.tokenizeTable();
    } else {
      token = this.tokenizeText();
    }

    console.log('nextToken 结果:', token);
    return token;
  }

  private skipWhitespace(): void {
    let skipped = false;
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      if (char === ' ' || char === '\t') {
        this.pos++;
        this.column++;
        skipped = true;
      } else if (char === '\n') {
        this.pos++;
        this.line++;
        this.column = 1;
        skipped = true;
      } else {
        break;
      }
    }
    if (skipped) {
      console.log('跳过空白字符后:', {
        pos: this.pos,
        line: this.line,
        column: this.column,
        nextChar: this.input[this.pos]
      });
    }
  }

  private tokenizeHeading(): Token | null {
    const startPos = this.pos;
    let level = 0;
    console.log('开始解析标题');

    while (this.pos < this.input.length && this.input[this.pos] === '#') {
      level++;
      this.pos++;
    }
    console.log('标题级别:', level);

    if (this.pos >= this.input.length || this.input[this.pos] !== ' ') {
      this.pos = startPos;
      console.log('标题解析失败');
      return null;
    }
    console.log('标题后面有空格');

    this.pos++;

    let content = '';
    while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
      content += this.input[this.pos];
      this.pos++;
    }
    console.log('标题内容:', content);

    const position = this.getPosition();
    return this.createToken('heading', content.trim(), { level });
  }

  private tokenizeEmphasis(): Token | null {
    const startPos = this.pos;
    console.log('开始解析强调');

    // 检查是否是粗体标记
    if (this.input[this.pos] === '*' && this.input[this.pos + 1] === '*') {
      return this.tokenizeBold();
    } else {
      return this.tokenizeItalic();
    }
  }

  private tokenizeBold(): Token | null {
    const startPos = this.pos;
    console.log('开始解析粗体');

    // 检查是否是粗体标记
    if (this.pos + 1 >= this.input.length || this.input[this.pos + 1] !== '*') {
      console.log('粗体标记不正确');
      return null;
    }
    console.log('粗体标记正确');

    this.pos++; // 跳过第一个 *
    this.pos++; // 跳过第二个 *
    console.log('跳过粗体标记');

    let content = '';
    let foundEnd = false;
    console.log('开始收集粗体内容');

    while (this.pos < this.input.length - 1) {
      if (this.input[this.pos] === '*' && this.input[this.pos + 1] === '*') {
        foundEnd = true;
        this.pos++; // 跳过第一个结束 *
        this.pos++; // 跳过第二个结束 *
        console.log('找到粗体结束标记');
        break;
      }
      content += this.input[this.pos];
      this.pos++;
    }
    console.log('收集到的粗体内容:', content);

    if (!foundEnd) {
      this.pos = startPos;
      console.log('没有找到粗体结束标记');
      return null;
    }
    console.log('粗体解析完成');

    const position = this.getPosition();
    return this.createToken('bold', content.trim());
  }

  private tokenizeItalic(): Token | null {
    const startPos = this.pos;
    console.log('开始解析斜体');

    // 确保不是粗体标记
    if (this.pos + 1 < this.input.length && this.input[this.pos + 1] === '*') {
      console.log('不是斜体标记');
      return null;
    }
    console.log('是斜体标记');

    this.pos++; // 跳过开始的 *
    console.log('跳过斜体开始标记');

    let content = '';
    let foundEnd = false;
    console.log('开始收集斜体内容');

    while (this.pos < this.input.length) {
      // 如果遇到换行符或表格分隔符，说明斜体没有正确结束
      if (this.input[this.pos] === '\n' || this.input[this.pos] === '|') {
        console.log('遇到换行符或表格分隔符，斜体解析失败');
        this.pos = startPos;
        return null;
      }

      // 找到斜体结束标记
      if (this.input[this.pos] === '*' && 
          (this.pos + 1 >= this.input.length || this.input[this.pos + 1] !== '*')) {
        foundEnd = true;
        this.pos++; // 跳过结束的 *
        console.log('找到斜体结束标记');
        break;
      }
      content += this.input[this.pos];
      this.pos++;
    }
    console.log('收集到的斜体内容:', content);

    if (!foundEnd || content.trim().length === 0) {
      this.pos = startPos;
      console.log('没有找到斜体结束标记或内容为空');
      return null;
    }
    console.log('斜体解析完成');

    const position = this.getPosition();
    return this.createToken('italic', content.trim());
  }

  private tokenizeLink(): Token | null {
    this.pos++; // 跳过 [
    console.log('开始解析链接');

    let content = '';
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === ']') {
        this.pos++;
        console.log('找到链接结束标记');
        break;
      }
      content += this.input[this.pos];
      this.pos++;
    }
    console.log('收集到的链接内容:', content);

    if (this.input[this.pos] !== '(') {
      console.log('链接后面没有括号');
      return null;
    }
    this.pos++; // 跳过 (

    let url = '';
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === ')') {
        this.pos++;
        console.log('找到链接 URL 结束标记');
        break;
      }
      url += this.input[this.pos];
      this.pos++;
    }
    console.log('收集到的链接 URL:', url);

    const position = this.getPosition();
    return this.createToken('link', content.trim(), { url });
  }

  private tokenizeImage(): Token | null {
    this.pos++; this.pos++; // 跳过 ![
    console.log('开始解析图片');

    let alt = '';
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === ']') {
        this.pos++;
        console.log('找到图片结束标记');
        break;
      }
      alt += this.input[this.pos];
      this.pos++;
    }
    console.log('收集到的图片描述:', alt);

    if (this.input[this.pos] !== '(') {
      console.log('图片后面没有括号');
      return null;
    }
    this.pos++; // 跳过 (

    let url = '';
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === ')') {
        this.pos++;
        console.log('找到图片 URL 结束标记');
        break;
      }
      url += this.input[this.pos];
      this.pos++;
    }
    console.log('收集到的图片 URL:', url);

    const position = this.getPosition();
    return this.createToken('image', '', { url, alt });
  }

  private tokenizeBlockquote(): Token | null {
    this.pos++; // 跳过 >
    console.log('开始解析块引用');

    let content = '';
    while (this.pos < this.input.length) {
      if (this.input[this.pos] === '\n') {
        this.pos++;
        console.log('找到块引用结束标记');
        return this.createToken('blockquote', content);
      }
      content += this.input[this.pos];
      this.pos++;
    }
    console.log('收集到的块引用内容:', content);

    return null;
  }

  private tokenizeTable(): Token | null {
    console.log('开始解析表格');
    const startPos = this.pos;
    
    // 收集表头
    let headers: string[] = [];
    let currentCell = '';
    
    // 跳过开始的 |
    this.pos++;
    
    // 解析第一行（表头）
    while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
      const char = this.input[this.pos];
      if (char === '|') {
        headers.push(currentCell.trim());
        currentCell = '';
        this.pos++;
      } else {
        currentCell += char;
        this.pos++;
      }
    }
    
    // 添加最后一个单元格（如果有的话）
    if (currentCell.trim()) {
      headers.push(currentCell.trim());
    }
    
    // 如果没有找到有效的表头，回退并返回 null
    if (headers.length === 0) {
      console.log('没有找到有效的表头');
      this.pos = startPos;
      return null;
    }
    
    console.log('解析到表头:', headers);
    return this.createToken('table', headers.join(' | '), { headers, rows: [] });
  }

  private tokenizeList(): Token | null {
    const startPos = this.pos;
    console.log('开始解析列表');

    // 获取缩进级别
    const lineStart = this.input.lastIndexOf('\n', this.pos - 1) + 1;
    const indent = this.pos - lineStart;
    console.log('缩进级别:', indent);

    const char = this.input[this.pos];
    let ordered = false;
    let startNumber: number | undefined;

    // 处理有序列表
    if (/[0-9]/.test(char)) {
      console.log('是有序列表');
      ordered = true;
      let numStr = '';
      while (this.pos < this.input.length && /[0-9]/.test(this.input[this.pos])) {
        numStr += this.input[this.pos];
        this.pos++;
      }
      startNumber = parseInt(numStr, 10);
      console.log('列表起始数字:', startNumber);
      
      // 检查并跳过点和空格
      if (this.pos < this.input.length && this.input[this.pos] === '.') {
        this.pos++;
        if (this.pos < this.input.length && (this.input[this.pos] === ' ' || this.input[this.pos] === '\t')) {
          this.pos++;
        } else {
          console.log('有序列表标记后缺少空格');
          this.pos = startPos;
          return null;
        }
      } else {
        console.log('有序列表标记格式不正确');
        this.pos = startPos;
        return null;
      }
    } else {
      console.log('不是有序列表');
      // 检查无序列表标记
      if (char === '*' || char === '-' || char === '+') {
        this.pos++; // 跳过列表标记
        // 检查标记后是否有空格
        if (this.pos < this.input.length && (this.input[this.pos] === ' ' || this.input[this.pos] === '\t')) {
          this.pos++; // 跳过空格
        } else {
          console.log('无序列表标记后缺少空格');
          this.pos = startPos;
          return null;
        }
      } else {
        console.log('无效的列表标记');
        this.pos = startPos;
        return null;
      }
    }

    // 跳过额外的空格
    while (this.pos < this.input.length && (this.input[this.pos] === ' ' || this.input[this.pos] === '\t')) {
      this.pos++;
    }

    // 收集列表项内容
    let content = '';
    while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
      content += this.input[this.pos];
      this.pos++;
    }

    // 内容为空则返回 null
    if (content.trim().length === 0) {
      console.log('列表项内容为空');
      this.pos = startPos;
      return null;
    }

    // 跳过换行符
    if (this.pos < this.input.length && this.input[this.pos] === '\n') {
      this.pos++;
      this.line++;
      this.column = 1;
    }

    console.log('列表项解析完成:', {
      ordered,
      startNumber,
      content: content.trim(),
      indent,
      newPosition: this.pos
    });

    return this.createToken('list', content.trim(), {
      ordered,
      startNumber
    });
  }

  private tokenizeText(): Token | null {
    console.log('开始解析文本');
    let content = '';
    const startPos = this.pos;
    
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      console.log('处理文本字符:', { char, pos: this.pos });
      
      // 如果遇到特殊字符，停止文本收集
      if (char === '#' || char === '*' || char === '_' || 
          char === '[' || char === '!' || char === '>' || 
          char === '|' || char === '\n') {
        break;
      }
      
      content += char;
      this.pos++;
    }
    
    // 如果没有收集到任何内容，返回 null
    if (content.length === 0) {
      console.log('没有收集到文本内容');
      return null;
    }
    
    console.log('解析到文本:', content);
    return this.createToken('text', content.trim());
  }

  private isListStart(): boolean {
    // 确保在行首或只有空格
    const lineStart = this.input.lastIndexOf('\n', this.pos - 1) + 1;
    const currentLineIndent = this.pos - lineStart;
    
    // 检查前面是否只有空格
    for (let i = lineStart; i < this.pos; i++) {
      if (this.input[i] !== ' ' && this.input[i] !== '\t') {
        console.log('行首包含非空格字符，不是列表开始');
        return false;
      }
    }

    const char = this.input[this.pos];
    const nextChar = this.pos + 1 < this.input.length ? this.input[this.pos + 1] : '';
    
    console.log('检查列表开始:', { char, nextChar, currentLineIndent });

    // 无序列表：*, -, +
    if ((char === '*' || char === '-' || char === '+') && 
        this.pos + 1 < this.input.length && 
        (this.input[this.pos + 1] === ' ' || this.input[this.pos + 1] === '\t')) {
      console.log('检测到无序列表标记');
      return true;
    }

    // 有序列表：1. 2. 3. 等
    if (/[0-9]/.test(char)) {
      let i = this.pos + 1;
      while (i < this.input.length && /[0-9]/.test(this.input[i])) {
        i++;
      }
      if (i < this.input.length - 1 && 
          this.input[i] === '.' && 
          (this.input[i + 1] === ' ' || this.input[i + 1] === '\t')) {
        console.log('检测到有序列表标记');
        return true;
      }
    }

    console.log('不是列表开始');
    return false;
  }

  private isValidAlignmentRow(row: string[]): boolean {
    return row.every(cell => {
      cell = cell.trim();
      return cell.match(/^:?-+:?$/) !== null;
    });
  }

  private isWordBoundary(char: string): boolean {
    return char === undefined || char === ' ' || char === '\n' || char === '\t' ||
           char === '.' || char === ',' || char === '!' || char === '?' ||
           char === ';' || char === ':' || char === '(' || char === ')';
  }
}