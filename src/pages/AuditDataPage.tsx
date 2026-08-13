import { ArrowLeftOutlined, CheckCircleFilled, CloseOutlined, CopyOutlined, MinusOutlined, MoreOutlined, QuestionCircleFilled, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Collapse, Divider, Dropdown, Form, Input, Modal, Select, Space, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Key, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { auditObjects, auditTypes, pageVisualCheckTypes, type AuditObject, type AuditStatus, type AssociationType, type AuditType, type ContentStatus, type ObjectType, type RiskItem, type RiskLevel } from '../mock/auditData';
import { logRecords, type LogRecord, type LogReviewStatus, type PushStatus } from '../mock/logData';

const typeColorMap: Record<ObjectType, string> = {
  商品: 'blue',
  页面: 'purple',
  广告: 'cyan',
};

const associationTypeColorMap: Record<AssociationType, string> = {
  新创建商品: 'blue',
  关联OMALL主商品: 'green',
};

const contentStatusConfig: Record<ContentStatus, { icon: ReactNode; label: string; color: string }> = {
  normal: { icon: <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />, label: '复核通过', color: '#52c41a' },
  abnormal: { icon: <CloseOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />, label: '复核失败', color: '#ff4d4f' },
  unknown: { icon: <QuestionCircleFilled style={{ color: '#8c8c8c', fontSize: 18 }} />, label: '未复核', color: '#8c8c8c' },
  empty: { icon: <MinusOutlined style={{ color: '#8c8c8c', fontSize: 18 }} />, label: '无需复核', color: '#8c8c8c' },
};

function renderContentStatus(status: ContentStatus | undefined) {
  if (!status) return '-';
  const config = contentStatusConfig[status];
  return <Tooltip title={config.label}>{config.icon}</Tooltip>;
}

const productFailureOverride: Record<string, { reason: string; suggestion: string; fieldName?: string }> = {
  商品标题: { reason: '名词单复数不一致（参数描述高频错）', suggestion: '500 lumens rechargeable flashlight' },
  商品副标题: { reason: '名词单复数不一致（参数描述高频错）', suggestion: '500 lumens rechargeable flashlight' },
  商品详情: { reason: '名词单复数不一致（参数描述高频错）', suggestion: '500 lumens rechargeable flashlight', fieldName: '模块名称' },
  商品SKU详情: { reason: '名词单复数不一致（参数描述高频错）', suggestion: '500 lumens rechargeable flashlight', fieldName: '模块名称' },
};

function renderProductContentStatus(record: AuditObject, fieldKey: string, fieldName: string) {
  const status = record.contentStatus?.[fieldKey as keyof typeof record.contentStatus];
  if (!status) return '-';
  const config = contentStatusConfig[status];

  if (status === 'abnormal') {
    const override = productFailureOverride[fieldName];
    const riskItem = Object.values(record.risks).flat().find((risk) => risk.fieldName.includes(fieldName));
    const failureReason = override?.reason || riskItem?.description || '当前字段复核失败，请检查内容。';
    const aiSuggestion = override?.suggestion || riskItem?.suggestion || '建议检查并修正相关内容。';

    return (
      <Tooltip
        overlayStyle={{ maxWidth: 400 }}
        overlayInnerStyle={{ backgroundColor: '#fff' }}
        title={
          <div style={{ maxHeight: 200, overflowY: 'auto', lineHeight: 1.8, color: '#ff4d4f' }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontWeight: 'bold' }}>失败字段/模块：</span>
              {override?.fieldName || fieldName}
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontWeight: 'bold' }}>失败原因：</span>
              {failureReason}
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>AI建议修改：</span>
              {aiSuggestion}
            </div>
          </div>
        }
      >
        {config.icon}
      </Tooltip>
    );
  }

  return <Tooltip title={config.label}>{config.icon}</Tooltip>;
}

function renderPageVisualContentStatus(record: AuditObject, checkType: string) {
  const status = record.pageVisualStatus?.[checkType as keyof typeof record.pageVisualStatus];
  if (!status) return '-';
  const config = contentStatusConfig[status];

  if (status === 'abnormal') {
    const failureInfo = pageVisualFailureInfo[checkType];
    const subFields = pageVisualSubFields[checkType] || [];
    const failedSubFields = subFields.filter((subField, index) => {
      let itemStatus: ContentStatus = subField.defaultStatus;
      if (index === 0) {
        itemStatus = 'abnormal';
      }
      return itemStatus === 'abnormal';
    });

    return (
      <Tooltip
        overlayStyle={{ maxWidth: 400 }}
        overlayInnerStyle={{ backgroundColor: '#fff', maxHeight: 200, overflowY: 'auto', padding: 12 }}
        title={
          <div style={{ lineHeight: 1.8, color: '#ff4d4f' }}>
            {failedSubFields.map((subField, index) => (
              <div key={index} style={{ marginBottom: index < failedSubFields.length - 1 ? 12 : 0 }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 'bold' }}>失败字段/模块：</span>
                  {subField.fieldName}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 'bold' }}>失败原因：</span>
                  {failureInfo?.reason || '当前检查项复核失败'}
                </div>
                <div>
                  <span style={{ fontWeight: 'bold' }}>AI建议修改：</span>
                  {failureInfo?.suggestion || '建议检查并修正相关内容。'}
                </div>
              </div>
            ))}
          </div>
        }
      >
        {config.icon}
      </Tooltip>
    );
  }

  return <Tooltip title={config.label}>{config.icon}</Tooltip>;
}

const productContentFields = [
  { key: 'productTitle' as const, name: '商品标题', number: '1' },
  { key: 'productMainImage' as const, name: '商品主图', number: '2' },
  { key: 'productSubtitle' as const, name: '商品副标题', number: '3' },
  { key: 'productDetail' as const, name: '商品详情', number: '4' },
  { key: 'productSkuDetail' as const, name: '商品SKU详情', number: '5' },
  { key: 'productLink' as const, name: '商品链接', number: '6' },
];

const pageVisualDetailFields = pageVisualCheckTypes.map((name, index) => ({
  key: name,
  name,
  number: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'][index],
}));

