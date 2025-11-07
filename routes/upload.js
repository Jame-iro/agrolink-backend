// Test route to verify ImgBB API key
router.post("/test-imgbb", async (req, res) => {
  try {
    if (!process.env.IMGBB_API_KEY) {
      return res.json({ error: "IMGBB_API_KEY not set" });
    }

    // Test with a small base64 image
    const testImage =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    const formData = new FormData();
    formData.append("image", testImage);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 10000,
      }
    );

    res.json({
      apiKeyWorking: response.data.success,
      imgbbResponse: response.data,
    });
  } catch (error) {
    res.json({
      apiKeyWorking: false,
      error: error.message,
      imgbbError: error.response?.data,
    });
  }
});
