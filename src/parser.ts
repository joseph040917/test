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
    
    const token = this.tokens[this.current];
    
    switch (token.type) {
      case 'heading':
        return this.parseHeading(token as HeadingToken);
      case 'list':
        return this.parseList(token as ListToken);
      case 'bold':
        return this.parseBold(token);
      case 'italic':
        return this.parseItalic(token);
      case 'strikethrough':
        return this.parseStrikethrough(token);
      case 'table':
        return this.parseTable(token as TableToken);
      default:
        return this.parseText(token);
    }
  }

  private parseHeading(token: HeadingToken): HeadingNode {
    // Special handling for #title
    if (token.level === 1 && token.content.toLowerCase() === 'title') {
      return {
        type: 'heading',
        level: 1,
        content: 'title',
        position: token.position,
        indent: token.indent
      };
    }

    return {
      type: 'heading',
      level: token.level,
      content: token.content,
      position: token.position,
      indent: token.indent
    };
  }

  private parseList(token: ListToken): ListNode {
    return {
      type: 'list',
      ordered: token.ordered,
      startNumber: token.startNumber,
      content: token.content,
      position: token.position,
      indent: token.indent,
      items: []
    };
  }

  private parseBold(token: Token): BoldNode {
    return {
      type: 'bold',
      content: token.content,
      position: token.position,
      indent: token.indent
    };
  }

  private parseItalic(token: Token): ItalicNode {
    return {
      type: 'italic',
      content: token.content,
      position: token.position,
      indent: token.indent
    };
  }

  private parseStrikethrough(token: Token): StrikethroughNode {
    return {
      type: 'strikethrough',
      content: token.content,
      position: token.position,
      indent: token.indent
    };
  }

  private parseTable(token: TableToken): TableNode {
    return {
      type: 'table',
      headers: token.headers,
      rows: token.rows,
      alignments: token.alignments,
      content: '',
      position: token.position,
      indent: token.indent
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