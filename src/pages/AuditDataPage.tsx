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
  商品标题: { reason: 'Flashlights 使用复数形式，与商品标题描述的单个产品不一致。该商品为单个手电产品，应使用单数形式 Flashlight。', suggestion: 'ArkPro Liberty Lines | Limited Edition Flat EDC Flashlight' },
  商品副标题: { reason: '名词单复数不一致（参数描述高频错）', suggestion: '500 lumens rechargeable flashlight' },
  商品详情: { reason: '名词单复数不一致（参数描述高频错）', suggestion: '500 lumens rechargeable flashlight', fieldName: '基本信息-商品副标题' },
  商品SKU详情: { reason: '名词单复数不一致（参数描述高频错）', suggestion: '500 lumens rechargeable flashlight', fieldName: '基本信息-商品副标题' },
};

function renderProductContentStatus(record: AuditObject, fieldKey: string, fieldName: string) {
  const productDetailFailures = fieldKey === 'productDetail'
    ? Object.values(productDetailSubFields).flatMap((subFields) =>
        subFields.filter((sf) => sf.overrideStatus === 'abnormal')
      )
    : [];
  const hasDetailFailures = productDetailFailures.length > 0;
  const status = hasDetailFailures ? 'abnormal' as ContentStatus : record.contentStatus?.[fieldKey as keyof typeof record.contentStatus];
  if (!status) return '-';
  const config = contentStatusConfig[status];

  if (status === 'abnormal') {
    if (fieldKey === 'productDetail' && hasDetailFailures) {
      return (
        <Tooltip
          overlayClassName="failure-tooltip"
          overlayStyle={{ maxWidth: 240 }}
          overlayInnerStyle={{ backgroundColor: '#fff', maxHeight: 120, overflowY: 'auto', padding: 6, fontSize: 12 }}
          title={
            <div style={{ lineHeight: 1.4, color: '#ff4d4f' }}>
              {productDetailFailures.map((sf, index) => (
                <div key={index} style={{ marginBottom: index < productDetailFailures.length - 1 ? 6 : 0 }}>
                  <div style={{ marginBottom: 1 }}>
                    <span style={{ fontWeight: 'bold' }}>失败字段/模块：</span>
                    {sf.fieldName}
                  </div>
                  {sf.mallData && (
                    <div style={{ marginBottom: 1 }}>
                      <span style={{ fontWeight: 'bold' }}>当前数据：</span>
                      {sf.isImage ? <img src={sf.mallData} alt="图片" style={{ width: 36, height: 36, objectFit: 'contain' }} /> : sf.mallData}
                    </div>
                  )}
                  <div style={{ marginBottom: 1 }}>
                    <span style={{ fontWeight: 'bold' }}>失败原因：</span>
                    {sf.reason || '当前字段复核失败'}
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>AI建议修改：</span>
                    {sf.suggestion || '建议检查并修正相关内容'}
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

    const override = productFailureOverride[fieldName];
    const riskItem = Object.values(record.risks).flat().find((risk) => risk.fieldName.includes(fieldName));
    const failureReason = override?.reason || riskItem?.description || '当前字段复核失败，请检查内容。';
    const aiSuggestion = override?.suggestion || riskItem?.suggestion || '建议检查并修正相关内容。';
    const currentData = productSubFields[fieldKey]?.[0]?.mallData || '-';

    return (
      <Tooltip
        overlayClassName="failure-tooltip"
        overlayStyle={{ maxWidth: 240 }}
        overlayInnerStyle={{ backgroundColor: '#fff', maxHeight: 120, overflowY: 'auto', padding: 6, fontSize: 12 }}
        title={
          <div style={{ lineHeight: 1.4, color: '#ff4d4f' }}>
            <div style={{ marginBottom: 1 }}>
              <span style={{ fontWeight: 'bold' }}>失败字段/模块：</span>
              {override?.fieldName || fieldName}
            </div>
            <div style={{ marginBottom: 1 }}>
              <span style={{ fontWeight: 'bold' }}>当前数据：</span>
              {currentData}
            </div>
            <div style={{ marginBottom: 1 }}>
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
        overlayClassName="failure-tooltip"
        overlayStyle={{ maxWidth: 240 }}
        overlayInnerStyle={{ backgroundColor: '#fff', maxHeight: 120, overflowY: 'auto', padding: 6, fontSize: 12 }}
        title={
          <div style={{ lineHeight: 1.4, color: '#ff4d4f' }}>
            {failedSubFields.map((subField, index) => (
              <div key={index} style={{ marginBottom: index < failedSubFields.length - 1 ? 6 : 0 }}>
                <div style={{ marginBottom: 1 }}>
                  <span style={{ fontWeight: 'bold' }}>失败字段/模块：</span>
                  {subField.fieldName}
                </div>
                <div style={{ marginBottom: 1 }}>
                  <span style={{ fontWeight: 'bold' }}>当前数据：</span>
                  {subField.mallData}
                </div>
                <div style={{ marginBottom: 1 }}>
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

const pageVisualSubFields: Record<string, Array<{ moduleName?: string; fieldName: string; mallData: string; defaultStatus: ContentStatus; overrideStatus?: ContentStatus; reason?: string; suggestion?: string; isImage?: boolean }>> = {
  '语言书写错误检查': [
    { moduleName: 'Shop & Explores', fieldName: '模块名称', mallData: 'Shop & Explores', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '通过存在语言书写错误。Explore 在此处与 Shop 构成并列动作表达，不应使用第三人称单数 Explores。', suggestion: '通过存在语言书写错误。Explore 在此处与 Shop 构成并列动作表达，不应使用第三人称单数 Explores。' },
    { moduleName: 'Shop & Explore', fieldName: '模块中文字', mallData: 'Explore our latest flashlight and find the perfect light for your needs', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '存在单复数错误。flashlight 表示多个可供浏览的手电产品时，应使用复数形式 flashlights', suggestion: '存在单复数错误。flashlight 表示多个可供浏览的手电产品时，应使用复数形式 flashlights' },
    { moduleName: 'Rethink Light, Reimagine Style', fieldName: '模块名称', mallData: 'Rethink Light, Reimagine Style.', defaultStatus: 'normal', overrideStatus: 'normal' },
    { moduleName: 'Rethink Light, Reimagine Style', fieldName: '模块中文字', mallData: 'Designed for everyday carry, our flashlights combines performance and style.', defaultStatus: 'normal', overrideStatus: 'normal' },
  ],
  '文案合规检查': [
    { moduleName: 'Shop & Explore', fieldName: '模块名称', mallData: 'Shop & Explore', defaultStatus: 'normal', overrideStatus: 'normal' },
    { moduleName: 'Shop & Explore', fieldName: '模块中文字', mallData: 'Hurry! Buy now or you\'ll miss your only chance to own the world\'s safest flashlight.', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '存在明显施压式营销表达，如"only chance"；同时使用"world\'s safest"绝对化安全宣称，存在合规风险。', suggestion: '删除强迫/施压及绝对化宣称，建议修改为：Explore our flashlights and find the right light for your needs.' },
    { moduleName: 'Rethink Light. Reimagine Style', fieldName: '模块名称', mallData: 'Rethink Light. Reimagine Style.', defaultStatus: 'normal', overrideStatus: 'normal' },
    { moduleName: 'Rethink Light. Reimagine Style', fieldName: '模块中文字', mallData: 'Designed for everyday carry, our flashlights combines performance and style.', defaultStatus: 'normal', overrideStatus: 'normal' },
  ],
  '本地化合规': [
    { moduleName: 'Shop & Explores', fieldName: '模块名称', mallData: 'Shop & Explores', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '通过存在语言书写错误。Explore 在此处与 Shop 构成并列动作表达，不应使用第三人称单数 Explores。', suggestion: '通过存在语言书写错误。Explore 在此处与 Shop 构成并列动作表达，不应使用第三人称单数 Explores。' },
    { moduleName: 'Shop & Explore', fieldName: '模块中文字', mallData: 'Free shipping on orders over £48.<br>Shop our favourite torches today.', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '当前为美国站，但文案使用英国货币符号 £ 以及英式表达 favourite, torches，不符合美国本地化表达习惯。', suggestion: '建议使用美元及美式英语，修改为：Free shipping on orders over $40. Shop our favorite flashlights today.' },
    { moduleName: 'Rethink Light. Reimagine Style.', fieldName: '模块名称', mallData: 'Rethink Light. Reimagine Style.', defaultStatus: 'normal', overrideStatus: 'normal' },
    { moduleName: 'Rethink Light. Reimagine Style.', fieldName: '模块中文字', mallData: 'Get yours before 17/08/2026 and enjoy free delivery.', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '日期采用 DD/MM/YYYY 格式，容易与美国常用的 MM/DD/YYYY 格式产生理解偏差；delivery 在美国电商语境中通常也更常表达为 shipping。', suggestion: '建议修改为：Get yours before August 17, 2026 and enjoy free shipping.' },
  ],
  '信息正确性审核': [
    { moduleName: 'Shop & Explore', fieldName: '模块名称', mallData: 'Shop & Explore', defaultStatus: 'normal', overrideStatus: 'normal' },
    { moduleName: 'Shop & Explore', fieldName: '模块中文字', mallData: 'ArkPro Ultra delivers a maximum output of 1,400 lumens and up to 7 days of runtime.', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '产品参数与官网信息不一致。官网当前 ArkPro Ultra 标注为最高 1,700 lumens，最长续航 14 days', suggestion: '修改为：ArkPro Ultra delivers a maximum flood output of 1,700 lumens and up to 14 days of runtime.' },
    { moduleName: 'Rethink Light. Reimagine Style.', fieldName: '模块名称', mallData: 'Rethink Light. Reimagine Style.', defaultStatus: 'normal', overrideStatus: 'normal' },
    { moduleName: 'Rethink Light. Reimagine Style.', fieldName: '模块中文字', mallData: 'Baton 4 delivers up to 1,500 lumens with a maximum beam distance of 200 meters.', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '通过产品参数与官网资料不一致。Baton 4 最高输出为 1,300 lumens，最大射程为 170 meters.', suggestion: '修改为：Baton 4 delivers up to 1,300 lumens with a maximum beam distance of 170 meters.' },
  ],
  '图片完整性': [
    { moduleName: 'Shop & Explore', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}spec-value-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '图片存在非设计性裁切，商品主体关键部分超出图片可视区域，导致商品展示不完整。', suggestion: '调整图片裁切范围或商品位置，确保手电主体及关键结构完整显示，不被容器边界异常截断。', isImage: true },
    { moduleName: 'Rethink Light. Reimagine Style', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}spec-list-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
    { moduleName: 'Rethink Light. Reimagine Style', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}blogs-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '图片未完整加载，出现明显内容缺失和异常空白，影响用户正常查看图片信息。', suggestion: '检查图片资源地址及加载状态，重新上传或替换完整图片，确保图片内容能够正常、完整显示。', isImage: true },
  ],
  '图片质量': [
    { moduleName: 'Shop & Explore', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}spec-list-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
    { moduleName: 'Rethink Light. Reimagine Style', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}spec-value-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '图片存在明显低清和像素化问题，商品外观及细节无法清晰辨识，影响页面视觉效果及产品展示。', suggestion: '建议替换为更高分辨率的原始图片，避免对低分辨率图片进行强制放大，确保商品主体及细节清晰。', isImage: true },
    { moduleName: 'Rethink Light. Reimagine Style', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}blogs-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '图片曝光异常，高光区域出现明显细节丢失，影响商品外观、光源及使用效果正常展示。', suggestion: '建议调整曝光和高光区域，或替换曝光正常的图片，确保手电主体、光效及场景细节能够清晰辨识。', isImage: true },
  ],
  '图片尺寸/比例': [
    { moduleName: 'Shop & Explore', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}spec-list-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
    { moduleName: 'Rethink Light, Reimagine Style', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}spec-value-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '当前图片为方形比例，与该模块横向大图展示区域比例不匹配，实际展示时容易出现大面积裁切或异常留白。', suggestion: '建议替换为与模块容器匹配的横向图片，优先使用 16:9 比例，如 1920×1080 px，并保持同模块图片比例一致。', isImage: true },
    { moduleName: 'Rethink Light, Reimagine Style', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}blogs-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '图片比例符合横向展示要求，但原始像素尺寸偏小，在 PC 端大尺寸展示时存在被放大后清晰度下降的风险。', suggestion: '保持 16:9 比例，建议更换为 1920×1080 px 或符合该模块实际尺寸规范的高分辨率图片。', isImage: true },
  ],
  '商品/主体展示': [
    { moduleName: 'Shop & Explore', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}spec-list-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
    { moduleName: 'Rethink Light. Reimagine Style', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}spec-value-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '商品主体不够突出，场景元素明显抢占视觉焦点，用户难以快速识别所展示的手电产品。', suggestion: '建议放大手电商品主体并优化构图，降低无关场景元素的视觉占比，确保商品成为主要视觉焦点。', isImage: true },
    { moduleName: 'Rethink Light. Reimagine Style', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}blogs-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '商品主体存在明显遮挡，影响用户识别产品外观及关键结构，未达到正常商品展示要求。', suggestion: '建议调整商品位置、拍摄角度或遮挡元素，减少对手电主体的遮挡，确保商品关键外观和结构清晰可辨。', isImage: true },
  ],
  '图片内容合规': [
    { moduleName: 'Shop & Explore', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}spec-list-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
    { moduleName: 'Rethink Light. Reimagine Style', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}spec-value-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '图片展示明显不安全的手电使用方式。Olight 产品安全说明明确警示不要将光线直接照射人眼，否则可能造成暂时失明或眼睛损伤。', suggestion: '建议替换为正常、安全的手电使用场景，避免展示将高亮光束直接照射人眼等危险使用行为。', isImage: true },
    { moduleName: 'Rethink Light. Reimagine Style', fieldName: '模块中图片', mallData: `${import.meta.env.BASE_URL}blogs-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '图片存在危险使用行为。Olight 安全说明明确提示不要在手电点亮时遮挡灯头，高能量可能导致物体受热甚至引燃。', suggestion: '建议删除或替换该场景，避免展示点亮状态下遮挡灯头、覆盖手电等可能造成过热或燃烧风险的行为。', isImage: true },
  ],
  '有效性检查': [
    { moduleName: 'Shop & Explore', fieldName: '模块中链接', mallData: 'https://www.olight.com/store/arkpro-series-flat-edc-flashlight', defaultStatus: 'normal', overrideStatus: 'normal' },
    { moduleName: 'Rethink Light, Reimagine Style', fieldName: '模块中链接', mallData: 'https://www.olight.com/store/baton-4-powerful-edc-flashlight', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '当前链接未能正常匹配官网有效商品页面，存在链接路径失效或页面地址变更的情况。', suggestion: '建议重新获取官网当前有效的 Baton 4 商品详情页链接，并替换失效URL。' },
    { moduleName: 'Rethink Light, Reimagine Style', fieldName: '模块中链接', mallData: 'https://www.olight.com/store/i3e-eos', defaultStatus: 'normal', overrideStatus: 'normal' },
  ],
  '模块完整性': [
    { fieldName: 'Shop & Explore', mallData: '', defaultStatus: 'normal', overrideStatus: 'normal' },
    { fieldName: 'Rethink Light, Reimagine Style', mallData: '', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '页面中该模块存在内容缺失，缺少应配置的商品/主题展示内容或关键展示区域，导致模块结构不完整。', suggestion: '补充该模块缺失的标题、图片、商品/主题内容及必要的跳转入口，确保模块按照页面配置完整展示。' },
  ],
  '排版/布局异常': [
    { fieldName: 'Shop & Explore', mallData: '', defaultStatus: 'normal', overrideStatus: 'normal' },
    { fieldName: 'Rethink Light. Reimagine Style.', mallData: '', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '模块内部分内容存在明显排版错位，图片与文字区域间距异常，导致模块视觉层级和对齐关系不一致。', suggestion: '调整图片与文字区域的对齐、间距及容器尺寸，消除异常留白和错位，保持模块整体布局统一。' },
    { fieldName: 'Facebook Group Member Exclusive', mallData: '', defaultStatus: 'normal', overrideStatus: 'normal' },
  ],
};

const productDetailFields = pageVisualCheckTypes.map((name, index) => ({
  key: name,
  name,
  number: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'][index],
}));

const productDetailFailureInfo: Record<string, { reason: string; suggestion: string }> = {
  '语言书写错误检查': { reason: '商品文案存在拼写或语法错误', suggestion: '建议修正拼写和语法错误' },
  '文案合规检查': { reason: '商品文案不符合广告宣传规则', suggestion: '建议修改文案，确保符合平台规则' },
  '本地化合规': { reason: '商品表达不符合当地语言文化习惯', suggestion: '建议调整为符合本地用户习惯的表达' },
  '信息正确性审核': { reason: '价格、活动等信息不准确', suggestion: '建议核实并更正信息，确保准确一致' },
  '图片完整性': { reason: '商品图片存在缺失或加载异常', suggestion: '建议补充缺失图片，确保所有图片资源正常加载' },
  '图片质量': { reason: '图片存在模糊、压缩或噪点问题', suggestion: '建议更换高清原图，避免过度压缩' },
  '图片尺寸/比例': { reason: '图片尺寸比例不符合视觉规范', suggestion: '建议按规范调整图片尺寸和比例' },
  '商品/主体展示': { reason: '商品主体展示不突出', suggestion: '建议优化图片构图，突出商品主体' },
  '图片内容合规': { reason: '图片内容包含违规元素', suggestion: '建议移除违规元素，替换为合规图片' },
  '有效性检查': { reason: '商品链接失效或功能不可用', suggestion: '建议修复失效链接，确保功能正常可用' },
  '模块完整性': { reason: '商品模块缺失关键区域', suggestion: '建议补充缺失模块，确保页面完整' },
  '排版/布局异常': { reason: '商品排版存在错位或异常留白', suggestion: '建议调整布局，确保排版整齐' },
};

const productDetailSubFields: Record<string, Array<{ fieldName: string; mallData: string; defaultStatus: ContentStatus; overrideStatus?: ContentStatus; reason?: string; suggestion?: string; isImage?: boolean }>> = {
  '语言书写错误检查': [
    { fieldName: '基本信息-商品副标题', mallData: 'Tactial Light；Up to 1,300 Lumens', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '"Tactial"拼写错误，正确为"Tactical"；"Lumens"首字母不应大写，建议使用"lumens"', suggestion: 'Tactical Light；Up to 1,300 lumens' },
    { fieldName: '销售信息-规格值描述', mallData: 'Max 1200LM；Runtime: 8Hour', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '"LM"单位写法不规范，建议使用"lm"；"8Hour"缺少空格，正确为"8 hour"', suggestion: 'Max 1200lm；Runtime: 8 hour' },
    { fieldName: '售后服务-更多说明', mallData: '30 Days return；2 years Warranty', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '"return"首字母不符合标题式写法；"Warranty"首字母不符合当前格式规范', suggestion: '30 Days Return；2 years warranty' },
    { fieldName: '模块中文字', mallData: '超亮手电；续航更久', defaultStatus: 'normal', overrideStatus: 'normal' },
    { fieldName: '模块名称', mallData: 'Explore Top Products by Category', defaultStatus: 'normal', overrideStatus: 'normal' },
  ],
  '文案合规检查': [
    { fieldName: '基本信息-商品副标题', mallData: 'The Best Tactical Flashlight', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '"The Best"属于绝对化/最高级宣传用语，缺少明确、可验证的评价依据，存在误导消费者的风险', suggestion: 'High-Performance Tactical Flashlight' },
    { fieldName: '销售信息-规格值描述', mallData: 'Up to 1300 Lumens', defaultStatus: 'normal', overrideStatus: 'normal' },
    { fieldName: '售后服务-更多说明', mallData: '100% Satisfaction Guaranteed', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '"100% Guaranteed"属于无条件承诺，容易构成绝对化承诺；', suggestion: 'Customer Satisfaction Support' },
    { fieldName: '模块中文字', mallData: 'Bright & Reliable', defaultStatus: 'normal', overrideStatus: 'normal' },
    { fieldName: '模块名称', mallData: 'Explore Top Products by Category', defaultStatus: 'normal', overrideStatus: 'normal' },
  ],
  '本地化合规': [
    { fieldName: '基本信息-商品副标题', mallData: 'Powerful Flashlight for Outdoor', defaultStatus: 'normal', overrideStatus: 'normal' },
    { fieldName: '销售信息-规格值描述', mallData: '1300 Lumens / 4.5 oz / 11 cm', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '当前目标市场要求/用户习惯使用公制或英制单位时，单位体系需要与目标市场保持一致', suggestion: '根据目标国家调整为对应单位格式' },
    { fieldName: '售后服务-更多说明', mallData: 'Free Returns within 30 Days', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '退货政策属于本地市场服务信息，不能直接套用其他国家的政策', suggestion: '以目标国家实际退货政策为准' },
    { fieldName: '模块中文字', mallData: 'Shipping to Germany: Free', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '德国市场配送信息应与德国站实际配送范围、条件和费用保持一致，对化承诺；', suggestion: 'Free shipping to Germany on eligible orders' },
    { fieldName: '模块名称', mallData: 'New Arrival', defaultStatus: 'normal', overrideStatus: 'normal' },
  ],
  '信息正确性审核': [
    { fieldName: '基本信息-商品副标题', mallData: 'Baton 4 - 1,500 Lumens Flashlight', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '商品副标题宣称最大亮度为 1,500 lumens，但官方产品资料显示 Baton 4 最大输出为 1,300 lumens，当前数据与产品信息不一致', suggestion: 'Baton 4 - 1,300 Lumens Flashlight' },
    { fieldName: '销售信息-规格值值描述', mallData: 'Max Output: 1,300 lm Throw: 200 mRuntime: 30 days', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '商品副标题宣称最大亮度为 1,500 lumens，但官方产品资料显示 Baton 4 最大输出为 1,300 lumens，当前数据与产品信息不一致', suggestion: 'Max Output: 1,300 lm Throw: 170 m Runtime: 30 days' },
    { fieldName: '模块中文字', mallData: 'Up to 2,500 Lumens IPX8 Waterproof', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '商品副标题宣称最大亮度为 1,500 lumens，但官方产品资料显示 Baton 4 最大输出为 1,300 lumens，当前数据与产品信息不一致', suggestion: 'Up to 1,300 Lumens IPX8 Waterproof' },
    { fieldName: '售后服务-更多说明', mallData: 'Lifetime Warranty 30 Days Money Back Guarantee', defaultStatus: 'normal', overrideStatus: 'normal' },
  ],
  '图片完整性': [
    { fieldName: '销售信息-规格列表中图片', mallData: `${import.meta.env.BASE_URL}spec-list-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
    { fieldName: '销售信息-规格值值图片', mallData: `${import.meta.env.BASE_URL}spec-value-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '当前图片虽然存在，但未完整展示对应规格内容；商品主体/关键视觉信息存在裁切', suggestion: '补充完整规格展示图，确保商品主体及关键内容完整可见', isImage: true },
    { fieldName: 'Blogs中图片', mallData: `${import.meta.env.BASE_URL}blogs-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
  ],
  '图片质量': [
    { fieldName: '销售信息-规格列表中图片', mallData: `${import.meta.env.BASE_URL}spec-list-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
    { fieldName: '销售信息-规格值值图片', mallData: `${import.meta.env.BASE_URL}spec-value-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '图片分辨率/清晰度不足，手电主体边缘及细节无法清晰辨识，', suggestion: '更换高清产品图片，确保手电主体及关键细节清晰可见', isImage: true },
    { fieldName: 'Blogs中图片', mallData: `${import.meta.env.BASE_URL}blogs-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '图片曝光不足，手电主体与背景对比度较低，部分产品细节不可清晰识别', suggestion: '调整曝光和对比度，确保产品主体及细节清晰可见', isImage: true },
  ],
  '图片尺寸/比例': [
    { fieldName: '销售信息-规格列表中图片', mallData: `${import.meta.env.BASE_URL}spec-list-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '当前图片为横版场景图，不符合规格列表图片的推荐比例；规格列表图片应保持统一尺寸，', suggestion: '建议调整为 1:1，推荐尺寸 800×800 px，最低建议 480×480 px；', isImage: true },
    { fieldName: '销售信息-规格值值图片', mallData: `${import.meta.env.BASE_URL}spec-value-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '当前图片为横版场景图，作为规格值图片时比例过宽，', suggestion: '建议调整为 1:1，推荐尺寸 800×800 px；同一规格下所有规格值图片保持完全一致的尺寸和比例。', isImage: true },
    { fieldName: 'Blogs中图片', mallData: `${import.meta.env.BASE_URL}blogs-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
  ],
  '商品/主体展示': [
    { fieldName: '销售信息-规格列表中图片', mallData: `${import.meta.env.BASE_URL}spec-list-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '图片以使用场景为主，商品主体占比较小，无法清晰、直接地识别对应商品，', suggestion: '建议使用以商品本体为主要视觉主体的图片；商品应清晰、完整，避免被人物、道具、文字或复杂背景遮挡', isImage: true },
    { fieldName: '销售信息-规格值值图片', mallData: `${import.meta.env.BASE_URL}spec-value-image.jpg`, defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '当前图片无法清晰突出具体规格值对应的商品外观/版本，场景元素对商品主体形成明显干扰，不利于用户快速区分不同规格。', suggestion: '建议直接展示该规格值对应的商品主体；重点突出颜色、材质、版本等实际差异', isImage: true },
    { fieldName: 'Blogs中图片', mallData: `${import.meta.env.BASE_URL}blogs-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
  ],
  '图片内容合规': [
    { fieldName: '销售信息-规格列表中图片', mallData: `${import.meta.env.BASE_URL}spec-list-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
    { fieldName: '销售信息-规格值值图片', mallData: `${import.meta.env.BASE_URL}spec-value-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
    { fieldName: 'Blogs-详情图片', mallData: `${import.meta.env.BASE_URL}blogs-image.jpg`, defaultStatus: 'normal', overrideStatus: 'normal', isImage: true },
  ],
  '有效性检查': [
    { fieldName: '商品详情链接', mallData: 'https://www.olight.com/store/seeker-4-pro-phantom-squadron', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '当前链接未能正常访问对应商品详情页，属于无效或已失效链接。', suggestion: '建议替换为当前官网中该商品可正常访问的有效详情页链接。' },
    { fieldName: '商品SKU详情链接', mallData: 'https://www.olight.com/store/osight-se-enclosed-red-dot-sight-dpp-footprint-optic', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: 'URL格式错误，域名 olight.com 与后续路径之间缺少 /，无法形成有效的官网链接。', suggestion: '建议检查并修正URL格式，确保链接域名、路径完整且能够正常访问' },
    { fieldName: 'Blogs中跳转链接', mallData: 'https://www.olight.com/flash-sale-event', defaultStatus: 'normal', overrideStatus: 'normal' },
  ],
  '模块完整性': [
    { fieldName: 'Shop & Explore', mallData: '', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '模块核心内容展示不完整，存在商品卡片、模块标题、图片或跳转入口缺失，导致用户无法正常完成商品浏览与探索。', suggestion: '补充缺失的商品展示、图片及跳转入口，确保模块标题、内容和交互元素完整且可正常展示。' },
    { fieldName: 'Rethink Light. Reimagine Style.', mallData: '', defaultStatus: 'normal', overrideStatus: 'normal' },
    { fieldName: 'Facebook Group Member Exclusive', mallData: '', defaultStatus: 'normal', overrideStatus: 'normal' },
  ],
  '排版/布局异常': [
    { fieldName: 'Shop & Explore', mallData: '', defaultStatus: 'normal', overrideStatus: 'normal' },
    { fieldName: 'Rethink Light. Reimagine Style.', mallData: '', defaultStatus: 'normal', overrideStatus: 'abnormal', reason: '模块内部分内容存在明显排版错位，图片与文字区域间距异常，导致模块视觉层级和对齐关系不一致。', suggestion: '调整图片与文字区域的对齐、间距及容器尺寸，消除异常留白和错位，保持模块整体布局统一。' },
    { fieldName: 'Facebook Group Member Exclusive', mallData: '', defaultStatus: 'normal', overrideStatus: 'normal' },
  ],
};

const productSubFields: Record<string, Array<{ fieldName: string; mallData: string; defaultStatus: ContentStatus }>> = {
  productTitle: [
    { fieldName: '标题内容', mallData: 'ArkPro Liberty Lines | Limited Edition Flat EDC Flashlight', defaultStatus: 'normal' },
    { fieldName: '标题格式', mallData: '符合字数与格式规范', defaultStatus: 'normal' },
  ],
  productMainImage: [
    { fieldName: '主图内容', mallData: `${import.meta.env.BASE_URL}product-main-image.webp`, defaultStatus: 'normal' },
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
  const [currentProduct, setCurrentProduct] = useState<AuditObject | null>(null);
  const [currentPage, setCurrentPage] = useState<AuditObject | null>(null);
  const [keyword, setKeyword] = useState('');
  const [storeName, setStoreName] = useState<string>();
  const [marketingPlan, setMarketingPlan] = useState<string>();
  const [productCategory, setProductCategory] = useState<string>();
  const [productSelectedRowKeys, setProductSelectedRowKeys] = useState<Key[]>([]);
  const [pageSelectedRowKeys, setPageSelectedRowKeys] = useState<Key[]>([]);
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
  const [productDetailStatusFilter, setProductDetailStatusFilter] = useState<ContentStatus[]>(['abnormal', 'unknown', 'empty']);
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

  const runBatchReview = (keys: Key[], clear: () => void) => {
    if (!keys.length) {
      message.warning('请先勾选需要复核的数据');
      return;
    }

    Modal.confirm({
      title: '确认一键复核？',
      content: `已选择 ${keys.length} 条数据，确认提交复核吗？`,
      okText: '确认复核',
      cancelText: '取消',
      onOk: () => {
        message.success(`已提交 ${keys.length} 条数据进行一键复核`);
        clear();
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

  const exportPageAuditData = () => {
    const headers = ['年月', '店铺', '页面ID', '页面名称', '页面启用时间'];
    const rows = filteredPageAuditObjects.map((record) => [
      record.yearMonth || '/',
      record.storeName,
      record.pageId || '/',
      record.pageName || '/',
      record.pageEnabledTime || '/',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `页面复核数据导出-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('页面复核数据已导出');
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
              <div className="product-copyable-cell">
                <Tooltip title={id}>
                  <Typography.Text ellipsis className="product-copyable-text">
                    {id}
                  </Typography.Text>
                </Tooltip>
                <Button
                  className="product-copyable-button"
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
              <div className="product-copyable-cell">
                <Tooltip title={id}>
                  <Typography.Text ellipsis className="product-copyable-text">
                    {id}
                  </Typography.Text>
                </Tooltip>
                <Button
                  className="product-copyable-button"
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
              <div className="product-name-cell">
                <Tooltip title={name}>
                  <Typography.Text strong ellipsis className="product-name-text">
                    {name}
                  </Typography.Text>
                </Tooltip>
                <Button
                  className="product-name-copy"
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
          <Button type="link" onClick={() => setCurrentProduct(record)}>
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
          <Button type="link" onClick={() => setCurrentPage(record)}>
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
              <div className="page-copyable-cell">
                <Tooltip title={id}>
                  <Typography.Text ellipsis className="page-copyable-text">
                    {id || '-'}
                  </Typography.Text>
                </Tooltip>
                {id && (
                  <Button
                    className="page-copyable-button"
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
          width: checkType === '语言书写错误检查' ? 150 : 130,
          align: 'center' as const,
          onHeaderCell: () => ({ style: { whiteSpace: 'nowrap' } }),
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
  if (currentProduct) {
    const cardTitle = (
      <Space>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => setCurrentProduct(null)}
        />
        <Typography.Text strong>复核页面1</Typography.Text>
      </Space>
    );

    const renderProductDetailTables = (failedProductField?: string) => (
      <>
        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8 }}>复核状态：</span>
          <Select
            mode="multiple"
            value={productDetailStatusFilter}
            onChange={(value: ContentStatus[]) => setProductDetailStatusFilter(value)}
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
          {productDetailFields.map((field) => {
            let overallStatus: ContentStatus = currentProduct.pageVisualStatus?.[field.key as keyof typeof currentProduct.pageVisualStatus] || 'unknown';
            const productFailureOverrideInfo = failedProductField ? productFailureOverride[failedProductField] : null;
            if (failedProductField && field.name === '语言书写错误检查') {
              overallStatus = 'abnormal';
            }
            const subFields = productDetailSubFields[field.name] || [];
            const failureInfo = overallStatus === 'abnormal' ? (productFailureOverrideInfo || productDetailFailureInfo[field.name]) : null;

            const tableData = subFields
              .map((subField, index) => {
                let itemStatus: ContentStatus = subField.defaultStatus;
                if (subField.overrideStatus) {
                  itemStatus = subField.overrideStatus;
                } else if (overallStatus === 'abnormal' && index === 0) {
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
                  isImage: subField.isImage,
                  statusLabel: config.label,
                  statusColor: config.color,
                  itemStatus,
                  reason: subField.reason || (itemStatus === 'abnormal' ? (failureInfo?.reason || '-') : '-'),
                  suggestion: itemStatus === 'abnormal' ? (subField.suggestion || failureInfo?.suggestion || '-') : '-',
                };
              })
              .filter((row) => productDetailStatusFilter.includes(row.itemStatus));

            if (tableData.length === 0) return null;

            return (
              <div key={field.key}>
                <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                  {field.name}
                </Typography.Text>
                <Table
                  columns={[
                    { title: (field.name === '模块完整性' || field.name === '排版/布局异常') ? '模块' : '字段名', dataIndex: 'fieldName', width: 120 },
                    ...(field.name === '模块完整性' || field.name === '排版/布局异常' ? [] : [{ title: '当前数据' as const, dataIndex: 'mallData' as const, width: 200, render: (text: string, record: any) => record.isImage ? <img src={text} alt="图片" style={{ width: 80, height: 80, objectFit: 'contain' }} /> : text }]),
                    { title: '复核状态', dataIndex: 'statusLabel', width: 100, render: (text: string, record: any) => <span style={{ color: record.statusColor }}>{text}</span> },
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
                      value={productDetailStatusFilter}
                      onChange={(value: ContentStatus[]) => setProductDetailStatusFilter(value)}
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
                      { title: '当前数据', dataIndex: 'mallData', width: 200, render: (text: any, record: any) => record.key === 'productMainImage' && text !== '-' ? <img src={text} alt="商品主图" style={{ width: 80, height: 80, objectFit: 'contain' }} /> : text },
                      { title: '复核状态', dataIndex: 'statusLabel', width: 100, render: (text: any, record: any) => <span style={{ color: record.statusColor }}>{text}</span> },
                      { title: '原因', dataIndex: 'reason', width: 250 },
                      { title: 'AI建议修改方式', dataIndex: 'suggestion', width: 250 },
                    ]}
                    dataSource={productContentFields.filter((f) => f.key !== 'productDetail' && f.key !== 'productSkuDetail').map((field) => {
                      const overallStatus: ContentStatus = currentProduct.contentStatus?.[field.key as keyof typeof currentProduct.contentStatus] || 'unknown';
                      const subFields = productSubFields[field.key] || [];
                      const override = productFailureOverride[field.name];
                      const riskItem = overallStatus === 'abnormal'
                        ? Object.values(currentProduct.risks).flat().find((risk) => risk.fieldName.includes(field.name))
                        : null;
                      const failureReason = override?.reason || riskItem?.description || '当前字段复核失败，请检查商城内容。';
                      const aiSuggestion = override?.suggestion || riskItem?.suggestion || '建议检查并修正相关内容。';
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
                    }).filter((row) => productDetailStatusFilter.includes(row.itemStatus))}
                    pagination={{ pageSize: 5, showSizeChanger: false, showTotal: (total: number) => `共 ${total} 条` }}
                    size="small"
                  />
                </>
              ),
            },
            {
              key: 'product-detail-page',
              label: '商品详情页',
              children: renderProductDetailTables(currentProduct.contentStatus?.productDetail === 'abnormal' ? '商品详情' : undefined),
            },
            {
              key: 'product-sku-detail-page',
              label: '商品SKU详情页',
              children: renderProductDetailTables(currentProduct.contentStatus?.productSkuDetail === 'abnormal' ? '商品SKU详情' : undefined),
            },
          ]}
        />
      </Card>
    );
  }

  if (currentPage) {
    const cardTitle = (
      <Space>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => setCurrentPage(null)}
        />
        <Typography.Text strong>复核页面1</Typography.Text>
      </Space>
    );

    const renderPageDetailTables = () => (
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
            let overallStatus: ContentStatus = currentPage.pageVisualStatus?.[field.key as keyof typeof currentPage.pageVisualStatus] || 'unknown';
            const subFields = pageVisualSubFields[field.name] || [];
            const failureInfo = overallStatus === 'abnormal' ? pageVisualFailureInfo[field.name] : null;

            const tableData = subFields
              .map((subField, index) => {
                let itemStatus: ContentStatus = subField.defaultStatus;
                if (subField.overrideStatus) {
                  itemStatus = subField.overrideStatus;
                } else if (overallStatus === 'abnormal' && index === 0) {
                  itemStatus = 'abnormal';
                } else if (overallStatus === 'unknown') {
                  itemStatus = 'unknown';
                } else if (overallStatus === 'empty') {
                  itemStatus = 'empty';
                }
                const config = contentStatusConfig[itemStatus];
                return {
                  key: `${field.key}-${index}`,
                  moduleName: subField.moduleName,
                  fieldName: subField.fieldName,
                  mallData: subField.mallData,
                  isImage: subField.isImage,
                  statusLabel: config.label,
                  statusColor: config.color,
                  itemStatus,
                  reason: subField.reason || (itemStatus === 'abnormal' ? (failureInfo?.reason || '-') : '-'),
                  suggestion: itemStatus === 'abnormal' ? (subField.suggestion || failureInfo?.suggestion || '-') : '-',
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
                    ...((field.name === '语言书写错误检查' || field.name === '文案合规检查' || field.name === '本地化合规' || field.name === '信息正确性审核' || field.name === '图片完整性' || field.name === '图片质量' || field.name === '图片尺寸/比例' || field.name === '商品/主体展示' || field.name === '图片内容合规' || field.name === '有效性检查') ? [{ title: '模块名' as const, dataIndex: 'moduleName' as const, width: 120 }] : []),
                    { title: (field.name === '模块完整性' || field.name === '排版/布局异常') ? '模块名' : '字段名', dataIndex: 'fieldName', width: 120 },
                    ...(field.name === '模块完整性' || field.name === '排版/布局异常' ? [] : [{ title: '当前数据' as const, dataIndex: 'mallData' as const, width: 200, render: (text: string, record: any) => record.isImage ? <img src={text} alt="图片" style={{ width: 80, height: 80, objectFit: 'contain' }} /> : text }]),
                    { title: '复核状态', dataIndex: 'statusLabel', width: 100, render: (text: string, record: any) => <span style={{ color: record.statusColor }}>{text}</span> },
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

    return (
      <Card title={cardTitle}>
        {renderPageDetailTables()}
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
      <Space wrap className="product-filter-bar">
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
      <Space wrap className="product-action-bar">
        <Button type="primary" disabled={!productSelectedRowKeys.length} onClick={() => runBatchReview(productSelectedRowKeys, () => setProductSelectedRowKeys([]))}>
          一键复核
        </Button>
        <Button onClick={exportAuditData}>导出</Button>
      </Space>
      <Table
        rowKey="id"
        rowSelection={{
          selectedRowKeys: productSelectedRowKeys,
          onChange: setProductSelectedRowKeys,
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
      <Space wrap className="page-filter-bar">
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
      <Space wrap className="page-action-bar">
        <Button type="primary" disabled={!pageSelectedRowKeys.length} onClick={() => runBatchReview(pageSelectedRowKeys, () => setPageSelectedRowKeys([]))}>
          一键复核
        </Button>
        <Button onClick={exportPageAuditData}>导出</Button>
      </Space>
      <Table
        rowKey="id"
        rowSelection={{
          selectedRowKeys: pageSelectedRowKeys,
          onChange: setPageSelectedRowKeys,
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
