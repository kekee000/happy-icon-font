/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * @file tpl renderer
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
// @ts-ignore
import vueComponent from './export/vue-component.tpl';
// @ts-ignore
import reactComponent from './export/react-component.tpl';

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

const rendererCache = new Map<string, EjsRenderer>();
function getOrCreateRenderer(tpl: string): EjsRenderer {
    if (!rendererCache.has(tpl)) {
        rendererCache.set(tpl, ejs.compile(tpl, compileOptions));
    }
    return rendererCache.get(tpl);
}

export interface IconData {
    symbolText?: string;
    lang?: Record<string, any>;
    fontFamily: string;
    glyfList: Array<{
        name: string;
        codeName: string;
        code: string;
        id: string;
    }>
}

export default {

    renderFontExample(iconData: IconData) {
        iconData.lang = lang;
        const renderer = getOrCreateRenderer(iconExample);
        return renderer(iconData);
    },

    renderSymbolExample(iconData: IconData) {
        iconData.lang = lang;
        const renderer = getOrCreateRenderer(symbolExample);
        return renderer(iconData);
    },

    renderFontCss(iconData: IconData) {
        iconData.lang = lang;
        const renderer = getOrCreateRenderer(iconCss);
        return renderer(iconData);
    },

    renderPreviewCss() {
        return pageCss;
    },

    renderVueComponent(ttf: IconData) {
        const renderer = getOrCreateRenderer(vueComponent);
        return renderer(ttf);
    },

    renderReactComponent(ttf: IconData) {
        const renderer = getOrCreateRenderer(reactComponent);
        return renderer(ttf);
    }
};
