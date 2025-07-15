import React from 'react';
import styles from './Font2Icon.module.less';
import {Button, Input, Pagination} from 'antd';
import {LoadingOutlined, ReloadOutlined, SearchOutlined} from '@ant-design/icons';
import pluginAPI from 'ui/services/plugin-api';
import {parseFontFileToSvg, ICON_SIZE, FontSvg} from 'ui/font';
import {debounce} from 'lodash-es';
import {onlineFontList} from 'ui/common/config';


function getExtName(fileName: string): string {
    return fileName.match(/\.(ttf|otf|woff|woff2)$/i)?.[1]?.toLowerCase() || '';
}

const DisplaySvgList: React.FC<{ svgs: FontSvg[] }> = ({ svgs }) => {
    const importToFigma = (svg: FontSvg): void => {
        pluginAPI.importSvgToFigma({
            id: svg.id,
            name: svg.name,
            svg: svg.svg,
            width: ICON_SIZE,
            height: ICON_SIZE,
        });
    };

    const onDropSvg = (e, svg: FontSvg): void => {
        e.preventDefault();
        e.stopPropagation();
        if (e.view.length === 0) {
            return;
        }
        const clientX = e.clientX || 0;
        const clientY = e.clientY || 0;
        window.parent.postMessage(
            {
                pluginDrop: {
                    clientX,
                    clientY,
                    items: [],
                    dropMetadata: {
                        name: svg.name,
                        svg: svg.svg,
                        width: ICON_SIZE,
                        height: ICON_SIZE,
                    }
                }
            },
            '*'
        );
    };

    return (<>
        {svgs.map((svg) => {
            return (
                <div className={styles.svgItem} key={svg.id}>
                    <div title={svg.name} className={styles.name}>{svg.name}</div>
                    <div draggable
                        onDragEnd={e => onDropSvg(e, svg)}
                        onClick={()=> importToFigma(svg)}
                        title='click or drag into figma'
                        className={styles.svg}
                        dangerouslySetInnerHTML={{__html: svg.svg}} />
                </div>
            );
        })}
    </>);
};

let abortLoadOnlineFont: AbortController | null = null;
const DisplayPickFontFile: React.FC<{onFontParsed: (svgs: FontSvg[]) => void}> = ({onFontParsed}) => {
    const [loadding, setLoading] = React.useState(false);

    const doPickFontFile = (): void => {
        if (loadding) {
            return;
        }
        const input = document.getElementById('pickFontFile') as HTMLInputElement;
        input.click();
    };

    const onPickFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (loadding) {
            return;
        }
        const file = event.target.files?.[0];
        if (file) {
            setLoading(true);
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const buffer = e.target?.result as ArrayBuffer;
                    const extName = getExtName(file.name);
                    if (!extName) {
                        pluginAPI.figmaNotify(`Not support file type ${file.name}`, {timeout: 2000});
                        return;
                    }
                    const svgs = await parseFontFileToSvg(buffer, extName);
                    onFontParsed(svgs);
                }
                catch (err) {
                    pluginAPI.figmaNotify(`Error parsing font file: ${err.message}`, {timeout: 2000});
                }
                finally {
                    setLoading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            console.error('No file selected');
        }
    };

    const loadOnlineFont = async (font: {name: string, url: string}): Promise<void> => {
        try {
            setLoading(true);
            abortLoadOnlineFont = new AbortController();
            const response = await fetch(font.url, {signal: abortLoadOnlineFont.signal});
            if (!response.ok) {
                pluginAPI.figmaNotify(`Failed to load font: ${font.name}`, {timeout: 5000});
                return;
            }
            const buffer = await response.arrayBuffer();
            const extName = getExtName(font.url);
            const svgs = await parseFontFileToSvg(buffer, extName);
            onFontParsed(svgs);
        } catch (e) {
            console.error(`Error loading online font ${font.name}:`, e);
            pluginAPI.figmaNotify(`Error parsing font file: ${e.message}`, {timeout: 2000});
            return;
        }
        finally {
            abortLoadOnlineFont = null;
            setLoading(false);
        }
    };

    return  (<>
        <div className={styles.pickFontFile}>
            <input accept='.ttf,.otf,.woff,.woff2,.svg'
                onChange={onPickFile} style={{display: 'none'}} name='fontFile' id="pickFontFile" type="file"></input>
            <div onClick={doPickFontFile} className={styles.pickFontFileBtn}>
                {loadding ? <LoadingOutlined style={{marginTop: 30}}/> : '+'}
            </div>
            <div className={styles.pickFontFileText}>Click to pick a font file.</div>
            <div className={styles.pickFontFileText}>Support ttf, woff, woff2, font svg.</div>
        </div>
        <div className={styles.onlineFonts}>
            <h4>Use Online Font Icons.</h4>
            <div>
            {onlineFontList.map((font, index) => (
                <Button
                    title={`Load online ${font.name} font`}
                    key={index}
                    type="link"
                    onClick={() => loadOnlineFont(font)}
                >
                    {font.name}
                </Button>
            ))}
            </div>
        </div>
    </>);
};

