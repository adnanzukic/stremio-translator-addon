const { addonBuilder } = require("stremio-addon-sdk");


const builder = new addonBuilder({
    id: "org.stremio.translator",
    version: "1.0.0",
    name: "Translator Addon",
    description: "Prevodi opise filmova i serija na željeni jezik",
    types: ["movie", "series"],
    catalogs: [],
    resources: ["meta"],
});

const TARGET_LANGUAGE = "hr"; // možeš staviti "bs", "sr", "en", itd.

builder.defineMetaHandler(async ({ type, id }) => {
    const url = `https://v3-cinemeta.strem.io/meta/${type}/${id}.json`;
    const response = await fetch(url);
    const originalMeta = await response.json();

    const translateText = async (text) => {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${TARGET_LANGUAGE}&dt=t&q=${encodeURIComponent(text)}`);
        const json = await res.json();
        return json[0].map(x => x[0]).join("");
    };

    let translatedDescription = originalMeta.meta.description;
    try {
        translatedDescription = await translateText(originalMeta.meta.description);
    } catch (e) {
        console.error("Prevod nije uspio:", e.message);
    }

    return {
        meta: {
            ...originalMeta.meta,
            description: translatedDescription
        }
    };
});

module.exports = builder.getInterface();
