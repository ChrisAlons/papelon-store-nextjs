import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import data from "./data.json"

export default function Page() {
  return (
    <div className="p-4">
      <SectionCards />
      <div className="px-4 lg:px-6 mt-4">
        <ChartAreaInteractive />
      </div>
      <div className="mt-4">
        <DataTable data={data} />
      </div>
    </div>
  )
}
