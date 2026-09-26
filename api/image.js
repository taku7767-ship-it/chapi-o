export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const contentType = req.headers["content-type"] || "";

    // 画像生成
    if (contentType.includes("application/json")) {
      const { prompt } = req.body || {};

      if (!prompt) {
        return res.status(400).json({
          error: "プロンプトがありません"
        });
      }

      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-image-2.5-flare",
            prompt,
            size: "1024x1024",
            quality: "medium",
            output_format: "png"
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error:
            data.error?.message ||
            "画像生成でエラーが発生しました"
        });
      }

      return res.status(200).json({
        image: data.data?.[0]?.b64_json
      });
    }

    // 画像編集
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      const image = formData.get("image");
      const prompt = formData.get("prompt");

      if (!image || !prompt) {
        return res.status(400).json({
          error: "画像または編集内容がありません"
        });
      }

      const openaiForm = new FormData();

      openaiForm.append("model", "gpt-image-2.5-flare");
      openaiForm.append("prompt", prompt);
      openaiForm.append("size", "1024x1024");
      openaiForm.append("quality", "medium");
      openaiForm.append("image", image);

      const response = await fetch(
        "https://api.openai.com/v1/images/edits",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: openaiForm
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error:
            data.error?.message ||
            "画像編集でエラーが発生しました"
        });
      }

      return res.status(200).json({
        image: data.data?.[0]?.b64_json
      });
    }

    return res.status(400).json({
      error: "対応していないリクエストです"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "画像処理中にエラーが発生しました"
    });
  }
}
