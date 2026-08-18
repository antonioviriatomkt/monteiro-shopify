// Builds the consolidated About Us template (About + Mission/Vision/Values +
// Quality + Sustainability + R&D) and writes templates/page.about-us.json.
// Using JS so JSON.stringify handles all HTML escaping (cert links etc.).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../theme/templates/page.about-us.json', import.meta.url));

const sections = {
  hero_about: {
    type: 'image-with-text-overlay',
    name: 'Hero',
    custom_css: [],
    settings: {
      image: 'shopify://shop_images/MONTEIRO_FABRICS_1_SITE_TEST-10.jpg',
      height: 'fixed', height_desktop: 450, height_mobile: 400,
      subheading: 'Manufacturer of coated fabric since 1967',
      title: 'About Us', title_size: 46, title_width: 14, heading_h1: true,
      text: '<p>Made in Portugal</p>', enlarge_text: false, button_label: '', image_link: '',
      overlay_position: 'position--hcenter position--vcenter',
      full_width: true, mobile_overlay_under: false, overlay_style_tint: true,
    },
  },
  intro_legacy: {
    type: 'rich-text', name: 'Who we are', custom_css: [],
    settings: {
      subheading: '', title: '', title_size: 40, title_width: 24, heading_h1: false,
      text: `<p>Our unique experience and know how, along with the combination of traditional manufacturing with updated technology, enables us to be present in demanding markets around the world. Going on our fourth generation as a family business, we develop fabrics with outstanding design, function and performance.</p>`,
      image_width: 150, button_label: '', button_link: '', button_style: 'link',
      text_alignment: 'center', enlarge_text: true, full_width: false, no_padding_bottom: true,
      color_scheme: 'standard', color_bg: '', color_text: '',
    },
  },
  video_brand: {
    type: 'video',
    settings: {
      video_shopify: 'shopify://files/videos/Monteiro fabrics 2025- low res.mp4',
      video_external: '',
      image: 'shopify://shop_images/MONTEIRO_FABRICS_1_SITE_TEST-6_ec3cf059-f758-47be-8ead-ca83060607d7.jpg',
      subheading: 'see how far we’ve come — and how far we’re going',
      video_title: '', title_size: 60, title_width: 14, heading_h1: false,
      text: `<p>Take 2 minutes to understand why some of the world’s leading brands trust Monteiro Fabrics</p>`,
      enlarge_text: false, overlay_position: 'position--hcenter position--vcenter',
      full_width: false, overlay_style_tint: true,
    },
  },
  gallery_heritage: {
    type: 'gallery',
    blocks: {
      g1917: { type: 'image', settings: { image: 'shopify://shop_images/monteiro_fabrics_1.jpg', video_external: '', enlarge_image: false, subheading: 'The Monteiro Ribas group is a family owned group founded in 1917', title: '1917', title_width: 12, heading_h1: false, button_label: '', link: '', text_alignment: 'position--left position--bottom' } },
      g1950: { type: 'image', settings: { image: 'shopify://shop_images/History1.jpg', video_external: '', enlarge_image: true, subheading: "It started as a tannery which became a market leader in the 1950's.", title: '1950', title_width: 12, heading_h1: false, button_label: '', link: '', text_alignment: 'position--left position--bottom' } },
      g1960: { type: 'image', settings: { image: 'shopify://shop_images/monteiro_fabrics_12.jpg', video_external: '', enlarge_image: true, subheading: "In the 1960's the group started diversifying and expanding its range.", title: '1960', title_width: 12, heading_h1: false, button_label: '', link: '', text_alignment: 'position--left position--bottom' } },
      g1970: { type: 'image', settings: { image: 'shopify://shop_images/monteiro_fabrics_13.jpg', video_external: '', enlarge_image: false, subheading: 'The production of PU coated fabrics began.', title: '1970', title_width: 12, heading_h1: false, button_label: '', link: '', text_alignment: 'position--left position--bottom' } },
    },
    block_order: ['g1917', 'g1950', 'g1960', 'g1970'],
    settings: { title: 'A lifetime company', grid: 4, desktop_image_height: 600, mobile_image_height: 440, title_size: 40, enable_margin: true, full_width: true, enable_carousel: true, overlay_style_tint: true, alternate_bg_color: false },
  },
  worldwide: {
    type: 'image-with-text',
    settings: {
      subheading: 'Global network', title: 'Worldwide', title_size: 28, title_width: 12,
      text: `<p>We are here, around the globe, with a strong global network, we try to be strategically positioned in various countries, spanning across continents. With a commitment to quality, innovation, and customer satisfaction, we want to continue to expand, forging new partnerships and establishing a strong brand presence in every corner of the world 🌏</p>`,
      button_label: '', button_link: '', text_alignment: 'left', text_width: 50, button_style: 'auto',
      image: 'shopify://shop_images/monteiro_ribas.png', image_width: 80, image_position: 'right',
      media_size: 'cover', color_scheme: 'standard', color_bg: '', color_text: '',
    },
  },
  purpose: {
    type: 'rich-text', name: 'Purpose', custom_css: [],
    settings: {
      subheading: 'What drives us', title: 'Mission, vision & values', title_size: 40, title_width: 28, heading_h1: false,
      text: `<p><strong>The purpose of Monteiro Fabrics </strong>is to produce and sell coated fabrics with a focus on excellence, following the motto of doing more and doing it better. We strive to offer a product that has an impact on our customers' business, inspires them, contributes decisively to their success, and makes them see MF as an everyday partner and facilitator.</p><p>There are four key traits ingrained in our DNA that set us apart in all our work: Design, Innovation, Sustainability, Service. We prioritize creativity, constantly seeking innovative solutions in both our products and services. We maintain a proactive attitude towards the market, tailoring our approach to each individual client and the society we are a part of. Throughout all of this, we remain committed to protecting the environment and utilizing the resources the world provides us.</p>`,
      image_width: 120, button_label: '', button_link: '', button_style: 'auto',
      text_alignment: 'center', enlarge_text: false, full_width: false, no_padding_bottom: true,
      color_scheme: 'standard', color_bg: '', color_text: '',
    },
  },
  mission_vision: {
    type: 'testimonials',
    blocks: {
      mission: { type: 'testimonial', settings: { star_rating: 0, title: 'Mission', text: `<p>To produce coated fabrics of excellence that are innovative, safe, and sustainable, with a strong focus on the customer, our people, and respect for the environment.</p>`, button_label: '', link: '', image1: '', image1_caption: '', image2_caption: '', layout: 'left' } },
      vision: { type: 'testimonial', settings: { star_rating: 0, title: 'Vision', text: `<p>To be the European reference in the production of coated technical fabrics, with a strong focus on quality, service, functional innovation, and environmental responsibility.</p>`, button_label: '', link: '', image1: '', image1_caption: '', image2_caption: '', layout: 'right' } },
    },
    block_order: ['mission', 'vision'],
    custom_css: ['p {text-align: left;}', 'h3 {text-align: left;}'],
    settings: { title: '', button_style: 'primary', alternate_bg_color: false },
  },
  values: {
    type: 'accordions',
    blocks: {
      v1: { type: 'accordion', settings: { icon: 'eye', title: 'Focus on the customer', text: `<p>We place the customer at the heart of all our decisions, striving to understand their needs and anticipate expectations. The relationship of trust we build is the foundation of our sustainable growth.</p>`, open: false } },
      v2: { type: 'accordion', settings: { icon: 'heart', title: 'Caring for our people', text: `<p>We believe our success begins with our people. We foster an environment in which every employee feels valued, respected, and supported in their personal and professional development.</p>`, open: false } },
      v3: { type: 'accordion', settings: { icon: 'silhouette', title: 'We are a team', text: `<p>We work collaboratively, sharing responsibilities and successes. It is through the union of skills, ideas, and perspectives that we find the best solutions.</p>`, open: false } },
      v4: { type: 'accordion', settings: { icon: 'check_mark', title: 'Making things happen', text: `<p>We take a proactive, results-oriented approach. We make commitments, face challenges, and deliver—always with rigor and a strong sense of responsibility.</p>`, open: false } },
      v5: { type: 'accordion', settings: { icon: 'lock', title: 'Safety above all & respect for the environment', text: `<p>Ensuring the safety of our employees and the communities in which we operate is a non-negotiable priority. We act with environmental responsibility, adopting practices that protect the planet and promote a more sustainable future.</p>`, open: false } },
    },
    block_order: ['v1', 'v2', 'v3', 'v4', 'v5'],
    custom_css: ['.h2 {text-align: center; padding-right: 0px;}'],
    settings: { title: 'Our values', alternate_bg_color: true, view_all_page: '' },
  },
  qs_head: {
    type: 'rich-text', name: 'Quality & sustainability', custom_css: [],
    settings: {
      subheading: 'Quality & sustainability', title: 'Excellence, responsibly made', title_size: 40, title_width: 28, heading_h1: false,
      text: `<p>An integrated Quality and Environment management system runs through everything we make — certified, tested, and continuously improved.</p>`,
      image_width: 120, button_label: '', button_link: '', button_style: 'auto',
      text_alignment: 'center', enlarge_text: false, full_width: false, no_padding_bottom: true,
      color_scheme: 'standard', color_bg: '', color_text: '',
    },
  },
  quality_certs: {
    type: 'rich-text', name: 'Quality & certificates', custom_css: [],
    settings: {
      subheading: '', title: '', title_size: 40, title_width: 40, heading_h1: false,
      text: `<p>At Monteiro Fabrics, quality is at the core of everything we do. We are committed to upholding the highest standards in quality, environmental responsibility, and continuous improvement through our Integrated Quality and Environment Management System. Our systems adhere to the esteemed ISO 9001:2015 and ISO 14001:2015 standards, reflecting our dedication to ensuring quality, environmental protection, and ongoing enhancements. Download all our guides, manual and certificates.</p><p><strong>Certificates</strong></p><p><a href="https://cdn.shopify.com/s/files/1/0711/9801/5791/files/BPA-93-1.PDF?v=1772211075" target="_blank" title="Monteiro Fabrics Sanitized® Seal of Confidence">Sanitized® Seal of Confidence</a></p><p><a href="https://cdn.shopify.com/s/files/1/0711/9801/5791/files/Certificados_ISO14001_EN.pdf?v=1772211073" target="_blank" title="Monteiro Fabric's ISO14001 Certificate English">ISO14001 (EN)</a></p><p><a href="https://cdn.shopify.com/s/files/1/0711/9801/5791/files/Certificados_ISO9001_EN.pdf?v=1772211073" target="_blank" title="Monteiro Fabrics's ISO9001 Certificate English">ISO9001 (EN)</a></p><p><strong>Management Policy</strong></p><p><a href="https://cdn.shopify.com/s/files/1/0711/9801/5791/files/Politica_de_Gestao.pdf?v=1773156164" target="_blank" title="Management Policy 2025">Management Policy 2025 (PT)</a></p>`,
      image_width: 120, button_label: '', button_link: '', button_style: 'auto',
      text_alignment: 'left', enlarge_text: false, full_width: false, no_padding_bottom: false,
      color_scheme: 'standard', color_bg: '', color_text: '',
    },
  },
  quality_reach: {
    type: 'image-with-text',
    settings: {
      subheading: 'Compliance', title: 'REACH & Animal Free', title_size: 28, title_width: 12,
      text: `<p>We prioritize environmental and human well-being by diligently adhering to the REACH regulation. Our vigilance in considering and addressing the risks associated with specific chemical substances showcases our dedication to responsible manufacturing.</p><p>Additionally, we proudly declare that our products carry the Animal Free label, reflecting our ethical stance and dedication to animal welfare. We believe in providing you with products that are not only of superior quality but also aligned with values that matter.</p>`,
      button_label: '', button_link: '', text_alignment: 'left', text_width: 50, button_style: 'auto',
      image: 'shopify://shop_images/certificaions-monteiro-fabrics.jpg', image_width: 80, image_position: 'right',
      media_size: 'contain', color_scheme: 'standard', color_bg: '', color_text: '',
    },
  },
  quality_testing: {
    type: 'image-with-text',
    settings: {
      subheading: 'Tested & warranted', title: 'Quality you can trust', title_size: 28, title_width: 12,
      text: `<p>Our products stand testimony to our unwavering commitment to quality. From durability to comfort, we prioritize every aspect to ensure you receive a product that not only looks beautiful but also lasts with proper maintenance and cleaning. We provide assurance in the form of a warranty, believing in the longevity and timeless appeal of our offerings.</p><p><strong>To further validate our commitment, our products undergo rigorous testing, both internally within our state-of-the-art laboratory and externally in certified third-party laboratories. This ensures that our products consistently meet the expected quality benchmarks.</strong></p>`,
      button_label: '', button_link: '', text_alignment: 'left', text_width: 50, button_style: 'auto',
      image: 'shopify://shop_images/M_R161.jpg', image_width: 80, image_position: 'left',
      media_size: 'cover', color_scheme: 'standard', color_bg: '', color_text: '',
    },
  },
  sustain_pillars: {
    type: 'text-columns-with-images',
    blocks: {
      sp1: { type: 'text_block', settings: { enable_image: true, image: 'shopify://shop_images/M_R015.jpg', image_width: 700, title: 'Responsible care', text: `<p>Our people are our most important asset, our heart: it's their enthusiasm, dedication and technical skills that bring us to the front line of service and innovation.</p>`, button_label: '', link: '' } },
      sp2: { type: 'text_block', settings: { enable_image: true, image: 'shopify://shop_images/green-plants-background.jpg', image_width: 700, title: 'Environment', text: `<p>As a fully integrated company, with all production steps on our premises, we are continuously searching to minimize our environmental impact. Focusing on cleaner and more efficient manufacturing processes, we installed a fume filtration central, more efficient lighting and insulation systems, closed circuit heating systems as well as a waste management program.</p>`, button_label: '', link: '' } },
      sp3: { type: 'text_block', settings: { enable_image: true, image: 'shopify://shop_images/LAB-FABRICS-1.jpg', image_width: 700, title: 'Economic & quality', text: `<p>We truly believe that sustainability is a vehicle for economic growth as well as a guarantee of business continuity. All the care we take through the supply chain together with a quality management system (certified by ISO 9001), will bring satisfaction to our shareholders, employees and community.</p>`, button_label: '', link: '' } },
      sp4: { type: 'text_block', settings: { enable_image: true, image: 'shopify://shop_images/MONTEIRO-FABRICS-1-SITE-TEST-6.jpg', image_width: 700, title: 'Scope & management policy', text: `<p>Scope: Development, production and commercialization of coated fabrics. Please contact us <a href="https://www.monteirofabrics.com/pages/contact" title="Contact Monteiro Fabrics"><strong>here</strong></a> to know more about our Management Policy.</p>`, button_label: '', link: '' } },
      sp5: { type: 'text_block', settings: { enable_image: true, image: 'shopify://shop_images/MANTA_-_02597.jpg', image_width: 700, title: 'Certificates', text: `<p>Our management system is ISO 9001:2015 and ISO 14001:2015 certified by TÜVRheinland. Please see <a href="https://www.dropbox.com/scl/fo/2m7af4k6n9yb6p7idjwrh/h?rlkey=lsaaoflew8bmz9s2xf0jurcwm&st=e119qzui&dl=0" target="_blank" title="Monteiro Fabrics Certificates">here </a>our Certificates 9001:2015 and 14001:2015.</p>`, button_label: '', link: '' } },
      sp6: { type: 'text_block', settings: { enable_image: true, image: 'shopify://shop_images/bioshoes4all.jpg', image_width: 700, title: 'Bioshoes4all', text: `<p>Integrated Project – Innovation and Training of the footwear sector for a sustainable bioeconomy. Monteiro Fabrics is one of the 70 co-promoters of this project, sharing the vision of a transition from the footwear industry to sustainable bioeconomy. Check out the <a href="https://cdn.shopify.com/s/files/1/0711/9801/5791/files/ficha_projeto_bioshoe4all.pdf?v=1763214717" target="_blank" title="Bioshoes4all project file">Project file here.</a></p>`, button_label: '', link: '' } },
    },
    block_order: ['sp1', 'sp2', 'sp3', 'sp4', 'sp5', 'sp6'],
    settings: { title: 'We take responsibility for resource sustainability', text_alignment: 'left', button_style: 'link', media_shape: 'portrait', alternate_bg_color: false, full_width: false },
  },
  sustain_articles: {
    type: 'featured-blog', custom_css: [],
    settings: {
      title: 'Sustainability insights', blog: 'sustainability', post_limit: 4, show_view_all: true,
      blog_show_author: false, blog_show_date: true, layout: 'carousel', blog_first_post_big: false,
      alternate_bg_color: false, height: 'full', height_desktop: 700, height_mobile: 500,
      full_width: true, overlay_style_tint: true, autoplay: true, autoplay_speed: 7, slide_transition: 'slide',
    },
  },
  rnd: {
    type: 'image-with-text',
    settings: {
      subheading: 'Research & development', title: 'At the heart of innovation', title_size: 28, title_width: 12,
      text: `<p>R&D is the department at the heart of our innovation. From design concept to final product, our team turns ideas into reality — crafting bespoke, tailor-made solutions built around each client's needs and preferences.</p>`,
      button_label: 'Explore custom solutions', button_link: 'shopify://pages/tailormade',
      text_alignment: 'left', text_width: 50, button_style: 'primary',
      image: 'shopify://shop_images/M_R150.jpg', image_width: 80, image_position: 'right',
      media_size: 'cover', color_scheme: 'standard', color_bg: '', color_text: '',
    },
  },
  locations: {
    type: 'map',
    settings: {
      heading: 'Monteiro Fabrics',
      address: `<p><strong>Portugal</strong></p><p>Circunvalação, 9020, Apartado<br/>52511 </p><p>4202-351 Porto</p><p>+351 228 338 640</p><p> </p><p> </p><p><strong>Germany</strong></p><p>Grünwalder Weg 32, </p><p>82041 Oberhaching</p><p>+49 171 4101578</p>`,
      button: '', text_alignment: 'center', color_scheme: 'alt', color_bg: '', color_text: '',
      map_address: 'R. de António Augusto Félix 1, 4465-275 São Mamede de Infesta, Portugal',
      api_key: '', map_style: 'silver',
      image: 'shopify://shop_images/monteiro-fabrics1_e7e495ae-8bf7-41e7-8d15-cc3b3023ced0.jpg',
    },
  },
  cta_close: {
    type: 'rich-text', name: 'Closing CTA',
    settings: {
      subheading: 'Do you have a project?', title: "Let's work together!", title_size: 44, title_width: 12, heading_h1: false,
      text: `<p>We deliver the best fabric solutions for your projects. Tell us what you need and our specialists will guide you.</p>`,
      image: 'shopify://shop_images/logo-png-1_e743fc75-1cc8-4fc4-b7a3-889301eae1f4.png', image_width: 120,
      button_label: 'Speak to a specialist', button_link: 'shopify://pages/contact', button_style: 'primary',
      text_alignment: 'center', enlarge_text: false, full_width: false, no_padding_bottom: false,
      color_scheme: 'custom', color_bg: '#f5f5f5', color_text: '',
    },
  },
};

const order = [
  'hero_about', 'intro_legacy', 'video_brand', 'gallery_heritage', 'worldwide',
  'purpose', 'mission_vision', 'values',
  'qs_head', 'quality_certs', 'quality_reach', 'quality_testing', 'sustain_pillars', 'sustain_articles',
  'rnd', 'locations', 'cta_close',
];

const header = `/*\n * ------------------------------------------------------------\n * IMPORTANT: The contents of this file are auto-generated.\n *\n * This file may be updated by the Shopify admin theme editor\n * or related systems. Please exercise caution as any changes\n * made to this file may be overwritten.\n * ------------------------------------------------------------\n */\n`;

const body = JSON.stringify({ sections, order }, null, 2);
fs.writeFileSync(OUT, header + body + '\n');
console.log('Wrote', OUT, '—', order.length, 'sections');
console.log('Flow:', order.map((k) => sections[k].type).join(' > '));
