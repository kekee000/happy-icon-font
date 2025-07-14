import {atom} from "jotai";
import {AppState} from "ui/types/app";

/**
 * ui app state
 */
export const appStateAtom = atom({
    initCommand: null,
    currentPage: null,
    selectedLayerIds: [],
    pluginSettings: {
        icon2FontSettings: {
            fontFamily: 'iconfont',
        },
    },
} as AppState);
