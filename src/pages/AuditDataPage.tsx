import { ArrowLeftOutlined, CheckSquareFilled, CloseOutlined, CopyOutlined, MinusOutlined, MoreOutlined, QuestionOutlined } from '@ant-design/icons';
import { Button, Card, Collapse, Divider, Dropdown, Empty, Input, Modal, Select, Space, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Key, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { auditObjects, auditTypes, pageVisualCheckTypes, type AuditObject, type AuditStatus, type AssociationType, type AuditType, type ContentStatus, type ObjectType, type RiskItem, type RiskLevel } from '../mock/auditData';

const typeColorMap: Record<ObjectType, string> = {
  商品: 'blue',
  页面: 'purple',
  广告: 'cyan',
};

const associationTypeColorMap: Record<AssociationType, string> = {
  新创建商品: 'blue',
  关联OMALL主商品: 'green',
};

const contentStatusConfig: Record<ContentStatus, { icon: ReactNode; label: string }> = {
  normal: { icon: <CheckSquareFilled style={{ color: '#52c41a', fontSize: 18 }} />, label: '正常' },
  abnormal: { icon: <CloseOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />, label: '异常' },
  unknown: { icon: <QuestionOutlined style={{ color: '#8c8c8c', fontSize: 18 }} />, label: '未知' },
  empty: { icon: <MinusOutlined style={{ color: '#8c8c8c', fontSize: 18 }} />, label: '无' },
};

function renderContentStatus(status: ContentStatus | undefined) {
  if (!status) return '-';
  const config = contentStatusConfig[status];
  return <Tooltip title={config.label}>{config.icon}</Tooltip>;
}

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
  const [reviewStatus, setReviewStatus] = useState<AuditStatus>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [pageKeyword, setPageKeyword] = useState('');
  const [pageStore, setPageStore] = useState<string>();
  const [pageYearMonth, setPageYearMonth] = useState<string>();
  const [pageReviewStatus, setPageReviewStatus] = useState<AuditStatus>();

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
        (!productCategory || item.productCategory === productCategory) &&
        (!reviewStatus || item.reviewStatus === reviewStatus)
      );
    });
  }, [keyword, marketingPlan, productAuditObjects, productCategory, reviewStatus, storeName]);

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
        (!pageYearMonth || item.yearMonth === pageYearMonth) &&
        (!pageReviewStatus || item.reviewStatus === pageReviewStatus)
      );
    });
  }, [pageKeyword, pageStore, pageYearMonth, pageReviewStatus, pageAuditObjects]);

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
                    Modal.confirm({
                      title: '确认重新复核？',
                      content: `将对「${record.name}」重新提交复核，确认继续吗？`,
                      okText: '确认复核',
                      cancelText: '取消',
                      onOk: () => message.success(`已提交「${record.name}」重新复核`),
                    });
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
    const [actionColumn, baseInfoColumn, latestAuditTimeColumn] = columns;
    const baseInfoGroupColumn = baseInfoColumn as typeof baseInfoColumn & { children?: ColumnsType<AuditObject> };
    const productContentColumns: ColumnsType<AuditObject> = [
      {
        title: '商品标题',
        dataIndex: 'contentStatus',
        width: 100,
        align: 'center' as const,
        render: (_, record) => renderContentStatus(record.contentStatus?.productTitle),
      },
      {
        title: '商品主图',
        dataIndex: 'contentStatus',
        width: 100,
        align: 'center' as const,
        render: (_, record) => renderContentStatus(record.contentStatus?.productMainImage),
      },
      {
        title: '商品副标题',
        dataIndex: 'contentStatus',
        width: 100,
        align: 'center' as const,
        render: (_, record) => renderContentStatus(record.contentStatus?.productSubtitle),
      },
      {
        title: '商品详情',
        dataIndex: 'contentStatus',
        width: 100,
        align: 'center' as const,
        render: (_, record) => renderContentStatus(record.contentStatus?.productDetail),
      },
      {
        title: '商品链接',
        dataIndex: 'contentStatus',
        width: 100,
        align: 'center' as const,
        render: (_, record) => renderContentStatus(record.contentStatus?.productLink),
      },
    ];

    return [
      actionColumn,
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
    const [actionColumn] = columns;
    return [
      actionColumn,
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
        title: '图片复核',
        children: pageVisualCheckTypes.slice(0, 5).map((checkType) => ({
          title: checkType,
          dataIndex: 'pageVisualStatus',
          width: 130,
          align: 'center' as const,
          render: (_: unknown, record: AuditObject) => renderContentStatus(record.pageVisualStatus?.[checkType]),
        })),
      },
      {
        title: '文本复核',
        children: pageVisualCheckTypes.slice(5, 10).map((checkType) => ({
          title: checkType,
          dataIndex: 'pageVisualStatus',
          width: 130,
          align: 'center' as const,
          render: (_: unknown, record: AuditObject) => renderContentStatus(record.pageVisualStatus?.[checkType]),
        })),
      },
      {
        title: '布局复核',
        children: pageVisualCheckTypes.slice(10).map((checkType) => ({
          title: checkType,
          dataIndex: 'pageVisualStatus',
          width: 130,
          align: 'center' as const,
          render: (_: unknown, record: AuditObject) => renderContentStatus(record.pageVisualStatus?.[checkType]),
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
    setReviewStatus(undefined);
  };

  // 详情页：整页展示
  if (current) {
    const riskyAuditTypes = auditTypes.filter((auditType) => current.risks[auditType]?.length);
    const noRiskAuditTypes = auditTypes.filter((auditType) => !current.risks[auditType]?.length);
    const pendingRows = auditTypes.map((auditType) => ({
      id: `${current.id}-${auditType}-pending`,
      fieldName: auditType,
      status: '复核中' as const,
      latestAuditTime: current.latestAuditTime,
    }));
    const failedRows = auditTypes
      .flatMap((auditType) => current.risks[auditType].map((risk) => ({ auditType, risk })))
      .filter(({ risk }) => risk.level === '高风险')
      .map(({ auditType, risk }) => ({
        id: `${current.id}-${risk.id}-failed`,
        fieldName: risk.fieldName || auditType,
        status: '复核失败' as const,
        failedReason: risk.description,
        latestAuditTime: current.latestAuditTime,
      }));
    const reviewSuccessContent = (
      <>
        <Typography.Title level={5}>有风险字段</Typography.Title>
        {riskyAuditTypes.length ? (
          <Tabs
            items={riskyAuditTypes.map((auditType) => {
              const highRiskCount = getRiskCount(current, auditType).high;

              return {
                key: auditType,
                label: (
                  <Space size={6}>
                    <span>{auditType}</span>
                    <span className="tab-high-risk-count">（高风险 {highRiskCount}）</span>
                  </Space>
                ),
                children: (
                  <Table
                    rowKey="id"
                    columns={riskColumns}
                    dataSource={current.risks[auditType].map((risk) => ({
                      ...risk,
                      latestAuditTime: current.latestAuditTime,
                    }))}
                    pagination={false}
                  />
                ),
              };
            })}
          />
        ) : (
          <Empty description="暂无风险字段" />
        )}

        <Divider />

        <Typography.Title level={5}>无风险字段</Typography.Title>
        {noRiskAuditTypes.length ? (
          <Collapse
            items={noRiskAuditTypes.map((auditType) => ({
              key: auditType,
              label: auditType,
              children: (
                <Table
                  rowKey="id"
                  columns={riskColumns}
                  dataSource={[
                    {
                      id: `${current.id}-${auditType}-no-risk`,
                      fieldName: auditType,
                      description: '未发现风险问题。',
                      level: '无风险',
                      suggestion: '无需修改。',
                      latestAuditTime: current.latestAuditTime,
                    },
                  ]}
                  pagination={false}
                />
              ),
            }))}
          />
        ) : (
          <Empty description="暂无无风险字段" />
        )}
      </>
    );

    return (
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => setCurrent(null)}
            />
            <Tag color={typeColorMap[current.type]}>{current.type}</Tag>
            <Typography.Text strong>{current.name}</Typography.Text>
          </Space>
        }
      >
        <Tabs
          defaultActiveKey="复核成功"
          items={[
            {
              key: '复核成功',
              label: '复核成功',
              children: reviewSuccessContent,
            },
            {
              key: '复核失败',
              label: '复核失败',
              children: failedRows.length ? (
                <Table rowKey="id" columns={reviewFailedColumns} dataSource={failedRows} pagination={false} />
              ) : (
                <Empty description="暂无复核失败字段" />
              ),
            },
            {
              key: '复核中',
              label: '复核中',
              children: <Table rowKey="id" columns={reviewPendingColumns} dataSource={pendingRows} pagination={false} />,
            },
          ]}
        />
      </Card>
    );
  }

  // 列表页
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
        <Select
          allowClear
          value={reviewStatus}
          placeholder="复核状态"
          onChange={setReviewStatus}
          options={(['复核失败', '复核中', '复核成功'] as AuditStatus[]).map((value) => ({ label: value, value }))}
          style={{ width: 150 }}
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
        <Select
          allowClear
          value={pageReviewStatus}
          placeholder="复核状态"
          onChange={setPageReviewStatus}
          options={(['复核失败', '复核中', '复核成功'] as AuditStatus[]).map((value) => ({ label: value, value }))}
          style={{ width: 150 }}
        />
        <Button
          onClick={() => {
            setPageKeyword('');
            setPageStore(undefined);
            setPageYearMonth(undefined);
            setPageReviewStatus(undefined);
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
    <Tabs
      className="audit-top-tabs"
      defaultActiveKey="product-visual-audit"
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
  );
}
