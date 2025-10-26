enum ApiRoutes {
  home = `/api/home`,
}

class ApiHandler {
  constructor() {}

  async callApi<T, R>(
    data: T,
    method: "POST" | "GET" = "GET",
    route: ApiRoutes = ApiRoutes.home
  ): Promise<R> {
    const response = (await fetch(route, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })) as Response

    if (!response.ok) {
      throw new Error("Failed to call API")
    }

    return await response.json()
  }
}

export default ApiHandler
