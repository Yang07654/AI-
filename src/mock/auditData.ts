export type ObjectType = '商品' | '页面' | '广告';
export type RiskLevel = '高风险' | '低风险';
export type AuditType = '视觉检查' | '文案合规检查' | '本地化检查' | '信息正确性检查' | '视觉合规检查';
export type AuditStatus = '复核失败' | '复核中' | '复核成功';
export type AssociationType = '新创建商品' | '关联OMALL主商品';
export type ContentStatus = 'normal' | 'abnormal' | 'unknown' | 'empty';
export type PageVisualCheckType =
  | '语言书写错误检查'
  | '文案合规检查'
  | '本地化合规'
  | '信息正确性审核'
  | '图片完整性'
  | '图片质量'
  | '图片尺寸/比例'
  | '商品/主体展示'
  | '图片内容合规'
  | '有效性检查'
  | '模块完整性'
  | '排版/布局异常';

export interface ProductContentStatus {
  productTitle: ContentStatus;
  productMainImage: ContentStatus;
  productSubtitle: ContentStatus;
  productDetail: ContentStatus;
  productSkuDetail: ContentStatus;
  productLink: ContentStatus;
}

export interface RiskItem {
  id: string;
  fieldName: string;
  description: string;
  level: RiskLevel;
  suggestion: string;
}

export interface AuditObject {
  id: string;
  type: ObjectType;
  name: string;
  storeName: string;
  marketingPlan: string;
  productCategory: string;
  reviewStatus: AuditStatus;
  latestAuditTime: string;
  nextReviewTime?: string;
  skuProductId: string;
  omallProductId: string;
  associationType: AssociationType;
  contentStatus?: ProductContentStatus;
  yearMonth?: string;
  pageId?: string;
  pageName?: string;
  pageType?: string;
  startTime?: string;
  endTime?: string;
  pageEnabledTime?: string;
  carouselImage?: string;
  carouselLink?: string;
  carouselImageStatus?: ContentStatus;
  carouselLinkStatus?: ContentStatus;
  pageVisualStatus?: Partial<Record<PageVisualCheckType, ContentStatus>>;
  risks: Record<AuditType, RiskItem[]>;
}

export const auditTypes: AuditType[] = ['视觉检查', '文案合规检查', '本地化检查', '信息正确性检查', '视觉合规检查'];
export const pageVisualCheckTypes: PageVisualCheckType[] = [
  '语言书写错误检查',
  '文案合规检查',
  '本地化合规',
  '信息正确性审核',
  '图片完整性',
  '图片质量',
  '图片尺寸/比例',
  '商品/主体展示',
  '图片内容合规',
  '有效性检查',
  '模块完整性',
  '排版/布局异常',
];

