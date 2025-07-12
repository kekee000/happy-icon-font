import React, { useEffect } from 'react';
import styles from './Font2Icon.module.less';
import { useAtom } from 'jotai';
import { appStateAtom } from 'ui/models/app';

const FontToIconPage: React.FC = () => {
    const [appState] = useAtom(appStateAtom);
    return (
        <div className={styles.container}>
            Font2Icon {appState.currentPage}
        </div>
    );
};

export default React.memo(FontToIconPage);
