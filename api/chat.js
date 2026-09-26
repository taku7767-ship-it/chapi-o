export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        error: "メッセージがありません"
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          instructions:
            "あなたはハムスターAI『ちゃぴお』です。親しみやすく、優しく、かわいらしい日本語で話してください。ユーザーの質問には普通のAIアシスタントとして役立つ回答をしてください。必要以上に長くせず、自然な会話をしてください。",
          input: message
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data.error?.message ||
          "OpenAI APIでエラーが発生しました"
      });
    }

    const reply =
      data.output
        ?.filter((item) => item.type === "message")
        ?.flatMap((item) => item.content || [])
        ?.filter((content) => content.type === "output_text")
        ?.map((content) => content.text)
        ?.join("") || "";

    if (!reply) {
      return res.status(500).json({
        error: "OpenAIから返答テキストを取得できませんでした"
      });
    }

    return res.status(200).json({
      reply
    });
  } catch (error) {
    return res.status(500).json({
      error: "サーバーエラーが発生しました"
    });
  }
}
