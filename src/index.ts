import { MarkdownNode as Node, ParseError } from './types';
import { Parser } from './parser';
import { Tokenizer } from './tokenizer';

export function parse(input: string): { ast: Node[]; errors: ParseError[] } {
  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokenizer);
  return parser.parse(tokens);
}

export { Node, ParseError };
export * from './types';
export * from './parser';
export * from './tokenizer';
export * from './nodes';