export const auditObjects: AuditObject[] = [
  {
    id: '2070043618300596226',
    type: '商品',
    name: 'Baton 4 Pro EDC Flashlight - 1600 Lumens USB-C | Olight',
    storeName: 'code码: 200003\n美国官网',
    marketingPlan: '春季新品推广',
    productCategory: '普通商品',
    reviewStatus: '复核中',
    latestAuditTime: '2026-08-08 18:30',
    nextReviewTime: '2026-08-09 18:30',
    skuProductId: '2016798668748989442',
    omallProductId: '2070043618300596226',
    associationType: '新创建商品',
    contentStatus: {
      productTitle: 'normal',
      productMainImage: 'normal',
      productSubtitle: 'normal',
      productDetail: 'normal',
      productSkuDetail: 'abnormal',
      productLink: 'normal',
    },
    risks: {
      视觉检查: [
        { id: 'P-1001-1', fieldName: '商品主图', description: '商品主图背景较杂，影响核心卖点识别。', level: '低风险', suggestion: '建议使用更干净的浅色背景突出鞋款主体。' },
      ],
      文案合规检查: [
        { id: 'P-1001-1', fieldName: '商品标题', description: '标题中包含绝对化用语"全网最佳"。', level: '高风险', suggestion: '建议改为"高品质运动鞋"。' },
        { id: 'P-1001-2', fieldName: '详情页卖点文案', description: '详情页承诺"永久不变形"，依据不足。', level: '低风险', suggestion: '建议改为"日常穿着稳定支撑"。' },
      ],
      本地化检查: [
        { id: 'P-1001-3', fieldName: '尺码说明', description: '英文尺码说明未补充中文解释。', level: '低风险', suggestion: '补充"中国码 / 欧码对照说明"。' },
      ],
      信息正确性检查: [],
      视觉合规检查: [
        { id: 'P-1001-4', fieldName: '主图角标', description: '主图角标出现"销量第一"但无证明来源。', level: '高风险', suggestion: '移除角标或补充有效证明。' },
      ],
    },
  },
  {
    id: '2075098080420290562',
    type: '商品',
    name: 'ArkPro | Long-Lasting Flat Unibody EDC Flashlight with Dual Charging and 4 Light Sources',
    storeName: 'code码: 200003\n美国官网',
    marketingPlan: '女神节爆品活动',
    productCategory: '套餐商品',
    reviewStatus: '复核失败',
    latestAuditTime: '2026-08-08 16:45',
    nextReviewTime: '2026-08-09 16:45',
    skuProductId: '2016798668748989443',
    omallProductId: '2075098080420290562',
    associationType: '关联OMALL主商品',
    contentStatus: {
      productTitle: 'abnormal',
      productMainImage: 'unknown',
      productSubtitle: 'normal',
      productDetail: 'normal',
      productSkuDetail: 'normal',
      productLink: 'normal',
    },
    risks: {
      视觉检查: [
        { id: 'P-1002-1', fieldName: '套装展示图', description: '套装图中赠品与正装商品层级不清。', level: '低风险', suggestion: '建议区分主商品与赠品的视觉权重。' },
      ],
      文案合规检查: [
        { id: 'P-1002-1', fieldName: '功效描述', description: '描述中出现"7天祛斑见效"。', level: '高风险', suggestion: '删除功效承诺，改为"帮助改善肌肤状态"。' },
        { id: 'P-1002-2', fieldName: '成分说明', description: '成分说明缺少适用肤质提醒。', level: '低风险', suggestion: '增加敏感肌试用建议。' },
      ],
      本地化检查: [],
      信息正确性检查: [
        { id: 'P-1002-5', fieldName: '容量规格', description: '详情页容量信息与规格参数不一致。', level: '高风险', suggestion: '统一详情页与参数区的容量信息。' },
      ],
      视觉合规检查: [
        { id: 'P-1002-3', fieldName: '功效对比图', description: '对比图存在明显夸大前后效果。', level: '高风险', suggestion: '使用真实产品图，避免夸大对比。' },
        { id: 'P-1002-4', fieldName: '图片说明文字', description: '图片中文字较小，移动端可读性不足。', level: '低风险', suggestion: '提高字号并增加文字对比度。' },
      ],
    },
  },
  {
    id: '2068883893163208706',
    type: '商品',
    name: 'Baton Ultra / 4 Pro: Dual Switch High Lumen Compact EDC Flashlight',
    storeName: 'code码: 200003\n美国官网',
    marketingPlan: '秋季生活焕新',
    productCategory: '赠送商品',
    reviewStatus: '复核成功',
    latestAuditTime: '2026-08-09 11:20',
    nextReviewTime: '2026-08-10 11:20',
    skuProductId: '2016798668748989444',
    omallProductId: '2068883893163208706',
    associationType: '新创建商品',
    contentStatus: {
      productTitle: 'normal',
      productMainImage: 'normal',
      productSubtitle: 'empty',
      productDetail: 'normal',
      productSkuDetail: 'normal',
      productLink: 'normal',
    },
    risks: {
      视觉检查: [],
      文案合规检查: [],
      本地化检查: [],
      信息正确性检查: [],
      视觉合规检查: [],
    },
  },
  {
    id: '2075395982148169730',
    type: '商品',
    name: 'ArkPro Series – Flat Unibody EDC Flashlight with Multi-Light Sources',
    storeName: 'code码: 200003\n美国官网',
    marketingPlan: '新品首发推广',
    productCategory: '会员商品',
    reviewStatus: '复核成功',
    latestAuditTime: '2026-08-09 10:05',
    nextReviewTime: '2026-08-10 10:05',
    skuProductId: '2016798668748989445',
    omallProductId: '2075395982148169730',
    associationType: '关联OMALL主商品',
    contentStatus: {
      productTitle: 'normal',
      productMainImage: 'normal',
      productSubtitle: 'abnormal',
      productDetail: 'normal',
      productSkuDetail: 'normal',
      productLink: 'normal',
    },
    risks: {
      视觉检查: [],
      文案合规检查: [],
      本地化检查: [],
      信息正确性检查: [],
      视觉合规检查: [],
    },
  },
  {
    id: '2085969585293758466',
    type: '商品',
    name: 'ArkPro Series – Flat Unibody EDC Flashlight with Multi-Light Sources',
    storeName: 'code码: 200003\n美国官网',
    marketingPlan: '夏季户外专场',
    productCategory: '盲盒商品',
    reviewStatus: '复核成功',
    latestAuditTime: '2026-08-09 09:40',
    nextReviewTime: '2026-08-10 09:40',
    skuProductId: '2016798668748989446',
    omallProductId: '2085969585293758466',
    associationType: '新创建商品',
    contentStatus: {
      productTitle: 'normal',
      productMainImage: 'normal',
      productSubtitle: 'normal',
      productDetail: 'normal',
      productSkuDetail: 'normal',
      productLink: 'normal',
    },
    risks: {
      视觉检查: [],
      文案合规检查: [],
      本地化检查: [],
      信息正确性检查: [],
      视觉合规检查: [],
    },
  },
  {
    id: 'PAGE-201',
    type: '页面',
    name: '开学季数码会场',
    storeName: '新加坡官网',
    marketingPlan: '开学季大促',
    productCategory: '数码家电',
    reviewStatus: '复核成功',
    latestAuditTime: '2026-08-07 21:10',
    skuProductId: '',
    omallProductId: '',
    associationType: '新创建商品',
    yearMonth: '2026-08',
    pageId: '2090123456789012345',
    pageName: '开学季数码会场',
    pageType: '专题页',
    startTime: '2026-08-01 00:00',
    endTime: '2026-08-31 23:59',
    pageEnabledTime: '2026-08-01 00:00',
    carouselImage: '开学季数码会场-Banner主图',
    carouselLink: 'https://www.olightstore.com/back-to-school',
    carouselImageStatus: 'normal',
    carouselLinkStatus: 'normal',
    pageVisualStatus: {
      语言书写错误检查: 'normal',
      文案合规检查: 'normal',
      本地化合规: 'normal',
      信息正确性审核: 'normal',
      图片完整性: 'normal',
      图片质量: 'normal',
      '图片尺寸/比例': 'normal',
      '商品/主体展示': 'normal',
      图片内容合规: 'normal',
      有效性检查: 'normal',
      模块完整性: 'normal',
      '排版/布局异常': 'normal',
    },
    risks: {
      视觉检查: [],
      文案合规检查: [
        { id: 'PAGE-201-1', fieldName: '活动规则', description: '活动规则中优惠门槛描述不完整。', level: '低风险', suggestion: '补充满减门槛与适用范围。' },
      ],
      本地化检查: [
        { id: 'PAGE-201-2', fieldName: '购买按钮', description: '页面部分按钮仍为英文"Buy Now"。', level: '低风险', suggestion: '统一改为"立即购买"。' },
        { id: 'PAGE-201-3', fieldName: '配送说明', description: '地区配送说明未匹配当前站点语言。', level: '低风险', suggestion: '切换为当前站点语言表达。' },
      ],
      信息正确性检查: [
        { id: 'PAGE-201-5', fieldName: '商品库存状态', description: '会场页部分商品库存状态未及时刷新。', level: '低风险', suggestion: '同步商品库存状态并隐藏售罄商品。' },
      ],
      视觉合规检查: [
        { id: 'PAGE-201-4', fieldName: '会场 Banner', description: '会场 Banner 使用"最低价"表述。', level: '高风险', suggestion: '建议改为"限时优惠"。' },
      ],
    },
  },
  {
    id: 'PAGE-202',
    type: '页面',
    name: '会员权益说明页',
    storeName: '西班牙官网',
    marketingPlan: '会员权益升级',
    productCategory: '会员服务',
    reviewStatus: '复核中',
    latestAuditTime: '2026-08-07 10:25',
    skuProductId: '',
    omallProductId: '',
    associationType: '新创建商品',
    yearMonth: '2026-08',
    pageId: '2090234567890123456',
    pageName: '会员权益说明页',
    pageType: '商城首页',
    startTime: '2026-08-05 10:00',
    endTime: '2026-12-31 23:59',
    pageEnabledTime: '2026-08-05 10:00',
    carouselImage: '会员权益升级-Banner主图',
    carouselLink: 'https://www.olightstore.com/member-benefits',
    carouselImageStatus: 'abnormal',
    carouselLinkStatus: 'unknown',
    pageVisualStatus: {
      语言书写错误检查: 'normal',
      文案合规检查: 'normal',
      本地化合规: 'normal',
      信息正确性审核: 'unknown',
      图片完整性: 'abnormal',
      图片质量: 'unknown',
      '图片尺寸/比例': 'normal',
      '商品/主体展示': 'normal',
      图片内容合规: 'normal',
      有效性检查: 'abnormal',
      模块完整性: 'normal',
      '排版/布局异常': 'abnormal',
    },
    risks: {
      视觉检查: [
        { id: 'PAGE-202-2', fieldName: '权益图标', description: '权益图标风格不统一。', level: '低风险', suggestion: '统一图标线条粗细与色彩规范。' },
      ],
      文案合规检查: [],
      本地化检查: [
        { id: 'PAGE-202-1', fieldName: '权益说明', description: '权益说明中存在直译表达，语义不自然。', level: '低风险', suggestion: '改为符合本地用户阅读习惯的表达。' },
      ],
      信息正确性检查: [],
      视觉合规检查: [],
    },
  },
  {
    id: 'PAGE-203',
    type: '页面',
    name: '夏季清仓主会场',
    storeName: '美国官网',
    marketingPlan: '夏季清仓活动',
    productCategory: '综合百货',
    reviewStatus: '复核失败',
    latestAuditTime: '2026-08-06 14:30',
    skuProductId: '',
    omallProductId: '',
    associationType: '新创建商品',
    yearMonth: '2026-07',
    pageId: '2090345678901234567',
    pageName: '夏季清仓主会场',
    pageType: '官网首页',
    startTime: '2026-07-15 00:00',
    endTime: '2026-07-31 23:59',
    pageEnabledTime: '2026-07-15 00:00',
    carouselImage: '夏季清仓活动-Banner主图',
    carouselLink: 'https://www.olightstore.com/summer-clearance',
    carouselImageStatus: 'normal',
    carouselLinkStatus: 'normal',
    pageVisualStatus: {
      语言书写错误检查: 'normal',
      文案合规检查: 'normal',
      本地化合规: 'normal',
      信息正确性审核: 'normal',
      图片完整性: 'normal',
      图片质量: 'normal',
      '图片尺寸/比例': 'normal',
      '商品/主体展示': 'empty',
      图片内容合规: 'normal',
      有效性检查: 'normal',
      模块完整性: 'normal',
      '排版/布局异常': 'normal',
    },
    risks: {
      视觉检查: [],
      文案合规检查: [],
      本地化检查: [],
      信息正确性检查: [],
      视觉合规检查: [],
    },
  },
  {
    id: 'PAGE-204',
    type: '页面',
    name: '新品首发专区',
    storeName: '日本官网',
    marketingPlan: '新品首发推广',
    productCategory: '数码家电',
    reviewStatus: '复核成功',
    latestAuditTime: '2026-08-08 09:15',
    skuProductId: '',
    omallProductId: '',
    associationType: '新创建商品',
    yearMonth: '2026-08',
    pageId: '2090456789012345678',
    pageName: '新品首发专区',
    pageType: '专题页',
    startTime: '2026-08-03 08:00',
    endTime: '2026-08-20 23:59',
    pageEnabledTime: '2026-08-03 08:00',
    carouselImage: '新品首发专区-Banner主图',
    carouselLink: 'https://www.olightstore.com/new-arrivals',
    carouselImageStatus: 'normal',
    carouselLinkStatus: 'normal',
    pageVisualStatus: {
      语言书写错误检查: 'abnormal',
      文案合规检查: 'normal',
      本地化合规: 'normal',
      信息正确性审核: 'normal',
      图片完整性: 'normal',
      图片质量: 'normal',
      '图片尺寸/比例': 'normal',
      '商品/主体展示': 'normal',
      图片内容合规: 'normal',
      有效性检查: 'normal',
      模块完整性: 'normal',
      '排版/布局异常': 'normal',
    },
    risks: {
      视觉检查: [],
      文案合规检查: [],
      本地化检查: [],
      信息正确性检查: [],
      视觉合规检查: [],
    },
  },
  {
    id: 'PAGE-205',
    type: '页面',
    name: '秋季生活焕新会场',
    storeName: '奥地利官网',
    marketingPlan: '秋季生活焕新',
    productCategory: '家居生活',
    reviewStatus: '复核成功',
    latestAuditTime: '2026-08-09 16:00',
    skuProductId: '',
    omallProductId: '',
    associationType: '新创建商品',
    yearMonth: '2026-09',
    pageId: '2090567890123456789',
    pageName: '秋季生活焕新会场',
    pageType: '分类页',
    startTime: '2026-09-01 00:00',
    endTime: '2026-09-30 23:59',
    pageEnabledTime: '2026-09-01 00:00',
    carouselImage: '秋季生活焕新-Banner主图',
    carouselLink: 'https://www.olightstore.com/autumn-refresh',
    carouselImageStatus: 'normal',
    carouselLinkStatus: 'normal',
    pageVisualStatus: {
      语言书写错误检查: 'normal',
      文案合规检查: 'normal',
      本地化合规: 'normal',
      信息正确性审核: 'normal',
      图片完整性: 'normal',
      图片质量: 'normal',
      '图片尺寸/比例': 'normal',
      '商品/主体展示': 'normal',
      图片内容合规: 'normal',
      有效性检查: 'normal',
      模块完整性: 'normal',
      '排版/布局异常': 'normal',
    },
    risks: {
      视觉检查: [],
      文案合规检查: [],
      本地化检查: [],
      信息正确性检查: [],
      视觉合规检查: [],
    },
  },
  {
    id: 'AD-301',
    type: '广告',
    name: '夏季清仓信息流广告',
    storeName: '奥地利官网',
    marketingPlan: '夏季清仓活动',
    productCategory: '综合百货',
    reviewStatus: '复核失败',
    latestAuditTime: '2026-08-06 20:18',
    skuProductId: '',
    omallProductId: '',
    associationType: '新创建商品',
    risks: {
      视觉检查: [
        { id: 'AD-301-5', fieldName: '广告画面', description: '广告画面元素过多，核心利益点不突出。', level: '低风险', suggestion: '减少装饰元素，突出主商品和优惠信息。' },
      ],
      文案合规检查: [
        { id: 'AD-301-1', fieldName: '广告主文案', description: '广告文案包含"错过后悔一辈子"等强刺激表达。', level: '低风险', suggestion: '改为温和促销表达。' },
      ],
      本地化检查: [],
      信息正确性检查: [
        { id: 'AD-301-6', fieldName: '优惠券面额', description: '优惠券面额与落地页领取面额不一致。', level: '高风险', suggestion: '同步广告素材与落地页优惠信息。' },
      ],
      视觉合规检查: [
        { id: 'AD-301-2', fieldName: '人物素材', description: '广告图使用未授权人物肖像。', level: '高风险', suggestion: '更换为授权素材或自有素材。' },
        { id: 'AD-301-3', fieldName: '倒计时组件', description: '使用倒计时元素但未展示真实结束时间。', level: '高风险', suggestion: '补充准确活动时间或移除倒计时。' },
        { id: 'AD-301-4', fieldName: '优惠说明', description: '优惠说明缺少限制条件。', level: '低风险', suggestion: '补充适用商品和使用门槛。' },
      ],
    },
  },
  {
    id: 'AD-302',
    type: '广告',
    name: '新品耳机开屏广告',
    storeName: '美国官网',
    marketingPlan: '新品首发推广',
    productCategory: '数码家电',
    reviewStatus: '复核成功',
    latestAuditTime: '2026-08-05 09:56',
    skuProductId: '',
    omallProductId: '',
    associationType: '新创建商品',
    risks: {
      视觉检查: [],
      文案合规检查: [
        { id: 'AD-302-1', fieldName: '核心卖点', description: '卖点"行业第一降噪"缺少权威依据。', level: '高风险', suggestion: '建议改为"强劲降噪体验"。' },
      ],
      本地化检查: [
        { id: 'AD-302-2', fieldName: '广告口号', description: '口号语序不符合目标市场表达习惯。', level: '低风险', suggestion: '重新润色为自然短句。' },
      ],
      信息正确性检查: [
        { id: 'AD-302-3', fieldName: '价格标签', description: '价格标签与落地页实际价格不一致。', level: '高风险', suggestion: '同步广告价格或更新落地页价格。' },
      ],
      视觉合规检查: [],
    },
  },
];
