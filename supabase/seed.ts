import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const categories = [
  {
    name: "كتب إلكترونية",
    slug: "ebooks",
    description: "كتب رقمية في مواضيع متنوعة",
    icon: "📚",
    sort_order: 1,
  },
  {
    name: "قوالب احترافية",
    slug: "templates",
    description: "قوالب جاهزة للتصميم والمحتوى",
    icon: "🎨",
    sort_order: 2,
  },
  {
    name: "مجموعات صور",
    slug: "image-packs",
    description: "مجموعات صور عالية الجودة",
    icon: "🖼️",
    sort_order: 3,
  },
  {
    name: "دورات تعليمية",
    slug: "courses",
    description: "دورات مصغرة ومواد تعليمية",
    icon: "🎓",
    sort_order: 4,
  },
];

const products = [
  {
    name: "دليل التسويق الرقمي الشامل",
    slug: "digital-marketing-guide",
    short_description: "كتاب إلكتروني شامل يغطي جميع استراتيجيات التسويق الرقمي الحديثة",
    description: `كتاب إلكتروني شامل يغطي جميع استراتيجيات التسويق الرقمي الحديثة.

يتضمن هذا الدليل:
- أساسيات التسويق الرقمي
- تحسين محركات البحث (SEO)
- التسويق عبر وسائل التواصل الاجتماعي
- التسويق بالمحتوى
- الإعلانات المدفوعة
- قياس النتائج وتحليل البيانات

مناسب للمبتدئين والمحترفين على حد سواء.`,
    cover_image: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=600&fit=crop",
    gallery_images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=300&fit=crop",
    ],
    price: 29.99,
    old_price: 49.99,
    currency: "USD",
    is_free: false,
    product_type: "ebook",
    file_format: "PDF",
    file_size: "5.2 MB",
    external_url: "https://gumroad.com/l/example1",
    category_id: null, // will be set
    tags: ["تسويق", "رقمي", " كتاب"],
    badge: "bestseller",
    requirements: "لا توجد متطلبات خاصة - يمكنك قراءة الكتاب على أي جهاز",
    included_items: [
      "كتاب إلكتروني PDF (150 صفحة)",
      "قائمة مراجع وأدوات مجانية",
      "قالب خطة تسويقية",
    ],
    is_featured: true,
    is_published: true,
    seo_title: "دليل التسويق الرقمي الشامل | Digital Products Hub",
    seo_description: "كتاب إلكتروني شامل يغطي جميع استراتيجيات التسويق الرقمي الحديثة مع خطط عملية وأدوات مجانية",
  },
  {
    name: "قالب سيرة ذاتية احترافي",
    slug: "professional-resume-template",
    short_description: "قالب سيرة ذاتية عصري واحترافي بتصميم أنيق",
    description: `قالب سيرة ذاتية احترافي بتصميم عصري وأنيق.

مميزات القالب:
- تصميم احترافي ونظيف
- سهل التخصيص
- متوافق مع ATS
- يدعم اللغة العربية والإنجليزية
-包括 صفحتين (صفحة واحدة وصفحتين)`,
    cover_image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop",
    gallery_images: [],
    price: 9.99,
    old_price: null,
    currency: "USD",
    is_free: false,
    product_type: "template",
    file_format: "DOCX, PDF",
    file_size: "2.1 MB",
    external_url: "https://gumroad.com/l/example2",
    category_id: null,
    tags: ["سيرة ذاتية", "قالب", "تصميم"],
    badge: "new",
    requirements: "Microsoft Word أو Google Docs",
    included_items: [
      "قالب DOCX قابل للتعديل",
      "نسخة PDF",
      "دليل استخدام سريع",
    ],
    is_featured: true,
    is_published: true,
    seo_title: "قالب سيرة ذاتية احترافي | Digital Products Hub",
    seo_description: "قالب سيرة ذاتية عصري واحترافي سهل التخصيص ومتوافق مع أنظمة ATS",
  },
  {
    name: "مجموعة صور البورتفوليو",
    slug: "portfolio-images-pack",
    short_description: "مجموعة من 50 صورة احترافية لمشاريع التصميم",
    description: `مجموعة من 50 صورة احترافية عالية الجودة.

مناسبة ل:
- مشاريع التصميم
- العروض التقديمية
- المدونات
- وسائل التواصل الاجتماعي
- مواقع الويب

جميع الصور بدقة عالية ومجاناً للاستخدام التجاري.`,
    cover_image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&h=600&fit=crop",
    gallery_images: [
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop",
    ],
    price: 19.99,
    old_price: 34.99,
    currency: "USD",
    is_free: false,
    product_type: "images",
    file_format: "JPG, PNG",
    file_size: "250 MB",
    external_url: "https://gumroad.com/l/example3",
    category_id: null,
    tags: ["صور", "بورتفوليو", "تصميم"],
    badge: "sale",
    requirements: null,
    included_items: [
      "50 صورة عالية الجودة",
      "รูปแบบ 3000x2000 بكسل",
      "رخصة استخدام تجاري",
    ],
    is_featured: false,
    is_published: true,
    seo_title: "مجموعة صور احترافية | Digital Products Hub",
    seo_description: "مجموعة من 50 صورة احترافية عالية الجودة لمشاريع التصميم والمحتوى",
  },
  {
    name: "قالب منشورات Instagram",
    slug: "instagram-posts-template",
    short_description: "30 قالب منشور جاهز لحساب Instagram الخاص بك",
    description: `مجموعة من 30 قالب منشور Instagram احترافي.

مميزات القالب:
- تصميم عصري وجذاب
- سهل التخصيص باستخدام Canva
- مناسب للعلامات التجارية والأفراد
- يشمل منشورات وم.apple وقصص
- ألوان متناسقة ومتاحة`,
    cover_image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop",
    gallery_images: [],
    price: 14.99,
    old_price: null,
    currency: "USD",
    is_free: false,
    product_type: "template",
    file_format: "Canva Template",
    file_size: "15 MB",
    external_url: "https://gumroad.com/l/example4",
    category_id: null,
    tags: ["instagram", "منشورات", "قالب"],
    badge: null,
    requirements: "حساب Canva مجاني أو مدفوع",
    included_items: [
      "30 قالب منشور",
      "10 قوالب Stories",
      "دليل استخدام Canva",
    ],
    is_featured: true,
    is_published: true,
    seo_title: "قوالب منشورات Instagram | Digital Products Hub",
    seo_description: "30 قالب منشور Instagram احترافي جاهز للتخصيص باستخدام Canva",
  },
  {
    name: "دورة أساسيات التصميم الجرافيكي",
    slug: "graphic-design-basics",
    short_description: "دورة مصغرة في أساسيات التصميم الجرافيكي للمبتدئين",
    description: `دورة مصغرة شاملة في أساسيات التصميم الجرافيكي.

محتويات الدورة:
- مقدمة في التصميم الجرافيكي
- نظرية الألوان
- الطباعة والخطوط
- التكوين والتصميم
- الأدوات المستخدمة
- مشاريع عملية

مناسبة للمبتدئين تماماً.`,
    cover_image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=600&fit=crop",
    gallery_images: [],
    price: 0,
    old_price: null,
    currency: "USD",
    is_free: true,
    product_type: "course",
    file_format: "PDF + فيديو",
    file_size: "500 MB",
    external_url: "https://drive.google.com/example5",
    category_id: null,
    tags: ["تصميم", "جرافيكي", "دورة"],
    badge: "free",
    requirements: "لا توجد متطلبات سابقة",
    included_items: [
      "10 دروس نصية",
      "5 فيديوهات تعليمية",
      "تمارين عملية",
      "شهادة إتمام",
    ],
    is_featured: false,
    is_published: true,
    seo_title: "دورة أساسيات التصميم الجرافيكي مجاناً | Digital Products Hub",
    seo_description: "دورة مصغرة مجانية في أساسيات التصميم الجرافيكي للمبتدئين",
  },
  {
    name: "حزمة أيقونات المواقع",
    slug: "website-icons-pack",
    short_description: "أكثر من 100 أيقونة SVG مجانية للمواقع الإلكترونية",
    description: `حزمة تحتوي على أكثر من 100 أيقونة SVG عالية الجودة.

مميزات الحزمة:
- أكثر من 100 أيقونة
- بصيغة SVG (قابلة للتكبير بلا حدود)
- مناسبة لجميع المواقع
- مجانية للاستخدام التجاري
- سهلة التكامل مع أي مشروع`,
    cover_image: "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=600&fit=crop",
    gallery_images: [],
    price: 0,
    old_price: null,
    currency: "USD",
    is_free: true,
    product_type: "other",
    file_format: "SVG, PNG",
    file_size: "2 MB",
    external_url: "https://drive.google.com/example6",
    category_id: null,
    tags: ["أيقونات", "SVG", "مجاني"],
    badge: "free",
    requirements: null,
    included_items: [
      "100+ أيقونة SVG",
      "نسخة PNG بدقة عالية",
      "دليل الاستخدام",
    ],
    is_featured: false,
    is_published: true,
    seo_title: "حزمة أيقونات SVG مجانية | Digital Products Hub",
    seo_description: "أكثر من 100 أيقونة SVG عالية الجودة مجانية للاستخدام في مواقع الويب",
  },
];

