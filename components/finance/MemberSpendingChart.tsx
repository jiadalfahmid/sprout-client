import React from 'react';
import { Transaction, TransactionType, FamilyMember } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import Card from '../ui/Card';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import { useTranslation } from '../../hooks/useTranslation';

interface MemberSpendingProps {
  transactions: Transaction[];
  familyMembers: FamilyMember[];
  currentDate: Date;
  currencySymbol: string;
  theme: 'light' | 'dark';
}

const MEMBER_COLORS = [
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export const MemberSpendingChart: React.FC<MemberSpendingProps> = ({
  transactions,
  familyMembers,
  currentDate,
  currencySymbol,
  theme,
}) => {
  const { t, language } = useTranslation();

  // Filter current month expense transactions
  const monthExpenses = transactions.filter((t) => {
    const txDate = new Date(t.date);
    return (
      t.type === TransactionType.EXPENSE &&
      txDate.getMonth() === currentDate.getMonth() &&
      txDate.getFullYear() === currentDate.getFullYear()
    );
  });

  const totalExpense = monthExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Group by memberId
  const spendingByMemberMap = new Map<string, { id: string; name: string; avatar?: string; amount: number; color: string }>();

  // Initialize all family members with 0
  familyMembers.forEach((member, index) => {
    spendingByMemberMap.set(member.id, {
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      amount: 0,
      color: MEMBER_COLORS[index % MEMBER_COLORS.length],
    });
  });

  // Track unassigned / shared family expenses
  let sharedExpense = 0;

  monthExpenses.forEach((t) => {
    if (t.memberId && spendingByMemberMap.has(t.memberId)) {
      const entry = spendingByMemberMap.get(t.memberId)!;
      entry.amount += t.amount;
    } else {
      sharedExpense += t.amount;
    }
  });

  if (sharedExpense > 0 || spendingByMemberMap.size === 0) {
    spendingByMemberMap.set('shared', {
      id: 'shared',
      name: t('finance.memberSpending.shared') || 'Family (Shared)',
      amount: sharedExpense,
      color: '#64748B',
    });
  }

  // Show all members sorted by amount
  const spendingList = Array.from(spendingByMemberMap.values())
    .sort((a, b) => b.amount - a.amount);

  const chartData = spendingList.map((item) => ({
    id: item.id,
    name: item.name.length > 10 ? `${item.name.slice(0, 9)}…` : item.name,
    fullName: item.name,
    amount: parseFloat(item.amount.toFixed(2)),
    color: item.color,
  }));

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-light-text-primary dark:text-text-primary">
            {t('finance.memberSpending.title') || 'Spending by Person'}
          </h2>
          <p className="text-xs text-light-text-secondary dark:text-text-secondary">
            {t('finance.memberSpending.subtitle') || 'Monthly expense breakdown per family member'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-light-text-secondary dark:text-text-secondary">
            {t('finance.totalExpenses') || 'Total Expenses'}
          </p>
          <p className="text-sm sm:text-base font-bold text-expense">
            {currencySymbol}{totalExpense.toFixed(2)}
          </p>
        </div>
      </div>

      {totalExpense > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Bar Chart */}
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: theme === 'dark' ? '#a1a1aa' : '#64748b', fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fill: theme === 'dark' ? '#a1a1aa' : '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `${currencySymbol}${val}`}
                />
                <Tooltip
                  cursor={{ fill: theme === 'dark' ? '#27272a' : '#f1f5f9' }}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#27272a' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#3f3f46' : '#e2e8f0'}`,
                    borderRadius: '0.75rem',
                  }}
                  formatter={(val: number) => [`${currencySymbol}${val.toFixed(2)}`, t('finance.memberSpending.spent') || 'Spent']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.id}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* List Breakdown with progress bars */}
          <div className="space-y-3">
            {spendingList.map((item) => {
              const percentage = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-4 h-4 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] text-white font-bold"
                          style={{ backgroundColor: item.color }}
                        >
                          <HiOutlineUserGroup className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <span className="font-semibold text-light-text-primary dark:text-text-primary truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-medium">
                      <span className="text-light-text-secondary dark:text-text-secondary">
                        {percentage}%
                      </span>
                      <span className="font-bold text-light-text-primary dark:text-text-primary">
                        {currencySymbol}{item.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary">
          {t('finance.memberSpending.noExpenses', {
            date: currentDate.toLocaleString(language || 'en', { month: 'long', year: 'numeric' })
          }) || `No expenses recorded for ${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })} yet.`}
        </div>
      )}
    </Card>
  );
};

export default MemberSpendingChart;
