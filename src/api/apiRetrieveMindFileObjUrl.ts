import type { TObjectUrl } from "../types/aliases/TObjectUrl";
import type { TApiReturn } from "../types/api/TApiReturn";

export default async function apiRetrieveMindFileObjUrl({
  url,
}: {
  url: TObjectUrl;
}): Promise<TApiReturn<TObjectUrl>> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error();
    }
    const buffer = await response.arrayBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const blobUrl = URL.createObjectURL(blob);
    return {
      success: true,
      data: blobUrl,
    };
  } catch {
    return {
      success: false,
    };
  }
}
