import React, { useEffect, useState } from 'react';
import styles from './Icon2Font.module.less';
import { useAtom } from 'jotai';
import { appStateAtom } from 'ui/models/app';
import pluginAPI from 'ui/services/plugin-api';
import { Button, Form, Input, Modal } from 'antd';
import { DownloadOutlined, EditOutlined, SettingFilled } from '@ant-design/icons';
import { createFontFromSvg, getOnlineConnectUrl, getOnlineEditorUrl, onlineEditorBase, writeFontZip } from 'ui/font';
import { isInFigmaApp } from 'ui/common/utils';
import { set } from 'lodash-es';

function downloadBlob(buffer: BlobPart, filename: string) {
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

const SettingsDialog: React.FC<{
    show: boolean;
    onOK: () => any;
    onCancel: () => any;
}> = (props: {show: boolean, onOK: () => any, onCancel: () => any}) => {
    const [appState, setAppState] = useAtom(appStateAtom);
    const [form] = Form.useForm();
    const formItemLayout = {
        labelCol: { span: 4 },
        wrapperCol: { span: 14 },
    };

    const onOk = async () => {
        try {
            await form.validateFields();
        }
        catch (e) {
            return;
        }
        const settings = form.getFieldsValue();
        const pluginSettings = {
            ...appState.pluginSettings,
            icon2FontSettings: {
                fontFamily: settings.fontFamily || 'fonteditor',
            }
        };
        setAppState({
            ...appState,
            pluginSettings,
        });
        pluginAPI.setSettings(pluginSettings);
        props.onOK();
    };

    return (
        <Modal title="Export Font Settings" open={props.show} onOk={onOk} onCancel={props.onCancel}>
            <Form
                {...formItemLayout}
                layout="horizontal"
                form={form}
                initialValues={{ fontFamily: appState.pluginSettings.icon2FontSettings.fontFamily }}
                >
                <Form.Item label="FontFamily"
                    name="fontFamily"
                    rules={[{required: true, pattern: /^[a-zA-Z0-9_-]+$/g, message: 'Font family should only contain letters, numbers, \'-\', \'_\'.'}, {type: 'string', max: 100, min: 2}]}>
                    <Input placeholder="input font family" />
                </Form.Item>
            </Form>
      </Modal>
    );
}

const isInFigma = false; //isInFigmaApp();

const Icon2FontPage: React.FC = () => {
    const [appState] = useAtom(appStateAtom);
    const [showSettings, setShowSettings] = useState(false);

    const [svgs, setSvgs] = React.useState<Array<HappyIconFont.SVGData>>([]);
    useEffect(() => {
        (async() => {
            if (appState.selectedLayerIds.length) {
               try {
                    const svgs = await pluginAPI.getSelectionSVG();
                    setSvgs(svgs);
               }
               catch (e) {
                    setSvgs([]);
               }
            }
            else {
                setSvgs([]);
            }
        })();
    }, [appState.selectedLayerIds]);

    const downloadFont = async () => {
        if (!svgs.length) {
            pluginAPI.figmaNotify('No SVGs selected to download', {timeout: 2000});
            return;
        }
        const fontFamily = appState.pluginSettings.icon2FontSettings.fontFamily || 'fonteditor';
        try {
            const font = createFontFromSvg(svgs, fontFamily);
            const fontBuffer = await writeFontZip(font, fontFamily);
            downloadBlob(fontBuffer, `${fontFamily}.zip`);

        } catch (error) {
            console.error('Error creating font', error);
            pluginAPI.figmaNotify(`Error downloading font: ${fontFamily}`, {timeout: 2000});
        }
    };

    const editFontOnline = async () => {
        const fontFamily = appState.pluginSettings.icon2FontSettings.fontFamily || 'fonteditor';
        if (isInFigma) {
            pluginAPI.openExternal(getOnlineEditorUrl());
            return;
        }

        let loadedListener: (event: MessageEvent) => void | null = null;
        try {
            const editorWin = window.open(getOnlineConnectUrl(), 'fonteditor');
            await new Promise((resolve) => {
                window.addEventListener('message', loadedListener = (event: MessageEvent) => {
                    if (onlineEditorBase.includes(event.origin) && event.data?.type === 'loaded') {
                        resolve(true);
                    }
                });
                setTimeout(() => {
                    console.warn('Timeout waiting for online editor to load');
                    resolve(false);
                }, 3000);
            });

            const font = createFontFromSvg(svgs, fontFamily);
            editorWin.postMessage({
                type: 'create-font',
                data: {
                    fontFamily: appState.pluginSettings.icon2FontSettings.fontFamily || 'fonteditor',
                    ttfObject: font.get(),
                }
            },  '*');
        }
        catch (e) {
            console.error('Error creating font for online editor', e);
            pluginAPI.figmaNotify(`Error creating font for online editor: ${fontFamily}`, {timeout: 2000});
        }
        finally {
            loadedListener && window.removeEventListener('message', loadedListener);
            loadedListener = null;
        }
    };

    const openFontSettings = () => {
        setShowSettings(true);
    };

    const onSettingsOk = () => {
        setShowSettings(false);
    };

    const onSettingsCancel = () => {
        setShowSettings(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.svgContainer}>
            {
                svgs.length ? svgs.map(svg => {
                    return (
                        <div className={styles.svgItem} key={svg.id}>
                            <div title={svg.name} className={styles.name}>{svg.name}</div>
                            <div className={styles.svg} dangerouslySetInnerHTML={{__html: svg.svg}} />
                        </div>
                    );
                })
                : <div className={styles.svgEmpty}>Please Select Icons in Figma Canvas.</div>
            }
            </div>
            <div className={styles.actions}>
                <Button type="primary" title='Download ttf, woff2 and icon examples' onClick={downloadFont} shape="round" icon={<DownloadOutlined />} size="middle">Download</Button>
                <Button type="default" title='Edit ttf font with online FontEditor' onClick={editFontOnline} shape="round" icon={<EditOutlined />} size="middle">Edit Font Online</Button>
                <Button shape="circle" title='Font settings' onClick={openFontSettings} icon={<SettingFilled />} />
            </div>
            <SettingsDialog show={showSettings} onOK={onSettingsOk} onCancel={onSettingsCancel} />
        </div>
    );
};

export default React.memo(Icon2FontPage);
