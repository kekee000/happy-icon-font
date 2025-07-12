declare namespace HappyIconFont {
    export interface PluginAPI {
        selectNodes(ids: string[]): Promise<void>;
        getSelectionSVG(): Promise<Array<{name: string, svg: string}>>;
        figmaNotify(message: string, options?: {}): void;
        openExternal(url: string): void;
        setSettings(settings: PluginSettings): Promise<void>;
        getSettings(): Promise<PluginSettings | null>;
    }

    export interface PluginSettings {
        icon2FontSettings: {
            fontFamily: string;
        },
        font2IconSettings: any;
    }
}

type PromisyAPI<T> = {
    [P in keyof T]: T[P] extends (...args: any[]) => any
        ? (...args: Parameters<T[P]>) => (ReturnType<T[P]> extends Promise<any> ? ReturnType<T[P]> : Promise<ReturnType<T[P]>>)
        : T[P];
};
