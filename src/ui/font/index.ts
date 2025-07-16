import {createFont, FontEditor, TTF, default as utils} from 'fonteditor-core';
import JSZip from 'jszip';
import exportRender, { IconData } from './exportRender';
import contours2svg from 'fonteditor-core/lib/ttf/util/contours2svg.js';
import {computePathBox} from 'fonteditor-core/lib/graphics/computeBoundingBox.js';
import pathsUtil from 'fonteditor-core/lib/graphics/pathsUtil.js';
import getLogger from '../../common/logger';

const logger = getLogger('fonteditor');

const whenWoff2Ready = Promise.race(
    [
        utils.woff2.init('https://kekee000.github.io/fonteditor/dep/woff2/woff2.wasm').catch(() => void 0),
        new Promise(resolve => setTimeout(resolve, 20000))
    ]
);

export const onlineEditorBase = 'https://kekee000.github.io/fonteditor';

export function getOnlineEditorUrl(from = 'figma'): string {
    const lang = (window.navigator.language || 'zh-cn').toLowerCase();
    return `${onlineEditorBase}/${lang === 'zh-cn' ? 'index' : 'index-en'}.html?from=${from}`;
}

export function getOnlineConnectUrl(from = 'figma'): string {
    return `${onlineEditorBase}/connect.html?from=${from}`;
}

export async function writeFontZip(font: FontEditor.Font, fileName: string): Promise<Blob> {
    const zip = new JSZip();
    const fontzip = zip.folder('fonteditor');
    const fontTypes = ['svg', 'ttf', 'symbol'];
    let ttfFile: ArrayBuffer | null = null;
    let symbolText: string = '';
    const ttf = font.get();

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
        // export woff2
        fontzip.file(
            fileName + '.woff2',
            utils.ttftowoff2(ttfFile)
        );
    }

    // icon
    const iconData = utils.ttf2icon(ttf) as IconData;

    // css
    fontzip.file(
        'icon.css',
        exportRender.renderFontCss(iconData)
    );

    // vue component
    fontzip.file(
        'Icon.vue',
        exportRender.renderVueComponent(iconData)
    );

    // react component
    fontzip.file(
        'Icon.tsx',
        exportRender.renderReactComponent(iconData)
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

/**
 * create font instance from figma svg
 * @param svgs figma svgs
 * @param fontFamily font family
 * @returns
 */
export function createFontFromSvg(svgs: Array<{name: string, svg: string}>, fontFamily: string): FontEditor.Font {
    const glyphs = svgs.map(svg => {
    const font = utils.createFont(svg.svg, {
            type: 'svg',
            combinePath: true,
        });
        const glyph = font.get().glyf[0];
        if (/[\w+-]+/.test(svg.name)) {
            (glyph as any)._name = svg.name;
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
    const ttf = font.get();
    logger.debug('parseFontFileToSvg', ttf);
    return font;
}

interface ScaleGlyphsToIconOptions {
    iconSize: number;
    unitsPerEm: number;
    decent: number;
}

function scaleGlyphsToIcon(contours: TTF.Contour[], options: ScaleGlyphsToIconOptions): TTF.Contour[] {
    const {iconSize, unitsPerEm} = options;
    pathsUtil.flip(contours);
    const boundingBox = computePathBox(...contours) as {x: number, y: number, width: number, height: number};
    const x = (unitsPerEm - boundingBox.width) / 2;
    const y = (unitsPerEm - boundingBox.height) / 2;;
    pathsUtil.move(contours, x, y);

    const scale = iconSize / unitsPerEm * 0.9;
    const scaledContours = contours.map(contour => {
        return contour.map(point => {
            return {
                x: point.x * scale,
                y: point.y * scale,
                onCurve: point.onCurve,
            };
        });
    });
    return scaledContours;
}

function glyphToSvg(glyph: TTF.Glyph, options: ScaleGlyphsToIconOptions): string {
    const {iconSize} = options;
    const svgPath = contours2svg(scaleGlyphsToIcon(structuredClone(glyph.contours), options));
    const svg = `<svg viewbox="0 0 ${iconSize} ${iconSize}">`
        +           `<path d="${svgPath}"/>`
        +       '</svg>';
    return svg;
}

/** glyph to icon size */
export const ICON_SIZE = 90;

export interface FontSvg {
    id: string;
    name: string;
    svg: string;
    unicode?: number;
}

/**
 * parse font file to figma svgs
 * @param file font file arraybuffer
 * @param fileType font file type @see FontEditor.FontType
 * @returns
 */
export async function parseFontFileToSvg(file: ArrayBuffer, fileType: string): Promise<FontSvg[]> {
    if (!['ttf', 'otf', 'woff', 'woff2', 'svg'].includes(fileType)) {
        throw new Error(`Unsupported font file type: ${fileType}`);
    }

    if (fileType === 'woff2') {
        const whenReady = await whenWoff2Ready;
        if (!whenReady) {
            throw new Error('woff2 parser not ready, please reload plugin and try again.');
        }
    }

    const ttf = utils.createFont(file, {
        type: fileType as FontEditor.FontType,
        compound2simple: true,
        combinePath: true,
    }).get();

    const unitsPerEm = ttf.head.unitsPerEm;
    const glyphs = ttf.glyf.filter(glyph =>
        (glyph.advanceWidth > 0 && glyph.contours?.length > 0 && glyph.contours[0].length > 1));
    logger.info('parseFontFileToSvg glyphs:', glyphs.length);

    const svgs = glyphs.map(glyph => {
        return {
            name: glyph.name || (glyph.unicode?.[0] ? `uni${glyph.unicode[0].toString(16).toUpperCase()}` : ''),
            unicode: glyph.unicode?.[0] || 0,
            svg: glyphToSvg(glyph, {iconSize: ICON_SIZE, unitsPerEm, decent: ttf.hhea.descent}),
            id: Math.random().toString(36).substring(2, 15)
        }
    });
    return svgs;
}

export function fontToBase64(font: FontEditor.Font): string {
    return utils.ttf2base64(font.write({type: 'ttf'}) as ArrayBuffer);
}