async function seed() {
  console.log("Seeding categories...");

  const { data: insertedCategories, error: catError } = await supabase
    .from("categories")
    .upsert(categories, { onConflict: "slug" })
    .select();

  if (catError) {
    console.error("Error seeding categories:", catError);
    return;
  }

  console.log(`Inserted ${insertedCategories?.length} categories`);

  // Map category slugs to ids
  const categoryMap: Record<string, string> = {};
  insertedCategories?.forEach((cat) => {
    categoryMap[cat.slug] = cat.id;
  });

  // Assign category_ids to products
  const productsWithCategories = products.map((product) => {
    let category_id = null;
    if (product.tags.includes("تسويق") || product.tags.includes(" كتاب")) {
      category_id = categoryMap["ebooks"];
    } else if (product.tags.includes("قالب") || product.tags.includes("instagram")) {
      category_id = categoryMap["templates"];
    } else if (product.tags.includes("صور")) {
      category_id = categoryMap["image-packs"];
    } else if (product.tags.includes("دورة") || product.tags.includes("تصميم")) {
      category_id = categoryMap["courses"];
    }
    return { ...product, category_id };
  });

  console.log("Seeding products...");

  const { data: insertedProducts, error: prodError } = await supabase
    .from("products")
    .upsert(productsWithCategories, { onConflict: "slug" })
    .select();

  if (prodError) {
    console.error("Error seeding products:", prodError);
    return;
  }

  console.log(`Inserted ${insertedProducts?.length} products`);
  console.log("Seed completed!");
}

seed().catch(console.error);
