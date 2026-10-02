export const EMAIL = 'vexora1710@gmail.com'
export const NAV = [['home','Home'],['about','About'],['services','Services'],['work','Work'],['process','Process'],['pricing','Pricing'],['contact','Contact']]
export const TECH = ['React','Next.js','Node.js','AI','Cloud','Databases','UI/UX','Automation']
export const PILLARS = [['01','Creative Design'],['02','Smart Technology'],['03','Scalable Solutions']]
export const SERVICES = [
  ['Globe','Website Development','Modern responsive websites designed for businesses and brands.'],
  ['AppWindow','Web Applications','Powerful web applications with modern frontend and backend systems.'],
  ['Brain','AI Solutions','AI-powered tools, assistants and intelligent business features.'],
  ['PenTool','UI/UX Design','Modern user interfaces designed around usability and visual quality.'],
  ['ShoppingCart','E-Commerce','Online stores with modern shopping experiences and scalable architecture.'],
  ['LayoutDashboard','Business Dashboards','Analytics dashboards, admin panels and management systems.'],
  ['Workflow','Automation','Digital workflows that reduce repetitive business tasks.'],
  ['Wrench','Maintenance','Continuous updates, improvements and technical support.']
]
export const WHY = [
  ['Sparkles','Modern by Design','We create visually refined and responsive digital experiences.'],
  ['Briefcase','Built for Business','Every project should solve a real business problem.'],
  ['Brain','AI Ready','We integrate intelligent technologies where they provide practical value.'],
  ['TrendingUp','Designed to Scale','Solutions should be structured for future improvements and growth.']
]
export const PROCESS = [
  ['DISCOVER','Understand the business and project requirements.'],
  ['DESIGN','Create the visual direction and user experience.'],
  ['BUILD','Develop the frontend, backend and required integrations.'],
  ['TEST','Test performance, responsiveness and functionality.'],
  ['LAUNCH','Deploy the project and make it production ready.'],
  ['GROW','Continue improving and maintaining the product.']
]
export const PLANS = [
  { name:'STARTER', price:'₹4,999', note:'For simple websites.', cta:'Start Starter Project', items:['Up to 5 pages','Responsive design','Contact form','Basic SEO','Deployment'] },
  { name:'BUSINESS', price:'₹12,999', note:'For growing businesses.', cta:'Build My Business Website', hot:true, items:['Up to 10 pages','Premium UI/UX','Database integration','Admin features','SEO','Deployment'] },
  { name:'AI / CUSTOM', price:'₹20,000+', note:'For advanced digital products.', cta:'Discuss My Project', items:['AI integration','Custom functionality','Authentication','Database','Dashboard','API integrations','Deployment'] }
]
export const PROJECTS = [
  { id:1, name:'Restaurant Website', cat:'Business Website', hue:[24,330], preview:'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80', desc:'A menu-first website with online table enquiries for a local restaurant.', tech:['React','Tailwind','Node.js'],
    problem:'Local restaurants lose enquiries when menus, timings and contact details are hard to find on a phone.',
    solution:'A fast, mobile-first site with a clear menu, gallery, opening hours and a reservation enquiry form.',
    features:['Interactive menu with categories','Reservation enquiry form','Photo gallery','Google Maps location block','Basic SEO setup'] },
  { id:2, name:'Startup Management Platform', cat:'Web Application', hue:[250,200], preview:'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80', desc:'A dashboard for managing tasks, teams and progress in early-stage startups.', tech:['React','Express','PostgreSQL'],
    problem:'Early-stage teams track work across scattered chats and spreadsheets.',
    solution:'One workspace with projects, tasks, team roles and progress views.',
    features:['Role-based access','Task boards','Progress dashboard','Activity feed','Admin panel'] },
  { id:3, name:'AI Education Platform', cat:'AI Solution', hue:[190,260], preview:'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80', desc:'A learning platform with an AI study assistant and progress tracking.', tech:['React','Node.js','LLM API'],
    problem:'Students need quick, personalised explanations outside class hours.',
    solution:'Course pages with an AI assistant that answers questions about lesson material.',
    features:['Course library','AI study assistant','Quizzes','Progress tracking','Instructor dashboard'] },
  { id:4, name:'E-Commerce Experience', cat:'E-Commerce', hue:[320,260], preview:'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80', desc:'A modern online store with fast browsing, cart and checkout flow.', tech:['React','Node.js','MongoDB'],
    problem:'Small shops need an online store that feels premium without a heavy setup.',
    solution:'A catalogue-driven storefront with search, filters, cart and an order management panel.',
    features:['Product catalogue and filters','Cart and checkout flow','Order management','Admin dashboard','Payment gateway integration (third-party)'] },
  { id:5, name:'AI Business Assistant', cat:'AI Solution', hue:[210,170], preview:'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=1200&q=80', desc:'A chat assistant that answers customer questions from a business’s own information.', tech:['React','Express','LLM API'],
    problem:'Businesses answer the same customer questions repeatedly.',
    solution:'An embeddable assistant trained on business FAQs and service details, with human hand-off.',
    features:['Website chat widget','Knowledge base from FAQs','Lead capture','Hand-off to a human','Conversation overview'] }
]
