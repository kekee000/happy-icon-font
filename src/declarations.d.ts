// / <reference types="react" />
// / <reference types="react-dom" />

declare module '*.module.css' {
    const classes: { readonly [key: string]: string };
    export default classes;
}

declare module '*.module.less' {
    const classes: { [className: string]: string };
    export default classes;
}

declare module '*.bmp' {
    const src: string;
    export default src;
}

declare module '*.gif' {
    const src: string;
    export default src;
}

declare module '*.png' {
    const src: string;
    export default src;
}

declare module '*.svg' {
    import { ReactElement, SVGProps } from 'react';

    export const ReactComponent: (props: SVGProps<SVGElement>) => ReactElement;
    const src: string;
    export default src;
}
