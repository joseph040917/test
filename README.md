# test-ast-asr

一个简单而强大的 Markdown AST 解析器。

## 安装

```bash
npm install test-ast-asr
```

或者通过 GitHub 安装：

```bash
npm install github:joseph040917/test
```

## 使用方法

```javascript
const { parse } = require('test-ast-asr');

// 解析 Markdown 文本
const ast = parse('# Hello World');
console.log(ast);
```

## 功能特点

- 将 Markdown 文本解析为 AST（抽象语法树）
- 支持基本的 Markdown 语法
- 使用 TypeScript 编写，提供类型支持

## 许可证

MIT
