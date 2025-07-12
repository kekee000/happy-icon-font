import {createFont, FontEditor, TTF, default as utils} from 'fonteditor-core';
import JSZip from 'jszip';
import exportRender from './exportRender';

const whenWoff2Ready = Promise.race(
    [
        utils.woff2.init('https://kekee000.github.io/fonteditor/dep/woff2/woff2.wasm').catch(() => void 0),
        new Promise(resolve => setTimeout(resolve, 5000))
    ]
);

export async function writeFontZip(ttf: TTF.TTFObject, fileName: string): Promise<Blob> {
    const zip = new JSZip();
    const fontzip = zip.folder('fonteditor');
    const fontTypes = ['svg', 'ttf', 'symbol'];
    let ttfFile: ArrayBuffer | null = null;
    let symbolText: string = '';

    fontTypes.forEach(function (fileType) {
        let name = fileName + '.' + fileType;
        const content = createFont().set(structuredClone(ttf)).write({
            type: fileType as FontEditor.FontType,
        });
        if (fileType === 'symbol') {
            name = fileName + '-symbol.svg';
            symbolText = content as string;
        }
        if (fileType === 'ttf') {
            ttfFile = content as ArrayBuffer;
        }
        fontzip.file(name, content);
    });

    const woff2Ready = await whenWoff2Ready;
    if (woff2Ready) {
        // woff2
        fontzip.file(
            fileName + '.woff2',
            utils.ttftowoff2(ttfFile)
        );
    }

    // icon
    let iconData = utils.ttf2icon(ttf) as Record<string, any>;

    // css
    fontzip.file(
        'icon.css',
        exportRender.renderFontCss(iconData)
    );

    // page
    fontzip.file(
        'page.css',
        exportRender.renderPreviewCss()
    );

    // html
    fontzip.file(
        'example.html',
        exportRender.renderFontExample(iconData)
    );

    // symbol example
    iconData.symbolText = symbolText;
    fontzip.file(
        'example-symbol.html',
        exportRender.renderSymbolExample(iconData)
    );
    return fontzip.generateAsync({type: 'blob'});
}

export function createFontFromSvg(svgs: Array<{name: string, svg: string}>, fontFamily: string): TTF.TTFObject {
    const glyphs = svgs.map(svg => {
    const font = utils.createFont(svg.svg, {
            type: 'svg',
            combinePath: true,
        });
        const glyph = font.get().glyf[0];
        if (/^[\w+-]+$/.test(svg.name)) {
            (glyph as any)._name = svg.name.toLowerCase();
        }
        return glyph;
    });

    const font = utils.createFont();
    const ttfHelper = font.getHelper();
    ttfHelper.setName({
        fontFamily: fontFamily,
        fontSubFamily: fontFamily,
        uniqueSubFamily: fontFamily,
    });
    ttfHelper.get().glyf.push(...glyphs);
    ttfHelper.setUnicode('$E001', undefined, true);
    ttfHelper.get().glyf.forEach(glyph => {
        if ((glyph as any)._name) {
            glyph.name = (glyph as any)._name;
        }
    });
    ttfHelper.adjustGlyf(undefined, {
        adjustToEmBox: true,
        adjustToEmPadding: 100,
    });
    return ttfHelper.get();
}