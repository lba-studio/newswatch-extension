import axios from "axios";

const URL = "https://7nt3fnilxl.execute-api.ap-southeast-1.amazonaws.com";

export async function getSentiment(
  text: string,
  bearerToken: string
): Promise<number> {
  const result = await axios
    .post(
      `${URL}/analyze-sentiment`,
      { text: text },
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    )
    .then((response) => response.data);
  return result;
}
