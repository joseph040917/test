import { 
  MarkdownNode,
  HeadingNode,
  ListNode,
  LinkNode,
  ImageNode,
  BlockquoteNode,
  TableNode,
  TextNode,
  BoldNode,
  ItalicNode,
  StrikethroughNode,
  HorizontalRuleNode
} from './types';

export interface NodeVisitor {
  render(node: MarkdownNode): string;
}

export class HTMLRenderer implements NodeVisitor {
  render(node: MarkdownNode): string {
    switch (node.type) {
      case 'heading':
        return this.renderHeading(node as HeadingNode);
      case 'text':
        return this.renderText(node as TextNode);
      case 'bold':
        return this.renderBold(node as BoldNode);
      case 'italic':
        return this.renderItalic(node as ItalicNode);
      case 'strikethrough':
        return this.renderStrikethrough(node as StrikethroughNode);
      case 'list':
        return this.renderList(node as ListNode);
      case 'link':
        return this.renderLink(node as LinkNode);
      case 'image':
        return this.renderImage(node as ImageNode);
      case 'blockquote':
        return this.renderBlockquote(node as BlockquoteNode);
      case 'horizontalRule':
        return this.renderHorizontalRule();
      case 'table':
        return this.renderTable(node as TableNode);
      default:
        return '';
    }
  }

  private renderHeading(node: HeadingNode): string {
    return `<h${node.level}>${this.escapeHtml(node.content)}</h${node.level}>`;
  }

  private renderText(node: TextNode): string {
    return this.escapeHtml(node.content);
  }

  private renderBold(node: BoldNode): string {
    return `<strong>${this.escapeHtml(node.content)}</strong>`;
  }

  private renderItalic(node: ItalicNode): string {
    return `<em>${this.escapeHtml(node.content)}</em>`;
  }

  private renderStrikethrough(node: StrikethroughNode): string {
    return `<del>${this.escapeHtml(node.content)}</del>`;
  }

  private renderList(node: ListNode): string {
    const tag = node.ordered ? 'ol' : 'ul';
    const startAttr = node.ordered && node.startNumber ? ` start="${node.startNumber}"` : '';
    
    let listContent = `<li>${this.escapeHtml(node.content)}</li>`;
    
    // 处理嵌套列表
    if (node.items && node.items.length > 0) {
      const nestedItems = node.items.map(item => 
        `<li>${this.escapeHtml(item.content)}${item.items && item.items.length > 0 ? this.renderList(item) : ''}</li>`
      ).join('');
      listContent += nestedItems;
    }
    
    return `<${tag}${startAttr}>${listContent}</${tag}>`;
  }

  private renderLink(node: LinkNode): string {
    return `<a href="${this.escapeHtml(node.url)}">${this.escapeHtml(node.content)}</a>`;
  }

  private renderImage(node: ImageNode): string {
    return `<img src="${this.escapeHtml(node.url)}" alt="${this.escapeHtml(node.alt || '')}" />`;
  }

  private renderBlockquote(node: BlockquoteNode): string {
    return `<blockquote>${this.escapeHtml(node.content)}</blockquote>`;
  }

  private renderHorizontalRule(): string {
    return '<hr />';
  }

  private renderTable(node: TableNode): string {
    const headers = node.headers.map(header => 
      `<th${node.alignments ? ` style="text-align: ${node.alignments[0] || 'left'}"` : ''}>${this.escapeHtml(header)}</th>`
    ).join('');

    const rows = node.rows.map(row => {
      const cells = row.map((cell, i) => 
        `<td${node.alignments ? ` style="text-align: ${node.alignments[i] || 'left'}"` : ''}>${this.escapeHtml(cell)}</td>`
      ).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <table>
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}