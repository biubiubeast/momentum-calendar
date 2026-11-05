import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '有序 Momentum · 把时间留给重要的事',
  description: '用日历规划行动，以完成率、专注时长和习惯记录看见每一点成长。',
  icons: {icon: '/favicon.svg'},
};
export default function RootLayout({children}: {children: React.ReactNode}) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
