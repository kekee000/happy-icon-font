import React, { useEffect, useState } from 'react';
import styles from './Icon2Font.module.less';
import { useAtom } from 'jotai';
import { appStateAtom } from 'ui/models/app';
import pluginAPI from 'ui/services/plugin-api';
import { Button, Form, Input, Modal } from 'antd';
import { DownloadOutlined, EditOutlined, SettingFilled } from '@ant-design/icons';
import { createFontFromSvg, writeFontZip } from 'ui/font';


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

    const onOk = () => {
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
                <Form.Item label="FontFamily" name="fontFamily">
                    <Input placeholder="input font family" />
                </Form.Item>
            </Form>
      </Modal>
    );
}

const Icon2FontPage: React.FC = () => {
    const [appState] = useAtom(appStateAtom);
    const [showSettings, setShowSettings] = useState(false);

    const [svgs, setSvgs] = React.useState<Array<{name: string, svg: string}>>([]);
    useEffect(() => {
        (async() => {
            if (appState.selectedLayerIds?.length) {
                const svgs = await pluginAPI.getSelectionSVG();
                setSvgs(svgs);
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
            pluginAPI.figmaNotify(`Error downloading font: ${fontFamily}`, {timeout: 2000});
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
               {svgs.map(svg => {
                    return (
                        <div className={styles.svgItem} key={svg.name}>
                            <div title={svg.name} className={styles.name}>{svg.name}</div>
                            <div className={styles.svg} dangerouslySetInnerHTML={{__html: svg.svg}} />
                        </div>
                    );
                })}
            </div>
            <div className={styles.actions}>
                <Button type="primary" title='Download ttf, woff2 and icon examples' onClick={downloadFont} shape="round" icon={<DownloadOutlined />} size="middle">Download</Button>
                <Button type="default" title='Edit ttf font with online FontEditor' shape="round" icon={<EditOutlined />} size="middle">Edit Font Online</Button>
                <Button shape="circle" title='Font settings' onClick={openFontSettings} icon={<SettingFilled />} />
            </div>
            <SettingsDialog show={showSettings} onOK={onSettingsOk} onCancel={onSettingsCancel} />
        </div>
    );
};

export default React.memo(Icon2FontPage);
