
export const assetLoader = {
    assets: {},
    load: function(assetsToLoad, callback) {
        let loaded = 0;
        let failed = 0;
        const total = Object.keys(assetsToLoad).length;

        if (total === 0) {
            callback();
            return;
        }

        const checkCompletion = () => {
            if (loaded + failed === total) {
                if (failed === 0) {
                    callback();
                } else {
                    console.error('Some assets failed to load. Game will not start.');
                }
            }
        };

        for (const name in assetsToLoad) {
            const path = assetsToLoad[name];
            if (path.endsWith('.png') || path.endsWith('.jpg')) {
                const img = new Image();
                img.src = path;
                console.log(`Image src set to: ${img.src}`);
                img.onload = () => {
                    this.assets[name] = img;
                    loaded++;
                    console.log(`Successfully loaded image: ${path}`);
                    checkCompletion();
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${path}`);
                    failed++;
                    checkCompletion();
                };
            } else if (path.endsWith('.wav') || path.endsWith('.mp3')) {
                const audio = new Audio();
                audio.src = path;
                console.log(`Attempting to load audio: ${path}`);
                audio.oncanplaythrough = () => {
                    this.assets[name] = audio;
                    loaded++;
                    console.log(`Successfully loaded audio: ${path}`);
                    checkCompletion();
                };
                audio.onerror = () => {
                    console.error(`Failed to load audio: ${path}`);
                    failed++;
                    checkCompletion();
                };
            }
        }
    }
};
