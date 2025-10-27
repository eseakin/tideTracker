import { Extreme } from "#customTypes/dataTypes"
import { Button } from "antd"
import dayjs from "dayjs"
import { useState } from "react"
import Flex from "./buildingBlocks/Flex"
import Page from "./buildingBlocks/Page"
import TideChart from "./TideChart"

const STATION_IDS = {
  MONTEREY: 9413450,
}

const DATE_FORMAT = "YYYYMMDD"
const STARTING_DATE = dayjs("2025-11-05")

const getUrl = () => {
  const base = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter"
  const begin_date = STARTING_DATE.format(DATE_FORMAT)
  const end_date = STARTING_DATE.add(7, "day").format(DATE_FORMAT)
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
  const onClick = () => {
    const url = getUrl()
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log(data.predictions)
        setExtremes(data.predictions)
      })
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
        <h2>Tide tracker!</h2>
        <Flex>
          <Button onClick={onClick}>Get tide data</Button>
        </Flex>
        <div style={{ width: "90%", maxWidth: 1200, height: 500 }}>
          <TideChart extremes={extremes} stepMin={1} showMarkers />
        </div>
      </Flex>
    </Page>
  )
}

export default Home
