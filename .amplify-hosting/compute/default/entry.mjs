import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_Bq57-Dls.mjs';
import { manifest } from './manifest_C8S9c0Su.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/bot-reply.astro.mjs');
const _page2 = () => import('./pages/blogs/_slug_.astro.mjs');
const _page3 = () => import('./pages/blogs.astro.mjs');
const _page4 = () => import('./pages/chats/_ticketid_.astro.mjs');
const _page5 = () => import('./pages/support.astro.mjs');
const _page6 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/bot-reply.ts", _page1],
    ["src/pages/blogs/[slug].astro", _page2],
    ["src/pages/blogs.astro", _page3],
    ["src/pages/chats/[ticketId].astro", _page4],
    ["src/pages/support.astro", _page5],
    ["src/pages/index.astro", _page6]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "client": "file:///home/keiru/Documents/chatdesk/.amplify-hosting/static/",
    "server": "file:///home/keiru/Documents/chatdesk/.amplify-hosting/compute/default/",
    "host": false,
    "port": 3000,
    "assets": "_astro"
};

const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { pageMap };
