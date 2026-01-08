export async function fetchBackgroundUrl(
  linkId: string,
): Promise<string | null> {
  const url = `https://walltaker.joi.how/links/${linkId}.json`;
  try {
    console.log(`Fetching background URL from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch background");
    const data = await response.json();
    console.log("Fetched data:", data);
    return data.post_url;
  } catch (error) {
    console.error("Error fetching background:", error);
    return null;
  }
}
