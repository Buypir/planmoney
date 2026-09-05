import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useSettings } from '../context/SettingsContext';

function Sparkline({ color, data }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ width: 90, height: 40 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value, change, changeSuffix, caption, trendColor, trendData }) {
  const { t } = useSettings();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="text-gray-500 dark:text-gray-400 text-sm">{label}</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
          {caption && (
            <p className="text-xs mt-1 text-gray-400">{caption}</p>
          )}
          {!caption && change && (
            <p className={`text-xs mt-1 ${change.startsWith('-') ? 'text-red-500' : 'text-green-600'}`}>
              {change} {changeSuffix || t('stat_since_yesterday')}
            </p>
          )}
        </div>
        {trendData && <Sparkline color={trendColor} data={trendData} />}
      </div>
    </div>
  );
}

export default StatCard;
