import { parse } from './index';
import { MarkdownNode } from './types';

function renderHTML(nodes: MarkdownNode[]): string {
  let html = '';
  let currentParagraph = '';
  let listStack: { type: 'ordered' | 'unordered', indent: number }[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    let nextNode = i + 1 < nodes.length ? nodes[i + 1] : null;
    
    switch (node.type) {
      case 'heading':
        if (currentParagraph) {
          html += `<p>${currentParagraph}</p>\n`;
          currentParagraph = '';
        }
        html += `<h${node.level}>${node.content}</h${node.level}>\n`;
        break;
        
      case 'text':
      case 'bold':
      case 'italic':
      case 'link':
        // 处理内联元素
        const content = node.type === 'bold' ? `<strong>${node.content}</strong>` :
                       node.type === 'italic' ? `<em>${node.content}</em>` :
                       node.type === 'link' ? `<a href="${node.url}">${node.content}</a>` :
                       node.content;
                       
        if (nextNode && (nextNode.type === 'text' || nextNode.type === 'bold' || 
                        nextNode.type === 'italic' || nextNode.type === 'link')) {
          // 如果下一个节点也是内联元素，累积到当前段落
          currentParagraph += content;
        } else {
          // 如果是最后一个内联元素，输出完整段落
          html += `<p>${currentParagraph}${content}</p>\n`;
          currentParagraph = '';
        }
        break;
        
      case 'blockquote':
        if (currentParagraph) {
          html += `<p>${currentParagraph}</p>\n`;
          currentParagraph = '';
        }
        // 合并连续的引用块
        let quoteContent = node.content;
        while (nextNode && nextNode.type === 'blockquote') {
          quoteContent += '\n' + nextNode.content;
          i++; // 跳过下一个节点
          nextNode = i + 1 < nodes.length ? nodes[i + 1] : null;
        }
        html += `<blockquote>${quoteContent}</blockquote>\n`;
        break;
        
      case 'image':
        if (currentParagraph) {
          html += `<p>${currentParagraph}</p>\n`;
          currentParagraph = '';
        }
        // 修复图片标签的title属性问题，确保引号使用正确
        html += `<p><img src="${node.url}" alt="${node.alt || ''}"${
          node.content ? ` title="${node.content.replace(/["']/g, '&quot;')}"` : ''
        }></p>\n`;
        break;

      case 'list':
        if (currentParagraph) {
          html += `<p>${currentParagraph}</p>\n`;
          currentParagraph = '';
        }

        const indent = node.indent || 0;
        const listType = node.ordered ? 'ordered' : 'unordered';

        // 优化列表嵌套处理
        if (listStack.length === 0) {
          // 开始新的根级列表
          html += `${node.ordered ? '<ol>' : '<ul>'}\n`;
          listStack.push({ type: listType, indent });
        } else {
          const lastList = listStack[listStack.length - 1];
          
          if (indent > lastList.indent) {
            // 在当前列表项内开始新的嵌套列表
            const indentSpaces = '  '.repeat(lastList.indent + 1);
            // 确保嵌套列表在父列表项内部
            if (html.endsWith('</li>\n')) {
              html = html.slice(0, -6); // 移除最后的</li>
            }
            html += `\n${indentSpaces}${node.ordered ? '<ol>' : '<ul>'}\n`;
            listStack.push({ type: listType, indent });
          } else if (indent < lastList.indent) {
            // 结束当前嵌套级别的列表
            while (listStack.length > 0 && listStack[listStack.length - 1].indent > indent) {
              const poppedList = listStack.pop()!;
              const indentSpaces = '  '.repeat(poppedList.indent);
              html += `${indentSpaces}${poppedList.type === 'ordered' ? '</ol>' : '</ul>'}\n`;
              // 如果还有父列表项，添加结束标签
              if (listStack.length > 0) {
                html += `${indentSpaces}</li>\n`;
              }
            }
          }
        }

        // 添加列表项，使用正确的缩进
        const itemIndent = '  '.repeat(listStack.length);
        html += `${itemIndent}<li>${node.content}`;
        
        // 检查下一个节点，如果不是更深层级的列表，则立即闭合li标签
        if (!nextNode || nextNode.type !== 'list' || (nextNode.indent || 0) <= indent) {
          html += '</li>\n';
        }

        // 处理列表结束
        if (!nextNode || nextNode.type !== 'list' || (nextNode.indent || 0) < indent) {
          while (listStack.length > 0 && (
            !nextNode || 
            nextNode.type !== 'list' || 
            (nextNode.indent || 0) < listStack[listStack.length - 1].indent
          )) {
            const lastList = listStack.pop()!;
            const indentSpaces = '  '.repeat(Math.max(0, lastList.indent));
            html += `${indentSpaces}${lastList.type === 'ordered' ? '</ol>' : '</ul>'}\n`;
          }
        }
        break;
        
      case 'table':
        if (currentParagraph) {
          html += `<p>${currentParagraph}</p>\n`;
          currentParagraph = '';
        }
        // 处理表格
        if (node.headers) {
          // 只处理第一个表格头部
          if (!html.includes('<table>')) {
            html += '<table>\n<thead>\n<tr>\n';
            node.headers.forEach(header => {
              html += `  <th>${header}</th>\n`;
            });
            html += '</tr>\n</thead>\n<tbody>\n';
          }
          // 如果是数据行（不是分隔符行）且不是表头行
          else if (!node.headers.some(h => h.includes('--'))) {
            html += '<tr>\n';
            node.headers.forEach(cell => {
              html += `  <td>${cell}</td>\n`;
            });
            html += '</tr>\n';
          }
          // 如果是最后一行，关闭表格标签
          if (!nextNode || nextNode.type !== 'table') {
            html += '</tbody>\n</table>\n';
          }
        }
        break;
    }
  }

  // 处理最后可能剩余的段落
  if (currentParagraph) {
    html += `<p>${currentParagraph}</p>\n`;
  }

  return html;
}

const markdown = `# 一级标题
## 二级标题
### 三级标题

这是一个普通段落，包含**粗体**和*斜体*文本。

> 这是一个引用块
> 包含多行内容
> 可以有很多行

这是一个[链接](https://example.com)，还有一个![图片](image.jpg "图片描述")。

无序列表：
* 第一项
* 第二项
* 第三项

有序列表：
1. 第一项
2. 第二项
3. 第三项

嵌套列表：
* 水果
  * 苹果
  * 香蕉
* 蔬菜
  * 胡萝卜
  * 白菜

| 表头1 | 表头2 | 表头3 |
|-------|-------|-------|
| 单元格1 | 单元格2 | 单元格3 |
| 数据1 | 数据2 | 数据3 |`;

console.log('=== 开始测试 Markdown 解析器 ===');
console.log('输入的 Markdown:\n', markdown);

try {
  console.log('\n1. 开始解析...');
  const result = parse(markdown);
  
  console.log('\n2. 解析结果:');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.errors && result.errors.length > 0) {
    console.error('\n3. 解析错误:', result.errors);
    process.exit(1);
  }

  console.log('\n3. 渲染 HTML:');
  const html = renderHTML(result.ast);
  console.log(html);

} catch (error) {
  console.error('\n发生错误:', error);
  if (error instanceof Error) {
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
  }
  process.exit(1);
}