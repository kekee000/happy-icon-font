declare namespace HappyIconFont {
    export interface PluginAPI {
        selectNodes(ids: string[]): Promise<void>;
        getSelection(): string[];
        figmaNotify(message: string, options?: {}): void;
        getSelectionSnapshots(): Promise<string[]>;
        openExternal(url: string): void;
    }
}

type PromisyAPI<T> = {
    [P in keyof T]: T[P] extends (...args: any[]) => any
        ? (...args: Parameters<T[P]>) => (ReturnType<T[P]> extends Promise<any> ? ReturnType<T[P]> : Promise<ReturnType<T[P]>>)
        : T[P];
};