module.exports = {
    extends: [
        '@ecomfe/eslint-config/strict',
        '@ecomfe/eslint-config/typescript/strict',
        '@ecomfe/eslint-config/react/strict',
    ],
    root: true,
    env: {
        browser: true,
        node: true,
    },
    plugins: [],
    rules: {
        'no-param-reassign': ['error', {
            'props': true,
            'ignorePropertyModificationsFor': [
                'state',
                'figma',
                'config',
                'uiFrameWindow',
            ],
        }],
    },
};
