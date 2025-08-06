import { c as createComponent, e as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DUQ9axT8.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout, R as RequestTicketModal } from '../chunks/BaseLayout_By4gooxz.mjs';
import { jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
export { renderers } from '../renderers.mjs';

function HeroImage() {
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e) => {
      setIsLargeScreen(e.matches);
    };
    setIsLargeScreen(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);
  if (!isLargeScreen) return null;
  return /* @__PURE__ */ jsx("div", { className: "w-full md:w-1/2 mt-12 md:mt-0 flex justify-center", children: /* @__PURE__ */ jsx("img", { src: "/image-hero.png", alt: "Event Banner", className: "max-w-full h-auto" }) });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const pageTitle = "Home";
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": pageTitle }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col md:flex-row items-center justify-center md:justify-between min-h-screen px-8"> <!-- Content Column --> <div class="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-4 ml-20"> <h1 class="text-4xl font-bold text-gray-900">
Need Help? We’re Here for You
</h1> <p class="text-md text-gray-600 max-w-md">
Our dedicated support team is available 24/7 to assist you with any questions or concerns.
</p> <div class="flex justify-center md:justify-start w-full"> ${renderComponent($$result2, "RequestTicketModal", RequestTicketModal, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/react-components/RequestTicketModal", "client:component-export": "default" })} </div> </div> ${renderComponent($$result2, "HeroImage", HeroImage, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/react-components/HeroImage", "client:component-export": "default" })} </div> ` })}`;
}, "/home/keiru/Documents/chatdesk/src/pages/index.astro", void 0);

const $$file = "/home/keiru/Documents/chatdesk/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