const pageVisualDetailContent: Record<string, { sku: string; omall: string }> = {
  语言书写错误检查: { sku: '页面文案不得存在拼写、语法或书写错误', omall: '语言书写正常' },
  文案合规检查: { sku: '页面文案需符合广告宣传与平台规则', omall: '文案符合规则' },
  本地化合规: { sku: '页面表达需符合当地语言与文化习惯', omall: '本地化表达正常' },
  信息正确性审核: { sku: '价格、活动、商品等信息需准确一致', omall: '信息准确' },
  图片完整性: { sku: '页面图片需完整展示，不可缺失、遮挡或加载异常', omall: '图片完整展示' },
  图片质量: { sku: '图片需清晰，无明显模糊、压缩、噪点问题', omall: '图片质量正常' },
  '图片尺寸/比例': { sku: '尺寸比例需符合页面视觉规范', omall: '尺寸比例符合规范' },
  '商品/主体展示': { sku: '商品或页面主体需突出展示', omall: '主体展示清晰' },
  图片内容合规: { sku: '图片内容不得包含违规元素', omall: '图片内容合规' },
  有效性检查: { sku: '页面链接及功能需有效可用', omall: '链接有效' },
  模块完整性: { sku: '页面模块需完整，不可缺失关键区域', omall: '模块完整' },
  '排版/布局异常': { sku: '页面排版需整齐，无错位、重叠或异常留白', omall: '布局正常' },
};

const pageVisualFailureInfo: Record<string, { reason: string; suggestion: string }> = {
  '语言书写错误检查': { reason: '页面文案存在拼写或语法错误', suggestion: '建议修正拼写和语法错误' },
  '文案合规检查': { reason: '页面文案不符合广告宣传规则', suggestion: '建议修改文案，确保符合平台规则' },
  '本地化合规': { reason: '页面表达不符合当地语言文化习惯', suggestion: '建议调整为符合本地用户习惯的表达' },
  '信息正确性审核': { reason: '价格、活动等信息不准确', suggestion: '建议核实并更正信息，确保准确一致' },
  '图片完整性': { reason: '页面图片存在缺失或加载异常', suggestion: '建议补充缺失图片，确保所有图片资源正常加载' },
  '图片质量': { reason: '图片存在模糊、压缩或噪点问题', suggestion: '建议更换高清原图，避免过度压缩' },
  '图片尺寸/比例': { reason: '图片尺寸比例不符合视觉规范', suggestion: '建议按规范调整图片尺寸和比例' },
  '商品/主体展示': { reason: '商品主体展示不突出', suggestion: '建议优化图片构图，突出商品主体' },
  '图片内容合规': { reason: '图片内容包含违规元素', suggestion: '建议移除违规元素，替换为合规图片' },
  '有效性检查': { reason: '页面链接失效或功能不可用', suggestion: '建议修复失效链接，确保功能正常可用' },
  '模块完整性': { reason: '页面模块缺失关键区域', suggestion: '建议补充缺失模块，确保页面完整' },
  '排版/布局异常': { reason: '页面排版存在错位或异常留白', suggestion: '建议调整布局，确保排版整齐' },
};

const pageVisualSubFields: Record<string, Array<{ fieldName: string; mallData: string; defaultStatus: ContentStatus }>> = {
  '语言书写错误检查': [
    { fieldName: '模块名称', mallData: '秒杀活动模块', defaultStatus: 'empty' },
    { fieldName: '模块中文字', mallData: '秒杀活动模块', defaultStatus: 'normal' },
  ],
  '文案合规检查': [
    { fieldName: '活动规则文案', mallData: '满199减50', defaultStatus: 'normal' },
    { fieldName: '促销标语', mallData: '限时特惠', defaultStatus: 'normal' },
  ],
  '本地化合规': [
    { fieldName: '货币格式', mallData: '$199', defaultStatus: 'normal' },
    { fieldName: '日期格式', mallData: '2026-08-01', defaultStatus: 'normal' },
  ],
  '信息正确性审核': [
    { fieldName: '价格信息', mallData: '$199', defaultStatus: 'normal' },
    { fieldName: '活动时间', mallData: '2026-08-01 至 2026-08-31', defaultStatus: 'normal' },
  ],
  '图片完整性': [
    { fieldName: 'Banner图', mallData: 'summer-banner.jpg', defaultStatus: 'normal' },
    { fieldName: '商品图', mallData: 'product-001.jpg', defaultStatus: 'normal' },
  ],
  '图片质量': [
    { fieldName: 'Banner图清晰度', mallData: '1920x600', defaultStatus: 'normal' },
    { fieldName: '商品图清晰度', mallData: '800x800', defaultStatus: 'normal' },
  ],
  '图片尺寸/比例': [
    { fieldName: 'Banner图尺寸', mallData: '1920x600', defaultStatus: 'normal' },
    { fieldName: '商品图尺寸', mallData: '800x800', defaultStatus: 'normal' },
  ],
  '商品/主体展示': [
    { fieldName: '主图商品占比', mallData: '70%', defaultStatus: 'normal' },
    { fieldName: '背景干净度', mallData: '纯白背景', defaultStatus: 'normal' },
  ],
  '图片内容合规': [
    { fieldName: '违禁元素', mallData: '无', defaultStatus: 'normal' },
    { fieldName: '水印检测', mallData: '无水印', defaultStatus: 'normal' },
  ],
  '有效性检查': [
    { fieldName: '页面链接', mallData: 'https://olightstore.com/page', defaultStatus: 'normal' },
    { fieldName: '跳转链接', mallData: 'https://olightstore.com/product', defaultStatus: 'normal' },
  ],
  '模块完整性': [
    { fieldName: '头部导航', mallData: '已配置', defaultStatus: 'normal' },
    { fieldName: '底部信息', mallData: '已配置', defaultStatus: 'normal' },
  ],
  '排版/布局异常': [
    { fieldName: '模块间距', mallData: '20px', defaultStatus: 'normal' },
    { fieldName: '对齐方式', mallData: '居中对齐', defaultStatus: 'normal' },
  ],
};

const productSubFields: Record<string, Array<{ fieldName: string; mallData: string; defaultStatus: ContentStatus }>> = {
  productTitle: [
    { fieldName: '标题内容', mallData: 'EDC Flashlight - 1600 Lumens USB-C', defaultStatus: 'normal' },
    { fieldName: '标题格式', mallData: '符合字数与格式规范', defaultStatus: 'normal' },
  ],
  productMainImage: [
    { fieldName: '主图内容', mallData: 'product-main-001.jpg', defaultStatus: 'normal' },
    { fieldName: '主图尺寸', mallData: '800x800', defaultStatus: 'normal' },
  ],
  productSubtitle: [
    { fieldName: '副标题内容', mallData: '高品质EDC手电筒', defaultStatus: 'normal' },
    { fieldName: '副标题格式', mallData: '符合规范', defaultStatus: 'normal' },
  ],
  productDetail: [
    { fieldName: '详情内容', mallData: '包含主图内容与卖点描述', defaultStatus: 'normal' },
    { fieldName: '详情格式', mallData: '图文混排', defaultStatus: 'normal' },
  ],
  productSkuDetail: [
    { fieldName: 'SKU信息', mallData: 'SKU-001 / SKU-002 / SKU-003', defaultStatus: 'normal' },
    { fieldName: 'SKU一致性', mallData: '颜色/规格信息一致', defaultStatus: 'normal' },
  ],
  productLink: [
    { fieldName: '链接地址', mallData: 'https://olightstore.com/product/001', defaultStatus: 'normal' },
    { fieldName: '链接有效性', mallData: '有效', defaultStatus: 'normal' },
  ],
};

