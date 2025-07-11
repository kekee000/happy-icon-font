import { atom } from "jotai";
import { AppState } from "ui/types/app";

/**
 * app 状态
 */
export const appStateAtom = atom({
    initCommand: null,
    currentPage: null,
    fileKey: '',
    figmaUser: {
        id: '',
        name: '',
        photoURL: '',
        color: '',
    },
    selectedLayerSnapshots: null,
    selectedLayerIds: [],
} as AppState);
