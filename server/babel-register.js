const register = require('@babel/register');
const registerFn = typeof register === 'function' ? register : register.default;

registerFn({
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
        '@babel/preset-react',
    ],
    extensions: ['.js', '.jsx'],
    ignore: [/node_modules/],
    babelrc: false,
    configFile: false,
    cache: false,
});