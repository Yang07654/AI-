import { ArrowLeftOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Input, Space, Table, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import { useEffect, useMemo, useState } from 'react';

interface KnowledgeRuleSection {
  title?: string;
  items: string[];
}

interface KnowledgeRuleRow {
  id: string;
  category: string;
  ruleName: string;
  country?: string;
  creator: string;
  createdAt: string;
  updater: string;
  updatedAt: string;
}

interface KnowledgeRulePageProps {
  title: string;
  sections: KnowledgeRuleSection[];
  showCountry?: boolean;
}

const countryOptions = ['美国', '日本', '新加坡', '西班牙', '奥地利'];

function buildInitialRows(title: string, sections: KnowledgeRuleSection[]): KnowledgeRuleRow[] {
  return sections.flatMap((section, sectionIndex) =>
    section.items.map((item, itemIndex) => {
      const order = sectionIndex * 10 + itemIndex + 1;

      return {
        id: `${title}-${section.title || '默认'}-${item}`,
        category: section.title || title,
        ruleName: item,
        country: countryOptions[(order - 1) % countryOptions.length],
        creator: order % 2 === 0 ? '李婷' : '张明',
        createdAt: `2026-08-${String(1 + (order % 8)).padStart(2, '0')} 10:${String((order * 7) % 60).padStart(2, '0')}`,
        updater: order % 2 === 0 ? '赵敏' : '王磊',
        updatedAt: `2026-08-${String(9 + (order % 2)).padStart(2, '0')} 15:${String((order * 11) % 60).padStart(2, '0')}`,
      };
    }),
  );
}

function exportCsv(title: string, rows: KnowledgeRuleRow[], showCountry?: boolean) {
  const headers = showCountry
    ? ['序号', '规则名称', '国家', '创建人', '创建时间', '修改人', '修改时间']
    : ['序号', '规则名称', '创建人', '创建时间', '修改人', '修改时间'];
  const csvContent = [
    headers,
    ...rows.map((row, index) =>
      showCountry
        ? [index + 1, row.ruleName, row.country || '', row.creator, row.createdAt, row.updater, row.updatedAt]
        : [index + 1, row.ruleName, row.creator, row.createdAt, row.updater, row.updatedAt],
    ),
  ]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${title}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function KnowledgeRulePage({ title, sections, showCountry = false }: KnowledgeRulePageProps) {
  const [keyword, setKeyword] = useState('');
  const [rows, setRows] = useState<KnowledgeRuleRow[]>(() => buildInitialRows(title, sections));
  const [detailRow, setDetailRow] = useState<KnowledgeRuleRow | null>(null);

  useEffect(() => {
    setDetailRow(null);
    setKeyword('');
    setRows(buildInitialRows(title, sections));
  }, [title]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) return rows;

    return rows.filter(
      (row) =>
        row.category.includes(normalizedKeyword) ||
        row.ruleName.includes(normalizedKeyword) ||
        Boolean(row.country?.includes(normalizedKeyword)) ||
        row.creator.includes(normalizedKeyword) ||
        row.updater.includes(normalizedKeyword),
    );
  }, [keyword, rows]);

  const uploadProps: UploadProps = {
    accept: '.csv,.txt',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();

      reader.onload = () => {
        const text = String(reader.result || '');
        const importedRows = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .filter((line, index) => !(index === 0 && line.includes('规则名称')))
          .map((line, index) => {
            const values = line
              .split(',')
              .map((value) => value.trim().replace(/^"|"$/g, ''))
              .filter(Boolean);
            const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
            const category = title;
            const ruleName = values[0];
            const country = showCountry ? values[1] || '美国' : undefined;

            return ruleName
              ? {
                  id: `${title}-import-${Date.now()}-${index}`,
                  category,
                  ruleName,
                  country,
                  creator: '导入用户',
                  createdAt: now,
                  updater: '导入用户',
                  updatedAt: now,
                }
              : null;
          })
          .filter(Boolean) as KnowledgeRuleRow[];

        if (!importedRows.length) {
          message.warning('未识别到可导入的规则数据');
          return;
        }

        setRows((prev) => [...importedRows, ...prev]);
        message.success(`已导入 ${importedRows.length} 条规则`);
      };

      reader.readAsText(file);
      return false;
    },
  };

  const columns: ColumnsType<KnowledgeRuleRow> = [
    {
      title: '序号',
      width: 80,
      render: (_, __, index) => index + 1,
    },
    {
      title: '规则名称',
      dataIndex: 'ruleName',
    },
    ...(showCountry
      ? [
          {
            title: '国家',
            dataIndex: 'country' as keyof KnowledgeRuleRow,
            width: 120,
          },
        ]
      : []),
    {
      title: '创建人',
      dataIndex: 'creator',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
    },
    {
      title: '修改人',
      dataIndex: 'updater',
      width: 120,
    },
    {
      title: '修改时间',
      dataIndex: 'updatedAt',
      width: 170,
    },
    {
      title: '操作',
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: KnowledgeRuleRow) => (
        <Button type="link" onClick={() => setDetailRow(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  // 详情页：整页展示
  if (detailRow) {
    return (
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setDetailRow(null)} />
            <Typography.Text strong>{detailRow.ruleName}</Typography.Text>
          </Space>
        }
      >
        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="规则名称" span={2}>
            {detailRow.ruleName}
          </Descriptions.Item>
          {showCountry ? (
            <Descriptions.Item label="国家">{detailRow.country || '-'}</Descriptions.Item>
          ) : null}
          <Descriptions.Item label="所属页面">{title}</Descriptions.Item>
          <Descriptions.Item label="创建人">{detailRow.creator}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{detailRow.createdAt}</Descriptions.Item>
          <Descriptions.Item label="修改人">{detailRow.updater}</Descriptions.Item>
          <Descriptions.Item label="修改时间">{detailRow.updatedAt}</Descriptions.Item>
        </Descriptions>

        <Typography.Title level={5}>规则详情</Typography.Title>
        <Input.TextArea
          value={`【${detailRow.ruleName}】规则详情\n\n该规则隶属于「${title}」${showCountry ? `，适用国家：${detailRow.country || '-'}。` : '。'}\n\n规则说明：\n本规则用于审核${title}相关内容，确保所有涉及「${detailRow.category}」的内容符合平台合规要求。请运营人员在发布相关内容前，参照本规则进行自查，避免因违规内容导致审核失败或下架处理。\n\n创建人：${detailRow.creator}（${detailRow.createdAt}）\n最后修改人：${detailRow.updater}（${detailRow.updatedAt}）`}
          readOnly
          autoSize={{ minRows: 12, maxRows: 24 }}
          style={{ width: '100%' }}
        />
      </Card>
    );
  }

  // 列表页
  return (
    <Card
      title={title}
      extra={
        <Space wrap>
          <Input.Search
            allowClear
            placeholder={showCountry ? '搜索规则名称、国家或人员' : '搜索规则名称或人员'}
            onSearch={setKeyword}
            onChange={(event) => setKeyword(event.target.value)}
            style={{ width: 280 }}
          />
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>导入</Button>
          </Upload>
          <Button icon={<DownloadOutlined />} onClick={() => exportCsv(title, filteredRows, showCountry)}>
            导出
          </Button>
        </Space>
      }
    >
      <Table rowKey="id" columns={columns} dataSource={filteredRows} pagination={{ pageSize: 8 }} scroll={{ x: showCountry ? 1200 : 1080 }} />
    </Card>
  );
}
