import { 
  Token, 
  MarkdownNode, 
  Position, 
  ParseError, 
  ListNode, 
  HeadingNode, 
  TextNode, 
  BoldNode, 
  ItalicNode, 
  StrikethroughNode, 
  LinkNode, 
  ImageNode, 
  BlockquoteNode, 
  TableNode, 
  HorizontalRuleNode,
  HeadingToken,
  ListToken,
  LinkToken,
  ImageToken,
  TableToken
} from './types';
import { Tokenizer } from './tokenizer';

export class Parser {
  private tokens: Token[];
  private current: number;
  private errors: ParseError[];
  private tokenizer: Tokenizer;
  private currentList: ListNode | null;

  constructor(tokenizer: Tokenizer) {
    this.tokens = [];
    this.current = 0;
    this.errors = [];
    this.tokenizer = tokenizer;
    this.currentList = null;
  }

  parse(tokens: Token[]): { ast: MarkdownNode[]; errors: ParseError[] } {
    this.tokens = tokens;
    this.current = 0;
    this.errors = [];
    this.currentList = null;

    const nodes: MarkdownNode[] = [];
    while (!this.isAtEnd()) {
      try {
        const node = this.parseToken();
        if (node) {
          nodes.push(node);
        }
      } catch (error) {
        if (error instanceof ParseError) {
          this.errors.push(error);
        } else {
          this.errors.push(new ParseError(error instanceof Error ? error.message : 'Unknown error', this.peek().position));
        }
      }
    }

    return { ast: nodes, errors: this.errors };
  }

  private parseToken(): MarkdownNode | null {
    if (this.isAtEnd()) return null;
    
    const token = this.peek();
    
    try {
      switch (token.type) {
        case 'heading':
          return this.parseHeading(token as HeadingToken);
        case 'text':
          return this.parseText(token);
        case 'bold':
          return this.parseBold(token);
        case 'italic':
          return this.parseItalic(token);
        case 'strikethrough':
          return this.parseStrikethrough(token);
        case 'list':
          return this.parseList(token as ListToken);
        case 'link':
          return this.parseLink(token as LinkToken);
        case 'image':
          return this.parseImage(token as ImageToken);
        case 'blockquote':
          return this.parseBlockquote(token);
        case 'horizontalRule':
          return this.parseHorizontalRule(token);
        case 'table':
          return this.parseTable(token as TableToken);
        default: {
          // 确保 token 是 Token 类型
          const unknownToken = token as Token;
          throw new ParseError(`Unknown token type: ${unknownToken.type}`, unknownToken.position);
        }
      }
    } catch (err) {
      if (err instanceof ParseError) {
        throw err;
      }
      throw new ParseError(err instanceof Error ? err.message : 'Unknown error', token.position);
    }
  }

  private parseHeading(token: HeadingToken): HeadingNode {
    this.advance();
    return {
      type: 'heading',
      content: token.content,
      position: token.position,
      indent: token.indent,
      level: token.level
    };
  }

  private parseText(token: Token): TextNode {
    this.advance();
    return {
      type: 'text',
      content: token.content,
      position: token.position,
      indent: token.indent
    };
  }

  private parseBold(token: Token): BoldNode {
    this.advance();
    return {
      type: 'bold',
      content: token.content,
      position: token.position,
      indent: token.indent
    };
  }

  private parseItalic(token: Token): ItalicNode {
    this.advance();
    return {
      type: 'italic',
      content: token.content,
      position: token.position,
      indent: token.indent
    };
  }

  private parseStrikethrough(token: Token): StrikethroughNode {
    this.advance();
    return {
      type: 'strikethrough',
      content: token.content,
      position: token.position,
      indent: token.indent
    };
  }

  private parseList(token: ListToken): ListNode {
    this.advance();
    return {
      type: 'list',
      content: token.content,
      position: token.position,
      indent: token.indent,
      ordered: token.ordered,
      startNumber: token.startNumber,
      items: []
    };
  }

  private parseLink(token: LinkToken): LinkNode {
    this.advance();
    return {
      type: 'link',
      content: token.content,
      position: token.position,
      indent: token.indent,
      url: token.url
    };
  }

  private parseImage(token: ImageToken): ImageNode {
    this.advance();
    return {
      type: 'image',
      content: token.content,
      position: token.position,
      indent: token.indent,
      url: token.url,
      alt: token.alt
    };
  }

  private parseBlockquote(token: Token): BlockquoteNode {
    this.advance();
    return {
      type: 'blockquote',
      content: token.content,
      position: token.position,
      indent: token.indent
    };
  }

  private parseHorizontalRule(token: Token): HorizontalRuleNode {
    this.advance();
    return {
      type: 'horizontalRule',
      content: token.content,
      position: token.position,
      indent: token.indent
    };
  }

  private parseTable(token: TableToken): TableNode {
    this.advance();
    return {
      type: 'table',
      content: token.content,
      position: token.position,
      indent: token.indent,
      headers: token.headers,
      rows: token.rows,
      alignments: token.alignments
    };
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    const token = this.tokens[this.current - 1];
    if (!token) {
      throw new ParseError('Invalid token', { line: 1, column: 1, offset: 0 });
    }
    return token;
  }

  private peek(): Token {
    if (this.isAtEnd()) {
      const lastToken = this.tokens[this.tokens.length - 1];
      if (!lastToken) {
        throw new ParseError('Empty token stream', { line: 1, column: 1, offset: 0 });
      }
      throw new ParseError('Unexpected end of input', lastToken.position);
    }
    const token = this.tokens[this.current];
    if (!token) {
      throw new ParseError('Invalid token', { line: 1, column: 1, offset: 0 });
    }
    return token;
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }
}