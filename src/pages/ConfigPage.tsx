import { InputNumber, Select, Switch, Table, Tabs, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';

type ConfigCategory = '商品';
type ConfigAuditType = '视觉检查' | '文案合规检查' | '本地化检查' | '信息正确性检查' | '视觉合规检查';
type NotificationTiming = '定时审核' | '预热前复核' | 'VIP活动开始前复核' | '正式活动前开始复核';

interface AuditConfig {
  autoAudit: boolean;
  notify: boolean;
  notificationTimings: NotificationTiming[];
  notificationMinutes: number;
  notificationTimingMinutes: Record<NotificationTiming, number>;
  notificationUsers: string[];
}

type ConfigState = Record<ConfigCategory, Record<ConfigAuditType, AuditConfig>>;
interface ConfigRow {
  auditType: ConfigAuditType;
}

const STORAGE_KEY = 'mall-ai-audit-config-v2';
const configCategories: ConfigCategory[] = ['商品'];
const configAuditTypes: ConfigAuditType[] = ['视觉检查', '文案合规检查', '本地化检查', '信息正确性检查', '视觉合规检查'];
const notificationTimingOptions: Array<{ label: string; value: NotificationTiming }> = [
  { label: '定时审核', value: '定时审核' },
  { label: '预热前复核', value: '预热前复核' },
  { label: 'VIP活动开始前复核', value: 'VIP活动开始前复核' },
  { label: '正式活动前开始复核', value: '正式活动前开始复核' },
];
const notificationUserOptions = [
  { label: '创建人', value: '创建人' },
  { label: '张明（运营负责人）', value: '张明' },
  { label: '李婷（商品运营）', value: '李婷' },
  { label: '王磊（广告投放）', value: '王磊' },
  { label: '赵敏（内容审核）', value: '赵敏' },
  { label: '合规审核组', value: '合规审核组' },
];

function buildDefaultConfig(): ConfigState {
  return configCategories.reduce((categoryResult, category) => {
    categoryResult[category] = configAuditTypes.reduce((auditTypeResult, auditType) => {
      auditTypeResult[auditType] = {
        autoAudit: true,
        notify: true,
        notificationTimings: auditType === '视觉检查' ? ['定时审核'] : ['预热前复核'],
        notificationMinutes: auditType === '视觉检查' ? 30 : 15,
        notificationTimingMinutes: {
          定时审核: 30,
          预热前复核: 15,
          VIP活动开始前复核: 20,
          正式活动前开始复核: 10,
        },
        notificationUsers: ['创建人'],
      };
      return auditTypeResult;
    }, {} as Record<ConfigAuditType, AuditConfig>);

    return categoryResult;
  }, {} as ConfigState);
}

function normalizeTiming(timing: string): NotificationTiming {
  if (timing === '正式开始前复核' || timing === '正式活动开始前复核') {
    return '正式活动前开始复核';
  }
  if (timing === '定时复核') {
    return '定时审核';
  }

  return timing as NotificationTiming;
}

function getMinutePrefix(notificationTiming: NotificationTiming) {
  return notificationTiming === '定时审核' ? '每' : '前';
}

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigState>(buildDefaultConfig);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsedConfig = JSON.parse(stored) as Partial<ConfigState>;
      const defaultConfig = buildDefaultConfig();
      const mergedConfig = configCategories.reduce((categoryResult, category) => {
        categoryResult[category] = configAuditTypes.reduce((auditTypeResult, auditType) => {
          const storedConfig = parsedConfig[category]?.[auditType];
          const legacyStoredConfig = storedConfig as Partial<AuditConfig> & {
            notificationTiming?: string;
            notificationTimings?: string[];
            notificationTimingMinutes?: Partial<Record<NotificationTiming | string, number>>;
          } | undefined;
          const rawStoredTiming = legacyStoredConfig?.notificationTiming;
          const storedTiming = rawStoredTiming ? normalizeTiming(rawStoredTiming) : undefined;
          const rawStoredTimings = legacyStoredConfig?.notificationTimings;
          const storedTimings = Array.isArray(rawStoredTimings)
            ? (rawStoredTimings as string[]).map(normalizeTiming)
            : storedTiming
              ? [storedTiming]
              : undefined;
          const storedTimingMinutes = Object.entries(legacyStoredConfig?.notificationTimingMinutes || {}).reduce(
            (result, [timing, minutes]) => {
              result[normalizeTiming(timing)] = minutes || defaultConfig[category][auditType].notificationTimingMinutes[normalizeTiming(timing)];
              return result;
            },
            {} as Record<NotificationTiming, number>,
          );

          auditTypeResult[auditType] = {
            ...defaultConfig[category][auditType],
            ...(storedConfig || {}),
            ...(storedTimings ? { notificationTimings: storedTimings as NotificationTiming[] } : {}),
            notificationTimingMinutes: {
              ...defaultConfig[category][auditType].notificationTimingMinutes,
              ...storedTimingMinutes,
            },
          };
          return auditTypeResult;
        }, {} as Record<ConfigAuditType, AuditConfig>);

        return categoryResult;
      }, {} as ConfigState);

      setConfig(mergedConfig);
    } catch {
      message.warning('配置缓存读取失败，已使用默认配置');
    }
  }, []);

  const updateConfig = <K extends keyof AuditConfig>(
    category: ConfigCategory,
    auditType: ConfigAuditType,
    key: K,
    value: AuditConfig[K],
  ) => {
    const nextConfig = {
      ...config,
      [category]: {
        ...config[category],
        [auditType]: {
          ...config[category][auditType],
          [key]: value,
        },
      },
    };

    setConfig(nextConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
  };

  const updateTimingMinutes = (
    category: ConfigCategory,
    auditType: ConfigAuditType,
    timing: NotificationTiming,
    minutes: number,
  ) => {
    const nextTimingMinutes = {
      ...config[category][auditType].notificationTimingMinutes,
      [timing]: minutes,
    };

    updateConfig(category, auditType, 'notificationTimingMinutes', nextTimingMinutes);
  };

  const renderCategoryConfig = (category: ConfigCategory) => {
    const rows: ConfigRow[] = configAuditTypes.map((auditType) => ({ auditType }));
    const columns: ColumnsType<ConfigRow> = [
      {
        title: '检查类型',
        dataIndex: 'auditType',
        width: 190,
        render: (auditType: ConfigAuditType) => <Typography.Text strong>{auditType}</Typography.Text>,
      },
      {
        title: '启用检查',
        dataIndex: 'autoAudit',
        width: 760,
        render: (_, record) => (
          <div className="config-enable-cell">
            <Switch
              checked={config[category][record.auditType]?.autoAudit}
              checkedChildren="开启"
              unCheckedChildren="关闭"
              onChange={(checked) => updateConfig(category, record.auditType, 'autoAudit', checked)}
            />
            <Select
              className="config-timing-select"
              mode="multiple"
              value={config[category][record.auditType]?.notificationTimings}
              disabled={!config[category][record.auditType]?.autoAudit}
              options={notificationTimingOptions}
              onChange={(value) => updateConfig(category, record.auditType, 'notificationTimings', value)}
              style={{ width: 310 }}
            />
            <div className="config-minute-list">
              {config[category][record.auditType]?.notificationTimings.map((timing) => (
                <div className="config-minute-row" key={timing}>
                  <Typography.Text type={config[category][record.auditType]?.autoAudit ? undefined : 'secondary'}>
                    {getMinutePrefix(timing)}
                  </Typography.Text>
                  <InputNumber
                    className="config-minute-input"
                    min={1}
                    max={1440}
                    precision={0}
                    controls={false}
                    value={config[category][record.auditType]?.notificationTimingMinutes[timing]}
                    disabled={!config[category][record.auditType]?.autoAudit}
                    addonAfter="分钟"
                    onChange={(value) => updateTimingMinutes(category, record.auditType, timing, value || 1)}
                    style={{ width: 148 }}
                  />
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        title: '检查通知',
        dataIndex: 'notification',
        width: 350,
        render: (_, record) => (
          <div className="config-notice-cell">
            <Switch
              checked={config[category][record.auditType]?.notify}
              checkedChildren="开启"
              unCheckedChildren="关闭"
              onChange={(checked) => updateConfig(category, record.auditType, 'notify', checked)}
            />
            <Select
              mode="multiple"
              value={config[category][record.auditType]?.notificationUsers}
              disabled={!config[category][record.auditType]?.notify}
              options={notificationUserOptions}
              onChange={(value) => updateConfig(category, record.auditType, 'notificationUsers', value)}
              style={{ width: 260 }}
            />
          </div>
        ),
      },
    ];

    return (
      <Table
        className="config-table"
        rowKey="auditType"
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: 1300 }}
      />
    );
  };

  return (
    <Tabs
      className="config-top-tabs"
      defaultActiveKey="商品"
      items={[
        {
          key: '商品',
          label: '商品',
          children: renderCategoryConfig('商品'),
        },
      ]}
    />
  );
}
