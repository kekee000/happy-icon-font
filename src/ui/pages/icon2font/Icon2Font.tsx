import React, { useEffect } from 'react';
import styles from './Icon2Font.module.less';
import { useAtom } from 'jotai';
import { appStateAtom } from 'ui/models/app';

const CheckPage: React.FC = () => {
    const [appState] = useAtom(appStateAtom);

    return (
        <div className={styles.container}>
            Icon2Font {appState.selectedLayerIds}
        </div>
    );
};

export default React.memo(CheckPage);
