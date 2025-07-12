import { atom } from "jotai";
import { AppState } from "ui/types/app";

/**
 * app 状态
 */
export const appStateAtom = atom({
    initCommand: null,
    currentPage: null,
    selectedLayerIds: [],
    pluginSettings: {
        icon2FontSettings: {
            fontFamily: 'fonteditor',
        },
    },
} as AppState);
