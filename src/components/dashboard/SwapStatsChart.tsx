import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

interface SwapStatsChartProps {
  data: Array<{ name: string; taught: number; learned: number }>
  width: number
  height: number
  chartGridColor: string
}

export function SwapStatsChart({ data, width, height, chartGridColor }: SwapStatsChartProps) {
  return (
    <BarChart data={data} height={height} width={width}>
      <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Bar dataKey="taught" fill="#4f46e5" radius={[16, 16, 0, 0]} />
      <Bar dataKey="learned" fill="#14b8a6" radius={[16, 16, 0, 0]} />
    </BarChart>
  )
}
export default SwapStatsChart
