import Card from "./buildingBlocks/Card"
import Flex from "./buildingBlocks/Flex"
import Page from "./buildingBlocks/Page"

const Home = () => {
  return (
    <Page>
      <Flex
        col
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 100,
        }}
      >
        <Card>
          <Flex
            style={{
              width: 500,
              height: 200,
            }}
          >
            <h2>Welcome to your new project!</h2>
          </Flex>
        </Card>
      </Flex>
    </Page>
  )
}

export default Home