type PageState = 'pickFile' | 'displaySvgs';

const FontToIconPage: React.FC = () => {
    const pageSize = 1000;
    const [pageState, setPageState] = React.useState('pickFile' as PageState);
    const [searchText, setSearchText] = React.useState('');
    const [svgs, setSvgs] = React.useState<FontSvg[]>([]);
    const [page, setPage] = React.useState(1);
    const svgContainerRef = React.useRef<HTMLDivElement>(null);
    const onPageChange = React.useCallback((page: number) => {
        setPage(page);
        svgContainerRef.current?.scrollTo({
            top: 0,
            behavior: 'auto',
        });
    }, []);

    const resetFontFile = React.useCallback(() => {
        if (pageState === 'displaySvgs') {
            setSvgs([]);
            setSearchText('');
            setPage(1);
            setPageState('pickFile');
        }
        // abort font loading
        else {
            abortLoadOnlineFont?.abort(new Error('Font loading aborted by user'));
            abortLoadOnlineFont = null;
        }
    }, [pageState]);

    const displaySvgs = React.useCallback((svgs: FontSvg[]) => {
        setSvgs(svgs);
        setPageState('displaySvgs');
    }, []);

    const doSearch = React.useCallback(debounce((value: string) => {
        setSearchText(value);
        setPage(1);
        svgContainerRef.current?.scrollTo({
            top: 0,
            behavior: 'auto',
        });
    }, 200), []);

    const filtedSvgs = React.useMemo(() => {
        if (!searchText) {
            return svgs;
        }
        const unicode = new Set(Array.from(searchText).map(char => char.codePointAt(0)));
        return svgs.filter(svg => svg.name.includes(searchText)|| unicode.has(svg.unicode));
    }, [searchText, svgs]);

    return (
        <div className={styles.container}>
            <div className={styles.svgContainer} ref={svgContainerRef}>
            {
                pageState === 'displaySvgs'
                    ? <DisplaySvgList svgs={filtedSvgs.slice((page - 1) * pageSize, page * pageSize)} />
                    : <DisplayPickFontFile onFontParsed={displaySvgs} />
            }
            </div>
            <div className={styles.actions}>
                {pageState === 'displaySvgs' ? <>
                    {filtedSvgs.length > pageSize
                        ? <Pagination
                            simple current={page}
                            pageSize={pageSize}
                            total={filtedSvgs.length}
                            onChange={onPageChange} />
                        : null
                    }
                    <Input
                        placeholder="Search"
                        prefix={<SearchOutlined />}
                        onChange={e => doSearch(e.target.value)}
                        style={{ width: 200, marginRight: 20 }}
                    />
                </> : null}
                <Button shape="circle" title='Reset font file' onClick={resetFontFile} icon={<ReloadOutlined />} />
            </div>
        </div>
    );
};

export default React.memo(FontToIconPage);
