const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");
const cheerio = require("cheerio");

const manifest = {
  id: "community.4khdhub",
  version: "1.0.0",
  name: "4kHDHub Streams",
  description: "Streams scraped from 4khdhub",
  resources: ["stream"],
  types: ["movie", "series"],
  idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
  try {
    const metaRes = await axios.get(`https://v3-cinemeta.strem.io/meta/${type}/${id}.json`);
    const title = metaRes.data?.meta?.name;
    if (!title) return { streams: [] };

    const searchUrl = `https://4khdhub.one/?s=${encodeURIComponent(title)}`;
    const searchRes = await axios.get(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    const $ = cheerio.load(searchRes.data);
    const firstPostLink = $(".post-item a, article a").first().attr("href");
    if (!firstPostLink) return { streams: [] };

    const postRes = await axios.get(firstPostLink, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    const $$ = cheerio.load(postRes.data);      const streams = [];     $$("a[href*='.mp4'], a[href*='drive'], a[href*='download']").each((i, el) => {
      const link = $$(el).attr("href");       const linkText = $$(el).text().trim() || "Watch Link";
      if (link && link.startsWith("http")) {
        streams.push({
          title: `4kHDHub - ${linkText}`,
          url: link
        });
      }
    });

    return { streams };
  } catch (err) {
    return { streams: [] };
  }
});

const port = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port });

