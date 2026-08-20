import { AuditOutlined, BookOutlined, FileTextOutlined, LayoutOutlined, PictureOutlined } from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AuditDataPage from './pages/AuditDataPage';
import KnowledgeRulePage from './pages/KnowledgeRulePage';
import { textRuleConfigData, imageRuleConfigData, pageRuleConfigData } from './mock/ruleConfigData';

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
          defaultOpenKeys={['knowledge', 'marketing']}
          selectedKeys={[selectedKey]}
          items={[
            {
              key: 'knowledge',
              icon: <BookOutlined />,
              label: 'AI知识库',
              children: [
                {
                  key: 'text-rule',
                  icon: <FileTextOutlined />,
                  label: <Link to="/text-rule">文本规则配置</Link>,
                },
                {
                  key: 'image-rule',
                  icon: <PictureOutlined />,
                  label: <Link to="/image-rule">图片规则配置</Link>,
                },
                {
                  key: 'page-rule',
                  icon: <LayoutOutlined />,
                  label: <Link to="/page-rule">页面规则配置</Link>,
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
              ],
            },
          ]}
        />
      </Sider>
      <Layout>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/audit" replace />} />
            <Route path="/audit" element={<AuditDataPage key={location.key} />} />
            <Route path="/text-rule" element={<KnowledgeRulePage title="文本规则配置" columns={textRuleConfigData.columns} data={textRuleConfigData.rows} uniqueField="country" uniqueLabel="国家" requiredFields={['country', 'locale', 'requirement', 'currency', 'unitsMeasures', 'dateTimeFormat', 'localProductTerms', 'textStyle', 'localizationDict']} fieldOptions={{ country: ['美国', '加拿大', '英国', '意大利', '西班牙', '法国', '德国', '奥地利', '澳大利亚', '日本', '韩国', '泰国'], locale: ['英语（en-US）', '英语（en-CA）', '英语（en-GB）', '意大利语（it-IT）', '西班牙语（es-ES）', '法语（fr-FR）', '德语（de-DE）', '德语（de-AT）', '英语（en-AU）', '日语（ja-JP）', '韩语（ko-KR）', '泰语（th-TH）'] }} fieldDependencies={{ country: { targetField: 'locale', mapping: { '美国': '英语（en-US）', '加拿大': '英语（en-CA）', '英国': '英语（en-GB）', '意大利': '意大利语（it-IT）', '西班牙': '西班牙语（es-ES）', '法国': '法语（fr-FR）', '德国': '德语（de-DE）', '奥地利': '德语（de-AT）', '澳大利亚': '英语（en-AU）', '日本': '日语（ja-JP）', '韩国': '韩语（ko-KR）', '泰国': '泰语（th-TH）' } } }} filterFields={['country', 'locale', 'updateTime']} />} />
            <Route path="/image-rule" element={<KnowledgeRulePage title="图片规则配置" columns={imageRuleConfigData.columns} data={imageRuleConfigData.rows} uniqueField="moduleName" uniqueLabel="模块名称" requiredFields={['moduleName', 'pcSize', 'mobileSize', 'appSize', 'ratio', 'allowedError']} fieldOptions={{ moduleName: ['轮播图', '通屏图文', '照片墙', '视频直播', '直播回放', '博客', '主推四款', '新闻资讯', '优惠专区', '热卖分类', '一图多商品', '图文展示', '幸运抽奖', '热销款类', '网红青书', '九模块', '一行三商品', '信用背书', '视频模块（大）', '视频模块（小）', '商品多组件模块', '图片滑动', '一行四商品', '两商品+两评论', '用户故事', '富文本', '代码容器', '板块介绍', '一商品+一评论', '一图片+一商品', '一图片+两商品', '一图片+三商品', '两行商品+一图片', '三图-上图下文', '两/三图-图文一体', '左图右文', '一图上下文', '一行图片（换行）', '轮播图+两图片', '单页四图', '秒杀模块', '背景图+一行品类', '品类页Banner', '一行五商品', '品质保证', '邮件订阅', '预约有礼', '创作上传模块', '创作照片墙模块', 'FAQS模块', '定位器模块', '游戏入口'] }} filterFields={['moduleName', 'updateTime']} />} />
            <Route path="/page-rule" element={<KnowledgeRulePage title="页面规则配置" columns={pageRuleConfigData.columns} data={pageRuleConfigData.rows} uniqueField="ruleType" uniqueLabel="规则类型" requiredFields={['ruleType', 'criteria']} fieldOptions={{ ruleType: ['元素重叠', '元素错位', '对齐异常', '间距异常', '容器溢出', '异常截断', '模块侵占', '卡片布局异常', '网格布局异常', '页面水平偏移', '页面垂直异常', '文本布局异常', '按钮布局异常', '导航布局异常', '弹窗布局异常', '固定元素遮挡', '响应式布局异常', '页面边距异常', '层级异常', '异常空白'] }} filterFields={['ruleType', 'updateTime']} />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/AI-">
      <AppLayout />
    </BrowserRouter>
  );
}
