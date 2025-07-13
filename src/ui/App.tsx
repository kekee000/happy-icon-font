import React, { useCallback, useState } from 'react';
import styles from './App.module.less';
import {appStateAtom} from 'ui/models/app';
import {PageRole} from './types/app';
import {useAtom} from 'jotai';
import {Tabs} from 'antd';
import {
    FormOutlined,
    AppstoreAddOutlined,
} from '@ant-design/icons';
import {pluginEvent} from './services/event/event-handler';
import * as store from './store';
import Icon2Font from './pages/icon2font/Icon2Font';
import Font2Icon from './pages/font2icon/Font2Icon';
import pluginAPI from './services/plugin-api';

pluginEvent.registerHandlers({
    async init(data: {initCommand: {command: PageRole};}) {
        const command = data.initCommand.command;
        const pageRole = command === PageRole.Icon2Font
            ? PageRole.Icon2Font
            : PageRole.Font2Icon;
        store.setInited(data);
        store.setCurrentPage(pageRole);
        const settings = await pluginAPI.getSettings();
        console.debug('plugin settings', settings);
        if (settings?.icon2FontSettings) {
            store.setSettings(settings);
        }
    },
    selectFigmaLayer(data) {
        store.selectedLayerIds(data.ids || []);
    },
});

const App: React.FC = () => {
    const [appState, setAppState] = useAtom(appStateAtom);
    const [tabsData] = useState([
        {
            key: PageRole.Icon2Font,
            label: `Export Figma Icon to Font`,
            icon: <FormOutlined />,
            children: <Icon2Font />,
        },
        {
            key: PageRole.Font2Icon,
            label: `Import Font Glyphs to Figma`,
            icon: <AppstoreAddOutlined />,
            children: <Font2Icon />,
        }
    ]);
    const select = useCallback((type: string) => {
        setAppState(app => {
            return {
                ...app,
                currentPage: type as PageRole ,
            };
        });
    }, []);

    return (
        <div className={styles.app}>
            <Tabs
                activeKey={appState.currentPage}
                items={tabsData}
                onChange={select}
            />
        </div>
    );
};

export default React.memo(App);
