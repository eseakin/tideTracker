import { Extreme } from "#customTypes/dataTypes"
import { Button } from "antd"
import dayjs, { Dayjs } from "dayjs"
import { useEffect, useState } from "react"
import Flex from "./buildingBlocks/Flex"
import Page from "./buildingBlocks/Page"
import TideChart from "./TideChart"

const STATION_IDS = {
  MONTEREY: 9413450,
}

const DATE_FORMAT = "YYYYMMDD"
const STARTING_DATE = dayjs()

const getUrl = (baseDate: Dayjs) => {
  const base = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter"
  const begin_date = baseDate.format(DATE_FORMAT)
  const end_date = baseDate.add(7, "day").format(DATE_FORMAT)
  const station = STATION_IDS.MONTEREY
  const product = "predictions"
  const datum = "MLLW"
  const time_zone = "lst_ldt"
  const interval = "hilo"
  const units = "english"
  const application = "DataAPI_Sample"
  const format = "json"
  const url = `${base}?begin_date=${begin_date}&end_date=${end_date}&station=${station}&product=${product}&datum=${datum}&time_zone=${time_zone}&interval=${interval}&units=${units}&application=${application}&format=${format}`
  return url
}

const Home = () => {
  const [extremes, setExtremes] = useState<Extreme[]>([])
  const [displayDate, setDisplayDate] = useState(STARTING_DATE)

  const fetchData = () => {
    const url = getUrl(displayDate)
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log(data.predictions)
        setExtremes(data.predictions)
      })
      .catch((err) => {
        console.error("Failed to fetch tide data:", err)
        setExtremes([])
      })
  }

  useEffect(() => {
    fetchData()
  }, [displayDate])

  const shiftDate = (days: number) => {
    setDisplayDate((d) => d.add(days, "day"))
  }

  return (
    <Page>
      <Flex
        col
        grow
        gap={40}
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 100,
        }}
      >
        <h1 style={{ color: "white", fontSize: 36 }}>Upcoming Tides</h1>
        <Flex gap={20}>
          <Button
            onClick={() => shiftDate(-7)}
            style={{
              backgroundColor: "#2e8bc0",
              color: "white",
              borderColor: "#2e8bc0",
              padding: "20px",
            }}
          >
            ← Week Before
          </Button>
          <Button
            onClick={() => shiftDate(+7)}
            style={{
              backgroundColor: "#2e8bc0",
              color: "white",
              borderColor: "#2e8bc0",
              padding: "20px",
            }}
          >
            Week After →
          </Button>
        </Flex>
        <div style={{ width: "90%", height: 500 }}>
          <TideChart extremes={extremes} stepMin={1} showMarkers />
        </div>
      </Flex>
    </Page>
  )
}

export default Home
