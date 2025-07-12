import getLogger from '../common/logger';
import injectEditorServices from './editor';

figma.showUI(__html__);
figma.ui.resize(500, 600);

(() => {
    if (figma.editorType === 'figma') {
        const logger = getLogger('figma-plugin');
        logger.info('init sandbox of figma type');
        injectEditorServices();
    }
    else {
        const logger = getLogger('figmajam-plugin');
        logger.info('init sandbox of figmajam type');
    }
})();
