/**
 * @file html渲染器
 * @author mengke01(kekee000@gmail.com)
 */

// @ts-ignore
import iconExample from './export/icon-example.tpl';
// @ts-ignore
import symbolExample from './export/symbol-example.tpl';
// @ts-ignore
import iconCss from './export/icon-css.tpl';
// @ts-ignore
import pageCss from './export/page-css.tpl';
import lang from '../i18n/lang';

const compileOptions = {
    delimiter: '%',
    openDelimiter: '{',
    closeDelimiter: '}',
    client: true,
};
// ejs could not compile with webpack, so we use the global ejs
const ejs = (window as any).ejs;

type EjsRenderer = (data: Record<string, any>) => string;
let fontExampleRender: EjsRenderer | null = null; // 图标示例渲染器
let fontCssRender: EjsRenderer | null = null; // 图标css渲染器
let symbolExampleRender: EjsRenderer | null = null; // symbol渲染器

export default {

    renderFontExample(iconData: Record<string, any>) {
        fontExampleRender = fontExampleRender || ejs.compile(iconExample, compileOptions);
        iconData.lang = lang;
        return fontExampleRender(iconData);
    },

    renderSymbolExample(iconData: Record<string, any>) {
        symbolExampleRender = symbolExampleRender || ejs.compile(symbolExample, compileOptions);
        iconData.lang = lang;
        return symbolExampleRender(iconData);
    },

    renderFontCss(iconData: Record<string, any>) {
        fontCssRender = fontCssRender || ejs.compile(iconCss, compileOptions);
        iconData.lang = lang;

        return fontCssRender(iconData);
    },

    renderPreviewCss() {
        return pageCss;
    }
};
