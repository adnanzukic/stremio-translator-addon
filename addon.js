// addon.js
const { addonBuilder } = require("stremio-addon-sdk");

const builder = new addonBuilder({
    id: "org.stremio.translator",
    version: "1.0.0",
    name: "Translator Addon by AdnanZukic",
    description: "Prikazuje prevedene opise filmova i serija iz Cinemete",
    types: ["movie", "series"],
    catalogs: [
        {
            type: "movie",
            id: "cinemeta-translated-movie",
            name: "Prevedeni Filmovi",
            extra: [{ name: "search" }, { name: "genre" }, { name: "skip" }]
        },
        {
            type: "series",
            id: "cinemeta-translated-series",
            name: "Prevedene Serije",
            extra: [{ name: "search" }, { name: "genre" }, { name: "skip" }]
        }
    ],
    resources: ["catalog", "meta"],
    idPrefixes: ["tt"]
});

const TARGET_LANGUAGE = "hr";

const translateText = async (text) => {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${TARGET_LANGUAGE}&dt=t&q=${encodeURIComponent(text)}`);
    const json = await res.json();
    return json[0].map(x => x[0]).join("");
};

builder.defineCatalogHandler(async ({ type, id, extra }) => {
    const realCatalogId = id.includes("movie") ? "top" : "top";
    const queryParts = [];
    if (extra?.search) queryParts.push(`search=${encodeURIComponent(extra.search)}`);
    if (extra?.genre) queryParts.push(`genre=${encodeURIComponent(extra.genre)}`);
    if (extra?.skip) queryParts.push(`skip=${encodeURIComponent(extra.skip)}`);
    const query = queryParts.length ? `?${queryParts.join("&")}` : "";

    const res = await fetch(`https://v3-cinemeta.strem.io/catalog/${type}/${realCatalogId}.json${query}`);
    const json = await res.json();

    return {
        metas: json.metas
    };
});

builder.defineMetaHandler(async ({ type, id }) => {
    const url = `https://v3-cinemeta.strem.io/meta/${type}/${id}.json`;
    const response = await fetch(url);
    const originalMeta = await response.json();

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
