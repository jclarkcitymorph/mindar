import type { TDecomposedUrlData } from "../../types/models/application/TDecomposedUrlData";

export default function decomposeUrl(): TDecomposedUrlData {
  const url = new URL(window.location.href);
  console.log(url.host);
  console.log(url.hostname);
  console.log(url.pathname);
  console.log(url.origin);
  console.log(url.port);
  console.log(url.hash);
  console.log(url.href);
  console.log(url.search);
  console.log(url.searchParams);
  return {
    base: "",
    params: {},
  };
}
