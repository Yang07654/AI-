import { AuditOutlined } from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import { HashRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AuditDataPage from './pages/AuditDataPage';

const { Sider, Content } = Layout;

function AppLayout() {
  const location = useLocation();

  const selectedKey = location.pathname.split('/')[1] || 'audit';

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
          defaultOpenKeys={['marketing']}
          selectedKeys={[selectedKey]}
          items={[
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
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
}
