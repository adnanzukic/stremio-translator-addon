const { addonBuilder } = require("stremio-addon-sdk");

const builder = new addonBuilder({
    id: "org.stremio.translator",
    version: "1.0.0",
    name: "Translator Addon by AdnanZukic",
    description: "Prevodi opise filmova i serija na željeni jezik",
    types: ["movie", "series"],
    catalogs: [
        {
            type: "movie",
            id: "translator_catalog",
            name: "Prevedeni filmovi"
        },
        {
            type: "series",
            id: "translator_catalog",
            name: "Prevedene serije"
        }
    ],
    resources: ["meta", "catalog"],
    idPrefixes: ["tt"]
});

const TARGET_LANGUAGE = "hr"; // možeš staviti "bs", "sr", itd.

builder.defineCatalogHandler(({ type, id }) => {
    if (id !== "translator_catalog") return Promise.resolve({ metas: [] });

    // Primjeri filmova - IMDb ID-ovi
    const items = [
        { id: "tt10298840", type: "movie", name: "The Pope's Exorcist" },
        { id: "tt9411972", type: "movie", name: "Jungle Cruise" },
        { id: "tt6723592", type: "movie", name: "Tenet" }
    ];

    return Promise.resolve({ metas: items.filter(item => item.type === type) });
});

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
        console.log("Original:", originalMeta.meta.description);
        console.log("Prevedeno:", translatedDescription);
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
