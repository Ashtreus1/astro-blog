import { c as createComponent, e as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_DUQ9axT8.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_By4gooxz.mjs';
export { renderers } from '../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Blogs = createComponent(($$result, $$props, $$slots) => {
  const pageTitle = "Blogs";
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": pageTitle }, { "default": ($$result2) => renderTemplate(_a || (_a = __template(["  ", `<div class="max-w-7xl mx-auto px-4 py-10"> <h3 class="text-gray-700 text-center text-4xl font-bold mb-8">Articles</h3> <div class="grid grid-cols-1 md:grid-cols-2 gap-6"> <!-- Left card --> <div> <div id="articleCard" class="bg-[#CAF0F8] rounded-[14px] px-8 py-10 text-center shadow-sm transition duration-200 ease-in-out transform hover:-translate-y-[3px] hover:shadow-lg h-[400px] flex flex-col justify-center items-center cursor-pointer" onclick="openFullArticle()"> <img id="articleImg" src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png" alt="Password Reset" class="max-w-[130px] mb-5"> <h6 id="articleTitle" class="text-[#003366] text-[1.35rem] font-semibold mb-2">
Password Reset
</h6> <p id="articleDesc" class="text-[#555] text-[1.08rem] leading-[1.5] max-w-[95%] mx-auto min-h-[60px]">
This teaches you how to reset your password
</p> </div> </div> <!-- Right scrollable list --> <div> <div class="max-h-[400px] overflow-y-auto overflow-x-hidden rounded-[10px] border border-gray-200"> <ul id="articleList" class="space-y-2 p-2"> <li class="list-item active" onclick="selectArticle(this, 'Password Reset', 'This teaches you on how to reset your password', 'https://cdn-icons-png.flaticon.com/512/3064/3064197.png', 'password-reset')">
Password Reset
</li> <li class="list-item" onclick="selectArticle(this, 'Where can I view my ticket history?', 'Steps to access and view all your past support tickets.', 'https://cdn-icons-png.flaticon.com/512/1828/1828961.png', 'ticket-history')">
Where can I view my ticket history?
</li> <li class="list-item" onclick="selectArticle(this, 'What information should I include in my support ticket?', 'Best practices for writing a complete and effective support ticket.', 'https://cdn-icons-png.flaticon.com/512/709/709496.png', 'ticket-information')">
What information should I include in my support ticket?
</li> <li class="list-item" onclick="selectArticle(this, 'Issues that affect usability but don\u2019t block core functions.', 'Learn what issues impact usability and how to address them.', 'https://cdn-icons-png.flaticon.com/512/565/565491.png', 'usability-issues')">
Issues that affect usability but don\u2019t block core functions.
</li> <li class="list-item" onclick="selectArticle(this, 'How do I submit a ticket?', 'Step-by-step guide on submitting a new support ticket.', 'https://cdn-icons-png.flaticon.com/512/190/190411.png', 'submit-ticket')">
How do I submit a ticket?
</li> <li class="list-item" onclick="selectArticle(this, 'Can I update or edit my ticket after submitting it?', 'Learn how to update or add more details to a submitted ticket.', 'https://cdn-icons-png.flaticon.com/512/1250/1250615.png', 'edit-ticket')">
Can I update or edit my ticket after submitting it?
</li> <li class="list-item" onclick="selectArticle(this, 'How do I track the status of my ticket?', 'Ways to monitor the progress and status of your active support tickets.', 'https://cdn-icons-png.flaticon.com/512/709/709690.png', 'track-ticket')">
How do I track the status of my ticket?
</li> <li class="list-item" onclick="selectArticle(this, 'How long does it take to receive a response?', 'Typical response times for submitted tickets.', 'https://cdn-icons-png.flaticon.com/512/992/992651.png', 'response-time')">
How long does it take to receive a response?
</li> <li class="list-item" onclick="selectArticle(this, 'Where can I view my invoices?', 'Learn where to locate and download all your past invoices.', 'https://cdn-icons-png.flaticon.com/512/3135/3135679.png', 'view-invoices')">
Where can I view my invoices?
</li> <li class="list-item" onclick="selectArticle(this, 'How do I update my payment method?', 'Guide to updating your billing and payment information.', 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png', 'update-payment')">
How do I update my payment method?
</li> </ul> </div> </div> </div> </div> <script src="/scripts/articles.js" defer><\/script> `])), maybeRenderHead()) })}`;
}, "/home/keiru/Documents/chatdesk/src/pages/blogs.astro", void 0);

const $$file = "/home/keiru/Documents/chatdesk/src/pages/blogs.astro";
const $$url = "/blogs";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Blogs,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
