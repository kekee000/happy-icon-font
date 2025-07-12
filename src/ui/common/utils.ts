
/**
 * Checks if the current environment is Figma app.
 * @returns
 */
export function isInFigmaApp(): boolean {
    return navigator.userAgent.includes('Figma/');
}