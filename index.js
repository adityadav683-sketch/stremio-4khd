const express = require('express');
const app = express();
const { addonBuilder } = require('stremio-addon-sdk');
const axios = require('axios');
const cheerio = require('cheerio');

app.use(express.static('static'));

const manifest = {
  id: 'community.4khdhub',
  version: '1.0.0',
  name: '4KHDHub Streams',
  description: 'Streams scraped from 4khdhub',
  resources: ['stream'],
  types: ['movie', 'series'],
  idPrefixes: ['tt'],
  catalogs: []
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
  try {
    const metaRes = await axios.get(`https://v3-cinemeta.strem.io/meta/${type}/${id}.json`);
    const title = metaRes.data?.meta?.name;
    if (!title) return { streams: [] };

    const searchUrl = `https://4khdhub.one/?s=${encodeURI(title)}`;
    const searchRes = await axios.get(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const $ = cheerio.load(searchRes.data);
    const firstPostLink = $('.post-item a, article a').first().attr('href');

    if (!firstPostLink) return { streams: [] };

    const postRes = await axios.get(firstPostLink, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const post$ = cheerio.load(postRes.data);
    const streams = [];

    post$('a[href*=".mp4"], a[href*=".mkv"], a[href*="download"]').each((i, el) => {
      const link = post$(el).attr('href');
      const linkText = post$(el).text() || 'Watch Link';

      if (link && link.startsWith('http')) {
        streams.push({
          title: `4khdhub - ${linkText.trim()}`,
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
addonBuilder.getInterface(builder).serveHTTP({ port });
