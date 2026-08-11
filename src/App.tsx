import { AuditOutlined, DatabaseOutlined, SettingOutlined } from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import AuditDataPage from './pages/AuditDataPage';
import ConfigPage from './pages/ConfigPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import KnowledgeRulePage from './pages/KnowledgeRulePage';

const { Sider, Content } = Layout;

function AppLayout() {
  const location = useLocation();

  const selectedKey = (() => {
    if (location.pathname === '/knowledge' || location.pathname === '/knowledge/product') return 'knowledge-product';
    if (location.pathname === '/knowledge/copy-compliance') return 'knowledge-copy-compliance';
    if (location.pathname === '/knowledge/localization-compliance') return 'knowledge-localization-compliance';
    if (location.pathname === '/knowledge/visual-compliance') return 'knowledge-visual-compliance';
    return location.pathname.split('/')[1] || 'audit';
  })();

  return (
    <Layout className="app-shell">
      <Sider width={232} className="app-sider">
        <div className="brand">
          <div className="brand-mark">AI</div>
          <div>
            <Typography.Title level={4} className="brand-title">
              云中台
            </Typography.Title>
          </div>
        </div>
        <Menu
          mode="inline"
          defaultOpenKeys={['knowledge', 'marketing']}
          selectedKeys={[selectedKey]}
          items={[
            {
              key: 'knowledge',
              icon: <DatabaseOutlined />,
              label: 'AI知识库',
              children: [
                {
                  key: 'knowledge-product',
                  label: <Link to="/knowledge/product">商品内容</Link>,
                },
                {
                  key: 'knowledge-copy-compliance',
                  label: <Link to="/knowledge/copy-compliance">文案合规</Link>,
                },
                {
                  key: 'knowledge-localization-compliance',
                  label: <Link to="/knowledge/localization-compliance">本地化合规</Link>,
                },
                {
                  key: 'knowledge-visual-compliance',
                  label: <Link to="/knowledge/visual-compliance">视觉合规</Link>,
                },
              ],
            },
            {
              key: 'marketing',
              icon: <AuditOutlined />,
              label: '营销方案',
              children: [
                {
                  key: 'audit',
                  icon: <AuditOutlined />,
                  label: <Link to="/audit">营销活动复核</Link>,
                },
                {
                  key: 'config',
                  icon: <SettingOutlined />,
                  label: <Link to="/config">复核配置</Link>,
                },
              ],
            },
          ]}
        />
      </Sider>
      <Layout>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/audit" replace />} />
            <Route path="/audit" element={<AuditDataPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/knowledge" element={<Navigate to="/knowledge/product" replace />} />
            <Route path="/knowledge/product" element={<KnowledgeBasePage />} />
            <Route
              path="/knowledge/copy-compliance"
              element={
                <KnowledgeRulePage
                  title="文案合规"
                  showCountry
                  sections={[
                    {
                      items: ['广告宣传规则', '禁限宣传内容', '绝对化用语', '功效宣称规则', '价格/折扣宣传规则', '特殊商品规则'],
                    },
                  ]}
                />
              }
            />
            <Route
              path="/knowledge/localization-compliance"
              element={
                <KnowledgeRulePage
                  title="本地化合规"
                  showCountry
                  sections={[
                    {
                      items: ['语言表达习惯', '货币格式', '日期格式', '单位', '常用电商术语', '禁止/不推荐的直译表达'],
                    },
                  ]}
                />
              }
            />
            <Route
              path="/knowledge/visual-compliance"
              element={
                <KnowledgeRulePage
                  title="视觉合规"
                  sections={[
                    {
                      title: '主图',
                      items: ['图片尺寸', '图片比例', '商品占比', '背景要求', '禁止元素'],
                    },
                    {
                      title: 'Banner',
                      items: ['尺寸', '比例', '文案区域', '安全区域'],
                    },
                    {
                      title: '详情页',
                      items: ['图片规格', '清晰度', '展示规范'],
                    },
                  ]}
                />
              }
            />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
