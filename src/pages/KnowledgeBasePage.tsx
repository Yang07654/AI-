import { Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { initialKnowledgeItems, type KnowledgeItem } from '../mock/knowledgeData';

type KnowledgeFormValue = Omit<KnowledgeItem, 'id'>;

export default function KnowledgeBasePage() {
  const [items, setItems] = useState<KnowledgeItem[]>(initialKnowledgeItems);
  const [keyword, setKeyword] = useState('');
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<KnowledgeFormValue>();

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) return items;

    return items.filter((item) => item.productName.includes(normalizedKeyword));
  }, [items, keyword]);

  const openCreateModal = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record: KnowledgeItem) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    message.success('已删除知识库条目');
  };

  const submitForm = async () => {
    const values = await form.validateFields();

    if (editingItem) {
      setItems((prev) => prev.map((item) => (item.id === editingItem.id ? { ...editingItem, ...values } : item)));
      message.success('已更新知识库条目');
    } else {
      setItems((prev) => [
        {
          id: `KB-${Date.now()}`,
          ...values,
        },
        ...prev,
      ]);
      message.success('已新增知识库条目');
    }

    setModalOpen(false);
  };

  const columns: ColumnsType<KnowledgeItem> = [
    {
      title: '商品ID',
      dataIndex: 'id',
      width: 130,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      width: 180,
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: '品类',
      dataIndex: 'category',
      width: 140,
    },
    {
      title: '标准文案规范',
      dataIndex: 'standardCopy',
      ellipsis: true,
    },
    {
      title: '关键合规要求',
      dataIndex: 'complianceRules',
      ellipsis: true,
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该条目？" onConfirm={() => removeItem(record.id)}>
            <Button type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="商品内容"
        extra={
          <Space>
            <Input.Search
              allowClear
              placeholder="按商品名称搜索"
              onSearch={setKeyword}
              onChange={(event) => setKeyword(event.target.value)}
              style={{ width: 260 }}
            />
            <Button type="primary" onClick={openCreateModal}>
              新增
            </Button>
          </Space>
        }
      >
        <Table rowKey="id" columns={columns} dataSource={filteredItems} pagination={{ pageSize: 6 }} />
      </Card>

      <Modal
        title={editingItem ? '编辑知识库条目' : '新增知识库条目'}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="productName" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input placeholder="例如：云感舒适运动鞋" />
          </Form.Item>
          <Form.Item name="category" label="品类" rules={[{ required: true, message: '请输入品类' }]}>
            <Input placeholder="例如：服饰鞋包" />
          </Form.Item>
          <Form.Item name="standardCopy" label="规范文案模板" rules={[{ required: true, message: '请输入规范文案模板' }]}>
            <Input.TextArea rows={3} placeholder="描述该商品适合使用的标准表达" />
          </Form.Item>
          <Form.Item name="complianceRules" label="合规条款" rules={[{ required: true, message: '请输入合规条款' }]}>
            <Input.TextArea rows={3} placeholder="填写禁用语、必须标注项等关键要求" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