type RiskDisplayItem = (RiskItem & { latestAuditTime: string }) | {
  id: string;
  fieldName: string;
  description: string;
  level: '无风险';
  suggestion: string;
  latestAuditTime: string;
};

const riskColorMap: Record<RiskLevel | '无风险', string> = {
  高风险: 'red',
  低风险: 'orange',
  无风险: 'green',
};

const statusColorMap: Record<AuditStatus, string> = {
  复核失败: 'red',
  复核中: 'processing',
  复核成功: 'green',
};

const logPushStatusColorMap: Record<PushStatus, string> = {
  已下推: 'green',
  未下推: 'default',
};

const logReviewStatusColorMap: Record<LogReviewStatus, string> = {
  已复核: 'green',
  未复核: 'default',
  复核中: 'processing',
};

const storeOptions = ['美国官网', '日本官网', '新加坡官网', '西班牙官网', '奥地利官网'];

function getRiskCount(record: AuditObject, auditType: AuditType) {
  const risks = record.risks[auditType] || [];
  return {
    high: risks.filter((item) => item.level === '高风险').length,
    low: risks.filter((item) => item.level === '低风险').length,
  };
}

export default function AuditDataPage() {
  const [current, setCurrent] = useState<AuditObject | null>(null);
  const [keyword, setKeyword] = useState('');
  const [storeName, setStoreName] = useState<string>();
  const [marketingPlan, setMarketingPlan] = useState<string>();
  const [productCategory, setProductCategory] = useState<string>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [pageKeyword, setPageKeyword] = useState('');
  const [pageStore, setPageStore] = useState<string>();
  const [pageYearMonth, setPageYearMonth] = useState<string>();
  const [currentLogRecord, setCurrentLogRecord] = useState<AuditObject | null>(null);
  const [logTraceId, setLogTraceId] = useState('');
  const [logPushStatus, setLogPushStatus] = useState<string>();
  const [logReviewStatus, setLogReviewStatus] = useState<string>();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRecord, setReviewRecord] = useState<AuditObject | null>(null);
  const [reviewItem, setReviewItem] = useState<string[]>();
  const [activeTab, setActiveTab] = useState('product-visual-audit');
  const [logViewTab, setLogViewTab] = useState<'product' | 'page'>('product');
  const [pageDetailStatusFilter, setPageDetailStatusFilter] = useState<ContentStatus[]>(['abnormal', 'unknown', 'empty']);

  const productAuditObjects = useMemo(() => auditObjects.filter((item) => item.type === '商品'), []);
  const pageAuditObjects = useMemo(() => auditObjects.filter((item) => item.type === '页面'), []);
  const marketingPlanOptions = useMemo(() => [...new Set(productAuditObjects.map((item) => item.marketingPlan))], [productAuditObjects]);
  const productCategoryOptions = useMemo(() => [...new Set(productAuditObjects.map((item) => item.productCategory))], [productAuditObjects]);
  const pageStoreOptions = useMemo(() => [...new Set(pageAuditObjects.map((item) => item.storeName.split('\n').pop() || ''))], [pageAuditObjects]);
  const pageYearMonthOptions = useMemo(() => [...new Set(pageAuditObjects.map((item) => item.yearMonth).filter(Boolean) as string[])], [pageAuditObjects]);
  const detailFieldNameFilters = useMemo(() => {
    const fieldNames = new Set<string>(auditTypes);

    auditObjects.forEach((record) => {
      auditTypes.forEach((auditType) => {
        record.risks[auditType].forEach((risk) => fieldNames.add(risk.fieldName));
      });
    });

    return [...fieldNames].map((value) => ({ text: value, value }));
  }, []);
  const detailReviewTimeFilters = useMemo(
    () => [...new Set(auditObjects.map((item) => item.latestAuditTime))].map((value) => ({ text: value, value })),
    [],
  );

  const filteredAuditObjects = useMemo(() => {
    const normalizedKeyword = keyword.trim();

    return productAuditObjects.filter((item) => {
      const matchedKeyword =
        !normalizedKeyword ||
        item.name.includes(normalizedKeyword) ||
        item.type.includes(normalizedKeyword) ||
        item.storeName.includes(normalizedKeyword) ||
        item.skuProductId.includes(normalizedKeyword) ||
        item.omallProductId.includes(normalizedKeyword);

      return (
        matchedKeyword &&
        (!storeName || item.storeName.includes(storeName)) &&
        (!marketingPlan || item.marketingPlan === marketingPlan) &&
        (!productCategory || item.productCategory === productCategory)
      );
    });
  }, [keyword, marketingPlan, productAuditObjects, productCategory, storeName]);

  const filteredPageAuditObjects = useMemo(() => {
    const normalizedKeyword = pageKeyword.trim();

    return pageAuditObjects.filter((item) => {
      const matchedKeyword =
        !normalizedKeyword ||
        item.name.includes(normalizedKeyword) ||
        item.storeName.includes(normalizedKeyword) ||
        Boolean(item.pageId?.includes(normalizedKeyword)) ||
        Boolean(item.pageName?.includes(normalizedKeyword));

      return (
        matchedKeyword &&
        (!pageStore || item.storeName.includes(pageStore)) &&
        (!pageYearMonth || item.yearMonth === pageYearMonth)
      );
    });
  }, [pageKeyword, pageStore, pageYearMonth, pageAuditObjects]);

  const filteredLogRecords = useMemo(() => {
    if (!currentLogRecord) return [];
    const normalizedTraceId = logTraceId.trim();

    return logRecords.filter((record) => {
      if (record.reviewId !== currentLogRecord.id) return false;
      if (normalizedTraceId && !record.traceId.includes(normalizedTraceId)) return false;
      if (logPushStatus && record.pushStatus !== logPushStatus) return false;
      if (logReviewStatus && record.reviewStatus !== logReviewStatus) return false;
      return true;
    });
  }, [currentLogRecord, logTraceId, logPushStatus, logReviewStatus]);

  const runBatchReview = () => {
    if (!selectedRowKeys.length) {
      message.warning('请先勾选需要复核的数据');
      return;
    }

    Modal.confirm({
      title: '确认一键复核？',
      content: `已选择 ${selectedRowKeys.length} 条数据，确认提交复核吗？`,
      okText: '确认复核',
      cancelText: '取消',
      onOk: () => {
        message.success(`已提交 ${selectedRowKeys.length} 条数据进行一键复核`);
        setSelectedRowKeys([]);
      },
    });
  };

  const exportAuditData = () => {
    const headers = ['店铺', '营销方案名称', 'SKU集商品ID', 'Omall商品ID', '营销中心商品名称', '关联类型', '商品类型', '下次复核时间(CN)', '最近复核时间'];
    const rows = filteredAuditObjects.map((record) => [
      record.storeName,
      record.marketingPlan,
      record.skuProductId,
      record.omallProductId,
      record.name,
      record.associationType,
      record.productCategory,
      record.nextReviewTime || '/',
      record.latestAuditTime,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `复核数据导出-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('复核数据已导出');
  };

  const columns: ColumnsType<AuditObject> = useMemo(() => {
    return [
      {
        title: '操作',
        width: 120,
        align: 'center',
        fixed: 'left',
        render: (_, record) => (
          <Space size={0}>
            <Button type="link">
              详情
            </Button>
            <Dropdown
              trigger={['hover']}
              menu={{
                items: [
                  { key: 'review', label: '重新复核' },
                  { key: 'log', label: '查看日志' },
                ],
                onClick: ({ key }) => {
                  if (key === 'review') {
                    openReviewModal(record);
                    return;
                  }

                  message.info(`正在查看「${record.name}」的复核日志`);
                },
              }}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        ),
      },
      {
        title: '基础信息',
        children: [
          {
            title: '店铺',
            dataIndex: 'storeName',
            width: 160,
            render: (storeName: string) => <Typography.Text style={{ whiteSpace: 'pre-line' }}>{storeName}</Typography.Text>,
          },
          {
            title: '营销方案名称',
            dataIndex: 'marketingPlan',
            width: 160,
          },
          {
            title: 'SKU集商品ID',
            dataIndex: 'skuProductId',
            width: 170,
            render: (id: string) => (
              <div className="audit-copyable-cell">
                <Tooltip title={id}>
                  <Typography.Text ellipsis className="audit-copyable-text">
                    {id}
                  </Typography.Text>
                </Tooltip>
                <Button
                  className="audit-copyable-button"
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(id);
                    message.success('SKU集商品ID 已复制');
                  }}
                />
              </div>
            ),
          },
          {
            title: 'Omall商品ID',
            dataIndex: 'omallProductId',
            width: 170,
            render: (id: string) => (
              <div className="audit-copyable-cell">
                <Tooltip title={id}>
                  <Typography.Text ellipsis className="audit-copyable-text">
                    {id}
                  </Typography.Text>
                </Tooltip>
                <Button
                  className="audit-copyable-button"
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(id);
                    message.success('Omall商品ID 已复制');
                  }}
                />
              </div>
            ),
          },
          {
            title: '营销中心商品名称',
            dataIndex: 'name',
            width: 320,
            render: (name: string) => (
              <div className="audit-product-name-cell">
                <Tooltip title={name}>
                  <Typography.Text strong ellipsis className="audit-product-name-text">
                    {name}
                  </Typography.Text>
                </Tooltip>
                <Button
                  className="audit-product-name-copy"
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(name);
                    message.success('商品名称已复制');
                  }}
                />
              </div>
            ),
          },
          {
            title: '关联类型',
            dataIndex: 'associationType',
            width: 150,
            render: (type: AssociationType) => <Tag color={associationTypeColorMap[type]}>{type}</Tag>,
          },
          {
            title: '商品类型',
            dataIndex: 'productCategory',
            width: 130,
          },
          {
            title: '下次复核时间(CN)',
            dataIndex: 'nextReviewTime',
            width: 170,
            render: (time?: string) => time || '/',
          },
        ],
      },
      {
        title: '最近复核时间',
        dataIndex: 'latestAuditTime',
        width: 170,
      },
    ];
  }, []);

  const productVisualColumns: ColumnsType<AuditObject> = useMemo(() => {
    const [, baseInfoColumn, latestAuditTimeColumn] = columns;
    const baseInfoGroupColumn = baseInfoColumn as typeof baseInfoColumn & { children?: ColumnsType<AuditObject> };
    const productActionColumn: ColumnsType<AuditObject>[number] = {
      title: '操作',
      width: 120,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" onClick={() => setCurrent(record)}>
            详情
          </Button>
          <Dropdown
            trigger={['hover']}
            menu={{
              items: [
                { key: 'review', label: '重新复核' },
                { key: 'log', label: '查看日志' },
              ],
              onClick: ({ key }) => {
                if (key === 'review') {
                  openReviewModal(record);
                  return;
                }

                setLogViewTab('product');
                setCurrentLogRecord(record);
              },
            }}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    };
    const productContentColumns: ColumnsType<AuditObject> = [
      {
        title: '商品标题',
        dataIndex: 'contentStatus',
        width: 100,
        align: 'center' as const,
        render: (_, record) => renderProductContentStatus(record, 'productTitle', '商品标题'),
      },
      {
        title: '商品主图',
        dataIndex: 'contentStatus',
        width: 100,
        align: 'center' as const,
        render: (_, record) => renderProductContentStatus(record, 'productMainImage', '商品主图'),
      },
      {
        title: '商品副标题',
        dataIndex: 'contentStatus',
        width: 100,
        align: 'center' as const,
        render: (_, record) => renderProductContentStatus(record, 'productSubtitle', '商品副标题'),
      },
      {
        title: '商品详情',
        dataIndex: 'contentStatus',
        width: 100,
        align: 'center' as const,
        render: (_, record) => renderProductContentStatus(record, 'productDetail', '商品详情'),
      },
      {
        title: '商品SKU详情',
        dataIndex: 'contentStatus',
        width: 110,
        align: 'center' as const,
        render: (_, record) => renderProductContentStatus(record, 'productSkuDetail', '商品SKU详情'),
      },
      {
        title: '商品链接',
        dataIndex: 'contentStatus',
        width: 100,
        align: 'center' as const,
        render: (_, record) => renderProductContentStatus(record, 'productLink', '商品链接'),
      },
    ];

    return [
      productActionColumn,
      {
        ...baseInfoGroupColumn,
        children: baseInfoGroupColumn.children || [],
      },
      {
        title: '复核页面1',
        children: productContentColumns,
      },
      latestAuditTimeColumn,
    ];
  }, [columns]);

  const pageVisualColumns: ColumnsType<AuditObject> = useMemo(() => {
    const pageActionColumn: ColumnsType<AuditObject>[number] = {
      title: '操作',
      width: 120,
      align: 'center' as const,
      fixed: 'left' as const,
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" onClick={() => setCurrent(record)}>
            详情
          </Button>
          <Dropdown
            trigger={['hover']}
            menu={{
              items: [
                { key: 'review', label: '重新复核' },
                { key: 'log', label: '查看日志' },
              ],
              onClick: ({ key }) => {
                if (key === 'review') {
                  openReviewModal(record);
                  return;
                }

                setLogViewTab('page');
                setCurrentLogRecord(record);
              },
            }}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    };

    return [
      pageActionColumn,
      {
        title: '基本信息',
        children: [
          {
            title: '年月',
            dataIndex: 'yearMonth',
            width: 120,
          },
          {
            title: '店铺',
            dataIndex: 'storeName',
            width: 140,
            render: (storeName: string) => <Typography.Text style={{ whiteSpace: 'pre-line' }}>{storeName}</Typography.Text>,
          },
          {
            title: '页面ID',
            dataIndex: 'pageId',
            width: 200,
            render: (id?: string) => (
              <div className="audit-copyable-cell">
                <Tooltip title={id}>
                  <Typography.Text ellipsis className="audit-copyable-text">
                    {id || '-'}
                  </Typography.Text>
                </Tooltip>
                {id && (
                  <Button
                    className="audit-copyable-button"
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(id);
                      message.success('页面ID 已复制');
                    }}
                  />
                )}
              </div>
            ),
          },
          {
            title: '页面名称',
            dataIndex: 'pageName',
            width: 220,
            render: (name?: string) => (
              <Tooltip title={name}>
                <Typography.Text strong ellipsis>
                  {name || '-'}
                </Typography.Text>
              </Tooltip>
            ),
          },
          {
            title: '页面启用时间',
            dataIndex: 'pageEnabledTime',
            width: 170,
          },
        ],
      },
      {
        title: '文本复核',
        children: pageVisualCheckTypes.slice(0, 4).map((checkType) => ({
          title: checkType,
          dataIndex: 'pageVisualStatus',
          width: 130,
          align: 'center' as const,
          render: (_: unknown, record: AuditObject) => renderPageVisualContentStatus(record, checkType),
        })),
      },
      {
        title: '图片复核',
        children: pageVisualCheckTypes.slice(4, 9).map((checkType) => ({
          title: checkType,
          dataIndex: 'pageVisualStatus',
          width: 130,
          align: 'center' as const,
          render: (_: unknown, record: AuditObject) => renderPageVisualContentStatus(record, checkType),
        })),
      },
      {
        title: '有效性检查',
        children: pageVisualCheckTypes.slice(9, 10).map((checkType) => ({
          title: checkType,
          dataIndex: 'pageVisualStatus',
          width: 130,
          align: 'center' as const,
          render: (_: unknown, record: AuditObject) => renderPageVisualContentStatus(record, checkType),
        })),
      },
      {
        title: '布局复核',
        children: pageVisualCheckTypes.slice(10).map((checkType) => ({
          title: checkType,
          dataIndex: 'pageVisualStatus',
          width: 130,
          align: 'center' as const,
          render: (_: unknown, record: AuditObject) => renderPageVisualContentStatus(record, checkType),
        })),
      },
      {
        title: '最近复核时间',
        dataIndex: 'latestAuditTime',
        width: 170,
      },
    ];
  }, [columns]);

  const riskColumns: ColumnsType<RiskDisplayItem> = [
    {
      title: '字段名',
      dataIndex: 'fieldName',
      width: 130,
      filters: detailFieldNameFilters,
      filterSearch: true,
      onFilter: (value, record) => record.fieldName === String(value),
      render: (fieldName: string) => <Typography.Text strong>{fieldName}</Typography.Text>,
    },
    {
      title: '问题描述',
      dataIndex: 'description',
      width: '36%',
    },
    {
      title: '风险等级',
      dataIndex: 'level',
      width: 120,
      render: (level: RiskDisplayItem['level']) => <Tag color={riskColorMap[level]}>{level}</Tag>,
    },
    {
      title: 'AI 建议修改内容',
      dataIndex: 'suggestion',
    },
    {
      title: '最近复核时间',
      dataIndex: 'latestAuditTime',
      width: 170,
      filters: detailReviewTimeFilters,
      filterSearch: true,
      onFilter: (value, record) => record.latestAuditTime === String(value),
    },
    {
      title: '操作',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button type="link" onClick={() => message.success(`已提交「${record.fieldName}」复核`)}>
          复核
        </Button>
      ),
    },
  ];

  const reviewPendingColumns: ColumnsType<{ id: string; fieldName: string; status: '复核中'; latestAuditTime: string }> = [
    {
      title: '字段名',
      dataIndex: 'fieldName',
      filters: detailFieldNameFilters,
      filterSearch: true,
      onFilter: (value, record) => record.fieldName === String(value),
      render: (fieldName: string) => <Typography.Text strong>{fieldName}</Typography.Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status: '复核中') => <Tag color={statusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '最近复核时间',
      dataIndex: 'latestAuditTime',
      width: 170,
      filters: detailReviewTimeFilters,
      filterSearch: true,
      onFilter: (value, record) => record.latestAuditTime === String(value),
    },
  ];

  const reviewFailedColumns: ColumnsType<{ id: string; fieldName: string; status: '复核失败'; failedReason: string; latestAuditTime: string }> = [
    {
      title: '字段名',
      dataIndex: 'fieldName',
      width: 160,
      filters: detailFieldNameFilters,
      filterSearch: true,
      onFilter: (value, record) => record.fieldName === String(value),
      render: (fieldName: string) => <Typography.Text strong>{fieldName}</Typography.Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status: '复核失败') => <Tag color={statusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '失败原因',
      dataIndex: 'failedReason',
    },
    {
      title: '最近复核时间',
      dataIndex: 'latestAuditTime',
      width: 170,
      filters: detailReviewTimeFilters,
      filterSearch: true,
      onFilter: (value, record) => record.latestAuditTime === String(value),
    },
    {
      title: '操作',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button type="link" onClick={() => message.success(`已提交「${record.fieldName}」复核`)}>
          复核
        </Button>
      ),
    },
  ];

  const resetFilters = () => {
    setKeyword('');
    setStoreName(undefined);
    setMarketingPlan(undefined);
    setProductCategory(undefined);
  };

  const openReviewModal = (record: AuditObject) => {
    setReviewRecord(record);
    setReviewItem(undefined);
    setReviewModalVisible(true);
  };

  const handleReviewConfirm = () => {
    if (!reviewItem || reviewItem.length === 0) {
      message.warning('请选择复核事项');
      return;
    }
    message.success(`已提交「${reviewRecord?.name}」重新复核，复核事项：${reviewItem.join('、')}`);
    setReviewModalVisible(false);
    setReviewRecord(null);
    setReviewItem(undefined);
  };

  const logColumns: ColumnsType<LogRecord> = [
    {
      title: '复核年月',
      dataIndex: 'yearMonth',
      width: 100,
    },
    {
      title: '店铺',
      dataIndex: 'storeName',
      width: 160,
      render: (storeName: string) => <Typography.Text style={{ whiteSpace: 'pre-line' }}>{storeName}</Typography.Text>,
    },
    {
      title: '复核ID',
      dataIndex: 'reviewId',
      width: 200,
      render: (id: string) => (
        <div className="audit-copyable-cell">
          <Tooltip title={id}>
            <Typography.Text ellipsis className="audit-copyable-text">
              {id}
            </Typography.Text>
          </Tooltip>
          <Button
            className="audit-copyable-button"
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(id);
              message.success('复核ID 已复制');
            }}
          />
        </div>
      ),
    },
    {
      title: '复核参数',
      dataIndex: 'reviewParameters',
      width: 300,
      render: (text: string) => (
        <Tooltip title={text}>
          <Typography.Text ellipsis style={{ maxWidth: 280 }}>
            {text || '-'}
          </Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: '复核结果',
      dataIndex: 'reviewResult',
      width: 300,
      render: (text: string) => (
        <Tooltip title={text}>
          <Typography.Text ellipsis style={{ maxWidth: 280 }}>
            {text || '-'}
          </Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: 'traceId',
      dataIndex: 'traceId',
      width: 220,
      render: (id: string) => (
        <div className="audit-copyable-cell">
          <Tooltip title={id}>
            <Typography.Text ellipsis className="audit-copyable-text">
              {id || '-'}
            </Typography.Text>
          </Tooltip>
          {id && (
            <Button
              className="audit-copyable-button"
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(id);
                message.success('traceId 已复制');
              }}
            />
          )}
        </div>
      ),
    },
    {
      title: '下推状态',
      dataIndex: 'pushStatus',
      width: 100,
      align: 'center',
      render: (status: PushStatus) => <Tag color={logPushStatusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '复核状态',
      dataIndex: 'reviewStatus',
      width: 100,
      align: 'center',
      render: (status: LogReviewStatus) => <Tag color={logReviewStatusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '失败原因',
      dataIndex: 'failureReason',
      width: 300,
      render: (text: string) => (
        <Tooltip title={text}>
          <Typography.Text ellipsis style={{ maxWidth: 280 }}>
            {text || '-'}
          </Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: '复核人',
      dataIndex: 'reviewer',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '复核时间',
      dataIndex: 'reviewTime',
      width: 180,
      render: (text: string) => text || '-',
    },
  ];

  const productLogColumns: ColumnsType<LogRecord> = [
    {
      title: '营销方案ID',
      dataIndex: 'marketingPlanId',
      width: 200,
      render: (id?: string) => (
        <div className="audit-copyable-cell">
          <Tooltip title={id}>
            <Typography.Text ellipsis className="audit-copyable-text">
              {id || '-'}
            </Typography.Text>
          </Tooltip>
          {id && (
            <Button
              className="audit-copyable-button"
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(id);
                message.success('营销方案ID 已复制');
              }}
            />
          )}
        </div>
      ),
    },
    {
      title: '追踪ID',
      dataIndex: 'traceId',
      width: 220,
      render: (id: string) => (
        <div className="audit-copyable-cell">
          <Tooltip title={id}>
            <Typography.Text ellipsis className="audit-copyable-text">
              {id || '-'}
            </Typography.Text>
          </Tooltip>
          {id && (
            <Button
              className="audit-copyable-button"
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(id);
                message.success('追踪ID 已复制');
              }}
            />
          )}
        </div>
      ),
    },
    {
      title: '活动商品ID',
      dataIndex: 'reviewId',
      width: 200,
      render: (id: string) => (
        <div className="audit-copyable-cell">
          <Tooltip title={id}>
            <Typography.Text ellipsis className="audit-copyable-text">
              {id}
            </Typography.Text>
          </Tooltip>
          <Button
            className="audit-copyable-button"
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(id);
              message.success('活动商品ID 已复制');
            }}
          />
        </div>
      ),
    },
    {
      title: '下推状态',
      dataIndex: 'pushStatus',
      width: 100,
      align: 'center',
      render: (status: PushStatus) => <Tag color={logPushStatusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '复核状态',
      dataIndex: 'reviewStatus',
      width: 100,
      align: 'center',
      render: (status: LogReviewStatus) => <Tag color={logReviewStatusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '本次推送的ID',
      dataIndex: 'pushId',
      width: 200,
      render: (id?: string) => (
        <div className="audit-copyable-cell">
          <Tooltip title={id}>
            <Typography.Text ellipsis className="audit-copyable-text">
              {id || '-'}
            </Typography.Text>
          </Tooltip>
          {id && (
            <Button
              className="audit-copyable-button"
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(id);
                message.success('本次推送的ID 已复制');
              }}
            />
          )}
        </div>
      ),
    },
    {
      title: '复核人',
      dataIndex: 'reviewer',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '复核结果',
      dataIndex: 'reviewResult',
      width: 300,
      render: (text: string) => (
        <Tooltip title={text}>
          <Typography.Text ellipsis style={{ maxWidth: 280 }}>
            {text || '-'}
          </Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: '复核参数',
      dataIndex: 'reviewParameters',
      width: 300,
      render: (text: string) => (
        <Tooltip title={text}>
          <Typography.Text ellipsis style={{ maxWidth: 280 }}>
            {text || '-'}
          </Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: '失败原因',
      dataIndex: 'failureReason',
      width: 300,
      render: (text: string) => (
        <Tooltip title={text}>
          <Typography.Text ellipsis style={{ maxWidth: 280 }}>
            {text || '-'}
          </Typography.Text>
        </Tooltip>
      ),
    },
    {
      title: '复核时间',
      dataIndex: 'reviewTime',
      width: 180,
      render: (text: string) => text || '-',
    },
  ];
  if (current) {
    const isPageType = current.type === '页面';

    const cardTitle = (
      <Space>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => setCurrent(null)}
        />
        <Typography.Text strong>复核页面1</Typography.Text>
      </Space>
    );

    const renderPageVisualDetailTables = (failedProductField?: string) => (
      <>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>复核状态：</span>
          <Select
            mode="multiple"
            value={pageDetailStatusFilter}
            onChange={(value: ContentStatus[]) => setPageDetailStatusFilter(value)}
            options={[
              { label: '复核通过', value: 'normal' },
              { label: '复核失败', value: 'abnormal' },
              { label: '未复核', value: 'unknown' },
              { label: '无需复核', value: 'empty' },
            ]}
            style={{ width: 400 }}
            placeholder="选择复核状态"
            allowClear
          />
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {pageVisualDetailFields.map((field) => {
            let overallStatus: ContentStatus = current.pageVisualStatus?.[field.key as keyof typeof current.pageVisualStatus] || 'unknown';
            const productFailureOverrideInfo = failedProductField ? productFailureOverride[failedProductField] : null;
            if (failedProductField && field.name === '语言书写错误检查') {
              overallStatus = 'abnormal';
            }
            const subFields = pageVisualSubFields[field.name] || [];
            const failureInfo = overallStatus === 'abnormal' ? (productFailureOverrideInfo || pageVisualFailureInfo[field.name]) : null;

            const tableData = subFields
              .map((subField, index) => {
                let itemStatus: ContentStatus = subField.defaultStatus;
                if (overallStatus === 'abnormal' && index === 0) {
                  itemStatus = 'abnormal';
                } else if (overallStatus === 'unknown') {
                  itemStatus = 'unknown';
                } else if (overallStatus === 'empty') {
                  itemStatus = 'empty';
                }
                const config = contentStatusConfig[itemStatus];
                return {
                  key: `${field.key}-${index}`,
                  fieldName: subField.fieldName,
                  mallData: subField.mallData,
                  statusLabel: config.label,
                  statusColor: config.color,
                  itemStatus,
                  reason: itemStatus === 'abnormal' ? (failureInfo?.reason || '-') : '-',
                  suggestion: itemStatus === 'abnormal' ? (failureInfo?.suggestion || '-') : '-',
                };
              })
              .filter((row) => pageDetailStatusFilter.includes(row.itemStatus));

            if (tableData.length === 0) return null;

            return (
              <div key={field.key}>
                <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                  {field.name}
                </Typography.Text>
                <Table
                  columns={[
                    { title: (field.name === '模块完整性' || field.name === '排版/布局异常') ? '模块' : '字段名', dataIndex: 'fieldName', width: 120 },
                    { title: '商城数据', dataIndex: 'mallData', width: 200 },
                    { title: '复核状态', dataIndex: 'statusLabel', width: 100, render: (text: string, record: { statusColor: string }) => <span style={{ color: record.statusColor }}>{text}</span> },
                    { title: '原因', dataIndex: 'reason', width: 250 },
                    { title: 'AI建议修改', dataIndex: 'suggestion', width: 250 },
                  ]}
                  dataSource={tableData}
                  pagination={{ pageSize: 5, showSizeChanger: false, showTotal: (total: number) => `共 ${total} 条` }}
                  size="small"
                />
              </div>
            );
          })}
        </Space>
      </>
    );

    if (isPageType) {
      return (
        <Card title={cardTitle}>
          {renderPageVisualDetailTables()}
        </Card>
      );
    }

    return (
      <Card title={cardTitle}>
        <Tabs
          defaultActiveKey="product-info"
          items={[
            {
              key: 'product-info',
              label: '商品信息',
              children: (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ marginRight: 8 }}>复核状态：</span>
                    <Select
                      mode="multiple"
                      value={pageDetailStatusFilter}
            onChange={(value: ContentStatus[]) => setPageDetailStatusFilter(value)}
            options={[
              { label: '复核通过', value: 'normal' },
              { label: '复核失败', value: 'abnormal' },
              { label: '未复核', value: 'unknown' },
              { label: '无需复核', value: 'empty' },
            ]}
            style={{ width: 400 }}
            placeholder="选择复核状态"
            allowClear
          />
        </div>
        <Table
          columns={[
            { title: '字段名', dataIndex: 'fieldName', width: 120 },
            { title: '商城数据', dataIndex: 'mallData', width: 200 },
            { title: '复核状态', dataIndex: 'statusLabel', width: 100, render: (text: string, record: { statusColor: string }) => <span style={{ color: record.statusColor }}>{text}</span> },
            { title: '原因', dataIndex: 'reason', width: 250 },
            { title: 'AI建议修改方式', dataIndex: 'suggestion', width: 250 },
          ]}
          dataSource={productContentFields.filter((f) => f.key !== 'productDetail' && f.key !== 'productSkuDetail').map((field) => {
            const overallStatus: ContentStatus = current.contentStatus?.[field.key as keyof typeof current.contentStatus] || 'unknown';
            const subFields = productSubFields[field.key] || [];
            const riskItem = overallStatus === 'abnormal'
              ? Object.values(current.risks).flat().find((risk) => risk.fieldName.includes(field.name))
              : null;
            const failureReason = riskItem?.description || '当前字段复核失败，请检查商城内容。';
            const aiSuggestion = riskItem?.suggestion || '建议检查并修正相关内容。';
            const config = contentStatusConfig[overallStatus];
            return {
              key: field.key,
              fieldName: field.name,
              mallData: subFields[0]?.mallData || '-',
              statusLabel: config.label,
              statusColor: config.color,
              itemStatus: overallStatus,
              reason: overallStatus === 'abnormal' ? failureReason : '-',
              suggestion: overallStatus === 'abnormal' ? aiSuggestion : '-',
            };
          }).filter((row) => pageDetailStatusFilter.includes(row.itemStatus))}
          pagination={{ pageSize: 5, showSizeChanger: false, showTotal: (total: number) => `共 ${total} 条` }}
          size="small"
        />
              </>
              ),
            },
            {
              key: 'product-detail-page',
              label: '商品详情页',
              children: renderPageVisualDetailTables(current.contentStatus?.productDetail === 'abnormal' ? '商品详情' : undefined),
            },
            {
              key: 'product-sku-detail-page',
              label: '商品SKU详情页',
              children: renderPageVisualDetailTables(current.contentStatus?.productSkuDetail === 'abnormal' ? '商品SKU详情' : undefined),
            },
          ]}
        />
      </Card>
    );
  }

  // 日志页：复核日志
  if (currentLogRecord) {
    const isProductLog = logViewTab === 'product';
    return (
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => {
                setCurrentLogRecord(null);
                setLogTraceId('');
                setLogPushStatus(undefined);
                setLogReviewStatus(undefined);
              }}
            />
            <Typography.Text strong>复核日志</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
              {currentLogRecord.name}
            </Typography.Text>
          </Space>
        }
      >
        {isProductLog ? (
          <Space wrap className="audit-filter-bar">
            <Input
              allowClear
              value={logTraceId}
              placeholder="请输入追踪ID"
              onChange={(event) => setLogTraceId(event.target.value)}
              style={{ width: 240 }}
            />
            <Select
              value={logPushStatus || ''}
              onChange={(value) => setLogPushStatus(value || undefined)}
              options={[
                { label: '全部', value: '' },
                { label: '已下推', value: '已下推' },
                { label: '未下推', value: '未下推' },
              ]}
              style={{ width: 140 }}
            />
            <Select
              value={logReviewStatus || ''}
              onChange={(value) => setLogReviewStatus(value || undefined)}
              options={[
                { label: '全部', value: '' },
                { label: '已复核', value: '已复核' },
                { label: '未复核', value: '未复核' },
                { label: '复核中', value: '复核中' },
              ]}
              style={{ width: 140 }}
            />
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button
              onClick={() => {
                setLogTraceId('');
                setLogPushStatus(undefined);
                setLogReviewStatus(undefined);
              }}
            >
              重置
            </Button>
          </Space>
        ) : (
          <Space wrap className="audit-filter-bar">
            <Input.Search
              allowClear
              value={logTraceId}
              placeholder="请输入追踪ID"
              onSearch={setLogTraceId}
              onChange={(event) => setLogTraceId(event.target.value)}
              style={{ width: 240 }}
            />
            <Select
              allowClear
              value={logPushStatus}
              placeholder="下推状态"
              onChange={setLogPushStatus}
              options={[
                { label: '已下推', value: '已下推' },
                { label: '未下推', value: '未下推' },
              ]}
              style={{ width: 140 }}
            />
            <Select
              allowClear
              value={logReviewStatus}
              placeholder="复核状态"
              onChange={setLogReviewStatus}
              options={[
                { label: '已复核', value: '已复核' },
                { label: '未复核', value: '未复核' },
                { label: '复核中', value: '复核中' },
              ]}
              style={{ width: 140 }}
            />
            <Button
              onClick={() => {
                setLogTraceId('');
                setLogPushStatus(undefined);
                setLogReviewStatus(undefined);
              }}
            >
              重置
            </Button>
          </Space>
        )}
        <Table
          rowKey="id"
          columns={isProductLog ? productLogColumns : logColumns}
          dataSource={filteredLogRecords}
          scroll={{ x: isProductLog ? 2400 : 2200 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    );
  }
  const renderListCard = (tableColumns: ColumnsType<AuditObject>, scrollX = 2900) => (
    <Card>
      <Space wrap className="audit-filter-bar">
        <Input.Search
          allowClear
          value={keyword}
          placeholder="搜索名称、类型或店铺"
          onSearch={setKeyword}
          onChange={(event) => setKeyword(event.target.value)}
          style={{ width: 240 }}
        />
        <Select
          allowClear
          value={storeName}
          placeholder="店铺名称"
          onChange={setStoreName}
          options={storeOptions.map((value) => ({ label: value, value }))}
          style={{ width: 180 }}
        />
        <Select
          allowClear
          value={marketingPlan}
          placeholder="营销方案"
          onChange={setMarketingPlan}
          options={marketingPlanOptions.map((value) => ({ label: value, value }))}
          style={{ width: 180 }}
        />
        <Select
          allowClear
          value={productCategory}
          placeholder="商品类型"
          onChange={setProductCategory}
          options={productCategoryOptions.map((value) => ({ label: value, value }))}
          style={{ width: 160 }}
        />
        <Button onClick={resetFilters}>重置</Button>
      </Space>
      <Space wrap className="audit-action-bar">
        <Button type="primary" disabled={!selectedRowKeys.length} onClick={runBatchReview}>
          一键复核
        </Button>
        <Button onClick={exportAuditData}>导出</Button>
      </Space>
      <Table
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        columns={tableColumns}
        dataSource={filteredAuditObjects}
        scroll={{ x: scrollX }}
        pagination={{ pageSize: 6 }}
      />
    </Card>
  );

  const renderPageListCard = () => (
    <Card>
      <Space wrap className="audit-filter-bar">
        <Input.Search
          allowClear
          value={pageKeyword}
          placeholder="搜索页面名称、页面ID或店铺"
          onSearch={setPageKeyword}
          onChange={(event) => setPageKeyword(event.target.value)}
          style={{ width: 260 }}
        />
        <Select
          allowClear
          value={pageStore}
          placeholder="店铺"
          onChange={setPageStore}
          options={pageStoreOptions.map((value) => ({ label: value, value }))}
          style={{ width: 160 }}
        />
        <Select
          allowClear
          value={pageYearMonth}
          placeholder="年月"
          onChange={setPageYearMonth}
          options={pageYearMonthOptions.map((value) => ({ label: value, value }))}
          style={{ width: 140 }}
        />
        <Button
          onClick={() => {
            setPageKeyword('');
            setPageStore(undefined);
            setPageYearMonth(undefined);
          }}
        >
          重置
        </Button>
      </Space>
      <Space wrap className="audit-action-bar">
        <Button type="primary" disabled={!selectedRowKeys.length} onClick={runBatchReview}>
          一键复核
        </Button>
        <Button onClick={exportAuditData}>导出</Button>
      </Space>
      <Table
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        columns={pageVisualColumns}
        dataSource={filteredPageAuditObjects}
        scroll={{ x: 2800 }}
        pagination={{ pageSize: 6 }}
      />
    </Card>
  );

  return (
    <>
      <Tabs
        className="audit-top-tabs"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'product-visual-audit',
            label: '商品视觉复核',
            children: renderListCard(productVisualColumns, 4050),
          },
          {
            key: 'page-visual-audit',
            label: '页面视觉复核',
            children: renderPageListCard(),
          },
        ]}
      />
      <Modal
        title="重新复核"
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          setReviewRecord(null);
          setReviewItem(undefined);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setReviewModalVisible(false);
            setReviewRecord(null);
            setReviewItem(undefined);
          }}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={handleReviewConfirm}>
            确定
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="复核事项" required>
            <Select
              mode="multiple"
              value={reviewItem}
              onChange={setReviewItem}
              placeholder="请选择复核事项"
              options={
                activeTab === 'product-visual-audit'
                  ? productContentFields.map((field) => ({ label: field.name, value: field.name }))
                  : pageVisualCheckTypes.map((type) => ({ label: type, value: type }))
              }
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
