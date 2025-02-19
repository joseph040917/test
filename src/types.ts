export type TokenType = 
  | 'heading'
  | 'text'
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'list'
  | 'link'
  | 'image'
  | 'blockquote'
  | 'horizontalRule'
  | 'table';

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export class ParseError extends Error {
  constructor(
    message: string,
    public position: Position
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

export interface BaseToken {
  type: TokenType;
  content: string;
  position: Position;
  indent: number;
}

export interface HeadingToken extends BaseToken {
  type: 'heading';
  level: number;
}

export interface ListToken extends BaseToken {
  type: 'list';
  ordered: boolean;
  startNumber?: number;
}

export interface LinkToken extends BaseToken {
  type: 'link';
  url: string;
}

export interface ImageToken extends BaseToken {
  type: 'image';
  url: string;
  alt: string;
}

export interface TableToken extends BaseToken {
  type: 'table';
  headers: string[];
  rows: string[][];
  alignments: ('left' | 'center' | 'right')[];
}

export type Token =
  | HeadingToken
  | ListToken
  | LinkToken
  | ImageToken
  | TableToken
  | (BaseToken & { type: Exclude<TokenType, 'heading' | 'list' | 'link' | 'image' | 'table'> });

export interface BaseNode {
  type: TokenType;
  content: string;
  position: Position;
  indent: number;
}

export interface HeadingNode extends BaseNode {
  type: 'heading';
  level: number;
}

export interface TextNode extends BaseNode {
  type: 'text';
}

export interface BoldNode extends BaseNode {
  type: 'bold';
}

export interface ItalicNode extends BaseNode {
  type: 'italic';
}

export interface StrikethroughNode extends BaseNode {
  type: 'strikethrough';
}

export interface ListNode extends BaseNode {
  type: 'list';
  ordered: boolean;
  startNumber?: number;
  items: ListNode[];
}

export interface LinkNode extends BaseNode {
  type: 'link';
  url: string;
}

export interface ImageNode extends BaseNode {
  type: 'image';
  url: string;
  alt: string;
}

export interface BlockquoteNode extends BaseNode {
  type: 'blockquote';
}

export interface HorizontalRuleNode extends BaseNode {
  type: 'horizontalRule';
}

export interface TableNode extends BaseNode {
  type: 'table';
  headers: string[];
  rows: string[][];
  alignments: ('left' | 'center' | 'right')[];
}

export type MarkdownNode =
  | HeadingNode
  | TextNode
  | BoldNode
  | ItalicNode
  | StrikethroughNode
  | ListNode
  | LinkNode
  | ImageNode
  | BlockquoteNode
  | HorizontalRuleNode
  | TableNode;

export interface ParseResult {
  ast: MarkdownNode[];
  errors: ParseError[];
}