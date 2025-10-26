import { Empty } from "antd"

import Flex from "#blocks/Flex"

const EmptyState = ({ description }: { description?: string }) => {
  return (
    <Flex
      center
      style={{
        height: "100%",
        maxHeight: 400,
        width: "100%",
      }}
    >
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
    </Flex>
  )
}

export default EmptyState
