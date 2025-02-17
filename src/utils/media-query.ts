const matchesMediaQuery = (query: string) => {
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
        return Boolean(window.matchMedia(query).matches);
    }
    return false;
};

const matchesDarkTheme = () => matchesMediaQuery('(prefers-color-scheme: dark)');
const matchesLightTheme = () => matchesMediaQuery('(prefers-color-scheme: light)');

const isColorSchemeSupported = matchesDarkTheme() || matchesLightTheme();

export function isSystemDarkModeEnabled() {
    if (!isColorSchemeSupported) {
        return false;
    }
    return matchesDarkTheme();
}
