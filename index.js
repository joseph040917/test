const { tokenizer } = require('./dist/tokenizer');
const { parser } = require('./dist/parser');

function parse(markdown) {
    const tokens = tokenizer(markdown);
    const ast = parser(tokens);
    return ast;
}

module.exports = {
    parse,
    tokenizer,
    parser
};
