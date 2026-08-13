import { ArrowLeftOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Form, Input, Popconfirm, Select, Space, Table, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import type { RuleConfigColumn, RuleConfigRow } from '../mock/ruleConfigData';

export interface FieldDependency {
  targetField: string;
  mapping: Record<string, string>;
}

export interface KnowledgeRulePageProps {
  title: string;
  columns: RuleConfigColumn[];
  data: RuleConfigRow[];
  uniqueField?: string;
  uniqueLabel?: string;
  requiredFields?: string[];
  fieldOptions?: Record<string, string[]>;
  fieldDependencies?: Record<string, FieldDependency>;
  filterFields?: string[];
}

function exportCsv(title: string, columns: RuleConfigColumn[], rows: RuleConfigRow[]) {
  const headers = columns.map((col) => col.title);
  const csvContent = [
    headers,
    ...rows.map((row) => columns.map((col) => row[col.dataIndex] || '')),
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

export default function KnowledgeRulePage({ title, columns, data, uniqueField, uniqueLabel, requiredFields, fieldOptions, fieldDependencies, filterFields }: KnowledgeRulePageProps) {
  const [keyword, setKeyword] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string | [string, string]>>({});
  const [rows, setRows] = useState<RuleConfigRow[]>(() => data);
  const [detailRow, setDetailRow] = useState<RuleConfigRow | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingRow, setEditingRow] = useState<RuleConfigRow | null>(null);
  const [form] = Form.useForm<Record<string, string>>();

  useEffect(() => {
    setDetailRow(null);
    setFormMode(null);
    setKeyword('');
    setFilterValues({});
    setRows(data);
  }, [title, data]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim();

    return rows.filter((row) => {
      // Keyword search
      if (normalizedKeyword && !columns.some((col) => (row[col.dataIndex] || '').includes(normalizedKeyword))) {
        return false;
      }
      // Filter fields
      for (const [field, value] of Object.entries(filterValues)) {
        if (!value) continue;
        if (field === 'updateTime' && typeof value === 'object') {
          const dateRange = value as [string, string];
          const rowDate = (row[field] || '').slice(0, 10);
          if (dateRange[0] && rowDate < dateRange[0]) return false;
          if (dateRange[1] && rowDate > dateRange[1]) return false;
        } else if (typeof value === 'string' && (row[field] || '') !== value) {
          return false;
        }
      }
      return true;
    });
  }, [keyword, filterValues, rows, columns]);

  const openCreatePage = () => {
    setEditingRow(null);
    setFormMode('create');
  };

  const openEditPage = (record: RuleConfigRow) => {
    setEditingRow(record);
    setFormMode('edit');
  };

  const submitForm = async () => {
    const values = await form.validateFields();
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

    if (uniqueField) {
      const fieldValue = (values[uniqueField] || '').trim();
      if (fieldValue) {
        const duplicate = rows.find(
          (row) =>
            row.id !== editingRow?.id &&
            (row[uniqueField] || '').trim() === fieldValue,
        );
        if (duplicate) {
          message.error(`该${uniqueLabel || '字段'}「${fieldValue}」已存在，每个${uniqueLabel || '字段'}只能新增一条数据`);
          return;
        }
      }
    }

    if (editingRow) {
      setRows((prev) =>
        prev.map((row) =>
          row.id === editingRow.id
            ? { ...row, ...values, updateTime: now, updater: '当前用户' }
            : row,
        ),
      );
      message.success('已更新规则');
    } else {
      const newRow: RuleConfigRow = {
        id: String(Date.now()).slice(-8).padStart(8, '0'),
        ...values,
        updateTime: now,
        updater: '当前用户',
      };
      setRows((prev) => [newRow, ...prev]);
      message.success('已新增规则');
    }

    setFormMode(null);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
    message.success('已删除规则');
  };

  const uploadProps: UploadProps = {
    accept: '.csv,.txt',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();

      reader.onload = () => {
        const text = String(reader.result || '');
        const lines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);

        const headerLine = lines[0] || '';
        const isFirstLineHeader = columns.some((col) => headerLine.includes(col.title));
        const dataLines = isFirstLineHeader ? lines.slice(1) : lines;

        const importedRows = dataLines
          .map((line, index) => {
            const values = line
              .split(',')
              .map((value) => value.trim().replace(/^"|"$/g, ''));

            const newRow: RuleConfigRow = {
              id: String(Date.now() + index).slice(-8).padStart(8, '0'),
            };

            columns.forEach((col, colIndex) => {
              newRow[col.dataIndex] = values[colIndex] || '';
            });

            return Object.values(newRow).some((v) => v && v !== newRow.id) ? newRow : null;
          })
          .filter(Boolean) as RuleConfigRow[];

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

  const tableColumns: ColumnsType<RuleConfigRow> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 120,
      ellipsis: true,
      render: (id: string) => {
        const digits = (id || '').replace(/\D/g, '');
        return digits.slice(0, 8).padStart(8, '0') || id;
      },
    },
    ...columns.map((col) => ({
      title: col.title,
      dataIndex: col.dataIndex as keyof RuleConfigRow,
      width: col.width,
      ellipsis: true,
    })),
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: unknown, record: RuleConfigRow) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setDetailRow(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditPage(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该规则？" onConfirm={() => removeRow(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const scrollX = columns.reduce((sum, col) => sum + (col.width || 200), 0) + 320;

  // 详情页
  if (detailRow) {
    const firstDataCol = columns[0];
    const detailTitle = detailRow[firstDataCol.dataIndex] || '详情';

    return (
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setDetailRow(null)} />
            <Typography.Text strong>{detailTitle}</Typography.Text>
          </Space>
        }
      >
        <Form layout="horizontal" labelCol={{ flex: '140px' }} wrapperCol={{ flex: '1' }} labelAlign="left">
          {columns.filter((col) => col.dataIndex !== 'updateTime' && col.dataIndex !== 'updater').map((col) => (
            <Form.Item key={col.dataIndex} label={col.title}>
              <Input.TextArea
                value={detailRow[col.dataIndex] || '-'}
                readOnly
                autoSize={{ minRows: 1 }}
                style={{ width: '100%' }}
              />
            </Form.Item>
          ))}
          <Form.Item>
            <Button type="primary" onClick={() => setDetailRow(null)}>返回</Button>
          </Form.Item>
        </Form>
      </Card>
    );
  }

  // 新增/编辑页
  if (formMode) {
    const pageTitle = formMode === 'create' ? `新增${title}` : `编辑${title}`;

    const initialValues: Record<string, string> = {};
    if (formMode === 'edit' && editingRow) {
      columns
        .filter((col) => col.dataIndex !== 'updateTime' && col.dataIndex !== 'updater')
        .forEach((col) => {
          initialValues[col.dataIndex] = editingRow[col.dataIndex] || '';
        });
    }

    return (
      <Card
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setFormMode(null)} />
            <Typography.Text strong>{pageTitle}</Typography.Text>
          </Space>
        }
      >
        <Form
          key={`${formMode}-${editingRow?.id || 'new'}`}
          form={form}
          layout="horizontal"
          labelCol={{ flex: '140px' }}
          wrapperCol={{ flex: '1' }}
          labelAlign="left"
          preserve={false}
          initialValues={initialValues}
        >
          {columns.filter((col) => col.dataIndex !== 'updateTime' && col.dataIndex !== 'updater').map((col) => {
            const isRequired = requiredFields?.includes(col.dataIndex);
            const options = fieldOptions?.[col.dataIndex];
            const rules = isRequired ? [{ required: true, message: `请输入${col.title}` }] : [];
            const dependency = fieldDependencies?.[col.dataIndex];

            return (
              <Form.Item key={col.dataIndex} name={col.dataIndex} label={col.title} rules={rules}>
                {options ? (
                  <Select
                    placeholder={`请选择${col.title}`}
                    options={options.map((opt) => ({ label: opt, value: opt }))}
                    onChange={(value) => {
                      if (dependency && dependency.mapping[value]) {
                        form.setFieldValue(dependency.targetField, dependency.mapping[value]);
                      }
                    }}
                  />
                ) : (
                  <Input.TextArea
                    autoSize={{ minRows: 1 }}
                    placeholder={`请输入${col.title}`}
                  />
                )}
              </Form.Item>
            );
          })}
          <Form.Item>
            <Space>
              <Button type="primary" onClick={submitForm}>
                保存
              </Button>
              <Button onClick={() => setFormMode(null)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    );
  }

  // 列表页
  return (
    <Card
      title={title}
      extra={
        <Space wrap>
          {filterFields?.map((field) => {
            const col = columns.find((c) => c.dataIndex === field);
            if (!col) return null;
            if (field === 'updateTime') {
              const rangeVal = filterValues[field] as [string, string] | undefined;
              return (
                <Space key={field} size="small">
                  <Typography.Text>{col.title}</Typography.Text>
                  <DatePicker.RangePicker
                    allowClear
                    placeholder={['开始日期', '结束日期']}
                    style={{ width: 260 }}
                    value={rangeVal && rangeVal[0] && rangeVal[1] ? [dayjs(rangeVal[0]), dayjs(rangeVal[1])] as [dayjs.Dayjs, dayjs.Dayjs] : undefined}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        const startDate = dates[0];
                        const endDate = dates[1];
                        setFilterValues((prev) => ({ ...prev, [field]: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')] }));
                      } else {
                        setFilterValues((prev) => ({ ...prev, [field]: '' }));
                      }
                    }}
                  />
                </Space>
              );
            }
            const options = fieldOptions?.[field]
              ? fieldOptions[field].map((opt) => ({ label: opt, value: opt }))
              : [...new Set(rows.map((r) => r[field]).filter(Boolean))].map((v) => ({ label: v, value: v }));
            return (
              <Select
                key={field}
                allowClear
                placeholder={col.title}
                style={{ width: 180 }}
                options={options}
                value={filterValues[field] as string || undefined}
                onChange={(val) => setFilterValues((prev) => ({ ...prev, [field]: val || '' }))}
              />
            );
          })}
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreatePage}>
            新增
          </Button>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>导入</Button>
          </Upload>
          <Button icon={<DownloadOutlined />} onClick={() => exportCsv(title, columns, filteredRows)}>
            导出
          </Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        columns={tableColumns}
        dataSource={filteredRows}
        pagination={{ pageSize: 10 }}
        scroll={{ x: scrollX }}
      />
    </Card>
  );
}
