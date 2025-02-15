# Markdown AST Parser

一个测试中的 Markdown 解析器，可以将 Markdown 文本转换为抽象语法树（AST）和 HTML。

## 安装

```bash
npm install markdown-ast-parser
```

## 使用示例

```typescript
import { parse } from 'markdown-ast-parser';

const markdown = `# 一级标题
这是一个**粗体**文本和*斜体*文本。

> 这是一个引用
> 包含多行内容

- 无序列表项1
- 无序列表项2
  - 嵌套列表项

1. 有序列表项1
2. 有序列表项2

[链接](https://example.com)
![图片](image.jpg "图片描述")

| 表头1 | 表头2 |
|-------|-------|
| 内容1 | 内容2 |`;

const { ast, errors } = parse(markdown);
```

## 功能特点

- 支持常用的 Markdown 语法：
  - 标题（H1-H6）
  - 粗体和斜体文本
  - 有序和无序列表（支持嵌套）
  - 链接和图片
  - 引用块
  - 表格
- 生成抽象语法树（AST）
- 可以转换为 HTML
- 完整的 TypeScript 类型支持
- 错误报告功能

## API 文档

### parse(input: string): { ast: Node[]; errors: ParseError[] }

将 Markdown 文本解析为抽象语法树。

- **参数**
  - `input`: 要解析的 Markdown 文本
- **返回值**
  - 包含以下属性的对象：
    - `ast`: AST 节点数组
    - `errors`: 解析过程中遇到的错误数组

### 节点类型

解析器支持以下类型的节点：

```typescript
type NodeType = 
  | 'heading'    // 标题
  | 'text'       // 普通文本
  | 'bold'       // 粗体
  | 'italic'     // 斜体
  | 'list'       // 列表
  | 'link'       // 链接
  | 'image'      // 图片
  | 'blockquote' // 引用块
  | 'table'      // 表格
```

每个节点都包含以下基本属性：
- `type`: 节点类型
- `content`: 节点内容
- `position`: 在原文中的位置信息
- `indent`: 缩进级别

## 示例输出

输入以下 Markdown：
```markdown
# 标题
这是**粗体**
```

将生成以下 AST：
```json
{
  "ast": [
    {
      "type": "heading",
      "content": "标题",
      "position": { "line": 1, "column": 1, "offset": 0 },
      "indent": 0,
      "level": 1
    },
    {
      "type": "text",
      "content": "这是",
      "position": { "line": 2, "column": 1, "offset": 8 },
      "indent": 0
    },
    {
      "type": "bold",
      "content": "粗体",
      "position": { "line": 2, "column": 3, "offset": 10 },
      "indent": 0
    }
  ],
  "errors": []
}
```

## 许可证

MIT