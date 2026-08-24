export interface RuleConfigColumn {
  title: string;
  dataIndex: string;
  width?: number;
}

export interface RuleConfigRow {
  id: string;
  [key: string]: string;
}

export interface RuleConfigData {
  columns: RuleConfigColumn[];
  rows: RuleConfigRow[];
}

export const textRuleConfigData: RuleConfigData = {
  columns: [
    { title: '国家', dataIndex: 'country', width: 120 },
    { title: '语言', dataIndex: 'locale', width: 180 },
    { title: '语言书写要求', dataIndex: 'requirement', width: 300 },
    { title: '货币', dataIndex: 'currency', width: 140 },
    { title: '单位与度量', dataIndex: 'unitsMeasures', width: 200 },
    { title: '日期/时间格式', dataIndex: 'dateTimeFormat', width: 200 },
    { title: '本地化术语', dataIndex: 'localProductTerms', width: 200 },
    { title: '文本风格', dataIndex: 'textStyle', width: 200 },
    { title: '营销红线', dataIndex: 'marketingRedline', width: 200 },
    { title: '安全红线', dataIndex: 'safetyRedline', width: 200 },
    { title: '内容红线', dataIndex: 'contentRedline', width: 200 },
    { title: '更新时间', dataIndex: 'updateTime', width: 170 },
    { title: '更新人', dataIndex: 'updater', width: 120 },
  ],
  rows: [],
};

export const imageRuleConfigData: RuleConfigData = {
  columns: [
    { title: '模块名称', dataIndex: 'moduleName', width: 180 },
    { title: 'PC标准尺寸(px)', dataIndex: 'pcSize', width: 220 },
    { title: 'Mobile标准尺寸(px)', dataIndex: 'mobileSize', width: 220 },
    { title: 'APP标准尺寸(px)', dataIndex: 'appSize', width: 220 },
    { title: '允许误差', dataIndex: 'allowedError', width: 200 },
    { title: '更新时间', dataIndex: 'updateTime', width: 170 },
    { title: '更新人', dataIndex: 'updater', width: 120 },
  ],
  rows: [],
};

export const pageRuleConfigData: RuleConfigData = {
  columns: [
    { title: '规则类型', dataIndex: 'ruleType', width: 180 },
    { title: '规则内容', dataIndex: 'criteria' },
    { title: '更新时间', dataIndex: 'updateTime', width: 170 },
    { title: '更新人', dataIndex: 'updater', width: 120 },
  ],
  rows: [],
};
