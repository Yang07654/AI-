export interface KnowledgeItem {
  id: string;
  productName: string;
  category: string;
  standardCopy: string;
  complianceRules: string;
}

export const initialKnowledgeItems: KnowledgeItem[] = [
  {
    id: 'KB-1001',
    productName: '云感舒适运动鞋',
    category: '服饰鞋包',
    standardCopy: '突出材质、脚感、支撑性和适用场景，避免绝对化排名表述。',
    complianceRules: '禁用语：全网最佳、销量第一；必须标注：尺码说明、退换规则。',
  },
  {
    id: 'KB-1002',
    productName: '轻奢护肤精华套装',
    category: '美妆个护',
    standardCopy: '以成分、肤感、日常护理体验为主，避免医疗功效和快速见效承诺。',
    complianceRules: '禁用语：祛斑、根治、7天见效；必须标注：适用肤质、敏感肌提醒。',
  },
  {
    id: 'KB-1003',
    productName: '新品无线降噪耳机',
    category: '数码家电',
    standardCopy: '强调音质、续航、连接稳定性和佩戴体验，参数需与商品详情保持一致。',
    complianceRules: '禁用语：行业第一、永久续航；必须标注：续航测试条件、保修政策。',
  },
];
