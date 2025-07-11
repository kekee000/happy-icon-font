import React, { useCallback, useState } from 'react';
import styles from './App.module.less';
import {appStateAtom} from 'ui/models/app';
import {PageRole} from './types/app';
import {useAtom} from 'jotai';
import {Tabs} from 'antd';
import {
    FormOutlined,
    FontColorsOutlined,
} from '@ant-design/icons';
import {pluginEvent} from './services/event/event-handler';
import * as store from './store';
import Icon2Font from './pages/icon2font/Icon2Font';
import Font2Icon from './pages/font2icon/Font2Icon';

pluginEvent.registerHandlers({
    async init(data: {initCommand: {command: PageRole};}) {
        const command = data.initCommand.command;
        const pageRole = command === PageRole.Icon2Font
            ? PageRole.Icon2Font
            : PageRole.Font2Icon;
        store.setInited(data);
        store.setCurrentPage(pageRole);
    },
    selectFigmaLayer(data) {
        store.selectedLayerIds(data.ids);
    },
});

const Router: React.FC = React.memo(() => {
    const [appState] = useAtom(appStateAtom);

    // figma 只有一个 iframe，不能用 react router，这里参考社区方案用状态实现 single page 路由
    // https://forum.figma.com/t/how-to-work-with-react-router-dom-in-figma-plugin/2450/4
    switch (appState.currentPage) {
        case PageRole.Icon2Font: {
            return <Icon2Font />;
        }
        case PageRole.Font2Icon: {
            return <Font2Icon />;
        }
        default: {
            return null;
        }
    }
});

const App: React.FC = () => {
    const [appState, setAppState] = useAtom(appStateAtom);
    const [tabsData] = useState([
        {
            key: PageRole.Icon2Font,
            label: `Convert Icon to Font`,
            icon: <FormOutlined />,
        },
        {
            key: PageRole.Font2Icon,
            label: `Import Font Glyphs to Icon`,
            icon: <FontColorsOutlined />,
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
            <div className={styles.appTop}>
                 <Tabs
                    activeKey={appState.currentPage}
                    items={tabsData}
                    onChange={select}
                />
            </div>
            <div className={styles.appPage}>{appState.initCommand ? <Router /> : '初始化中...'} </div>
        </div>
    );
};

export default React.memo(App);
